import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ApiinService } from '../../core/services/apiin';
import { UsuarioService } from '../../core/services/usuario';
import { CancionService } from '../../core/services/cancion';

@Component({
  selector: 'app-player',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './player.html',
  styleUrl: './player.css'
})
export class Player implements OnInit, OnDestroy {
  cargando = false;
  cargandoMusica = false;
  lyrics: { text: string; tipo: string; active: boolean }[] = [];
  lyricsDisplay: { text: string; tipo: string; active: boolean }[] = [];
  mood: string = '';
  genero: string = 'ballad';
  cancionGenerada = false;
  musicaGenerada = false;
  audioUrl: string = '';
  isPlaying = false;
  tiempoEspera = 0;
  isLoggedIn = false;
  lineaActual = -1;
  barras = Array.from({ length: 20 }, (_, i) => i);
  alturas: number[] = Array(20).fill(5);
  moodColor = '#c084fc';

  private cancionSub!: Subscription;
  private cargandoSub!: Subscription;
  private typingInterval: any;
  private karaokeInterval: any;
  private ondasInterval: any;
  private tiempoInterval: any;
  private pollingInterval: any;

  moodColores: Record<string, string> = {
    'melancólico': '#818cf8', 'melancólica': '#818cf8',
    'triste': '#818cf8', 'tristeza': '#818cf8',
    'feliz': '#fbbf24', 'alegre': '#fbbf24', 'alegría': '#fbbf24',
    'romántico': '#f472b6', 'romántica': '#f472b6', 'amor': '#f472b6',
    'energético': '#34d399', 'energía': '#34d399',
    'relajado': '#67e8f9', 'relajada': '#67e8f9',
    'nostálgico': '#a78bfa', 'nostálgica': '#a78bfa',
    'enojado': '#f87171', 'enojada': '#f87171',
  };

  constructor(
    private cancionService: CancionService,
    private apiinService: ApiinService,
    private usuarioService: UsuarioService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargandoSub = this.cancionService.cargando$.subscribe(cargando => {
      this.cargando = cargando;
      if (cargando) {
        this.cancionGenerada = false;
        this.musicaGenerada = false;
        this.audioUrl = '';
        this.lyricsDisplay = [];
        this.lineaActual = -1;
        this.tiempoEspera = 0;
        this.detenerKaraoke();
        this.detenerOndas();
        if (this.pollingInterval) clearInterval(this.pollingInterval);
        if (this.tiempoInterval) clearInterval(this.tiempoInterval);
      }
      this.cdr.detectChanges();
    });

    this.cancionSub = this.cancionService.cancion$.subscribe(detail => {
      if (detail) this.recibirCancion(detail);
    });

    const savedUser = localStorage.getItem('melodia_user');
    this.isLoggedIn = !!savedUser;
    window.addEventListener('usuarioCargado', () => { this.isLoggedIn = true; });
    window.addEventListener('usuarioCerroSesion', () => { this.isLoggedIn = false; });
  }

  ngOnDestroy(): void {
    this.cancionSub?.unsubscribe();
    this.cargandoSub?.unsubscribe();
    this.detenerKaraoke();
    this.detenerOndas();
    if (this.typingInterval) clearInterval(this.typingInterval);
    if (this.tiempoInterval) clearInterval(this.tiempoInterval);
    if (this.pollingInterval) clearInterval(this.pollingInterval);
  }

  async recibirCancion(detail: any): Promise<void> {
    this.cargando = false;
    this.mood = detail.mood;
    this.genero = detail.moodData?.genero || 'ballad';
    this.isLoggedIn = detail.isLoggedIn || this.isLoggedIn;

    const moodKey = detail.mood?.toLowerCase() || '';
    this.moodColor = this.moodColores[moodKey] || '#c084fc';

    const lineas = detail.letra.split('\n');
    let seccionIndex = 0;
    const secciones = ['Verso 1', 'Coro', 'Verso 2', 'Coro', 'Puente', 'Coro Final'];
    this.lyrics = [];
    let lineasEnBlanco = 0;

    lineas.forEach((text: string) => {
      if (text.trim() === '') {
        lineasEnBlanco++;
        if (lineasEnBlanco === 1) {
          this.lyrics.push({ text: '', tipo: 'separador', active: false });
          seccionIndex++;
          if (seccionIndex < secciones.length) {
            this.lyrics.push({ text: secciones[seccionIndex], tipo: 'seccion', active: false });
          }
        }
      } else {
        lineasEnBlanco = 0;
        this.lyrics.push({ text, tipo: 'letra', active: false });
      }
    });

    if (this.lyrics.length > 0) {
      this.lyrics.unshift({ text: secciones[0], tipo: 'seccion', active: false });
    }

    this.lyricsDisplay = [];
    this.lineaActual = -1;
    this.cancionGenerada = true;
    this.cdr.detectChanges();
    this.animarLetras();

    // Generar música solo si está logueado
    if (!this.isLoggedIn) return;

    this.cargandoMusica = true;
    this.iniciarContador();
    this.cdr.detectChanges();

    try {
      const musicaRes: any = await this.apiinService
        .generarMusica(detail.letra, this.genero, this.mood)
        .toPromise();

      console.log('Respuesta Suno:', musicaRes);

      const taskId = musicaRes?.data?.task_id ||
                     musicaRes?.task_id ||
                     musicaRes?.workId ||
                     musicaRes?.data?.workId;

      if (taskId) {
        // Guardar historial con task_id
        const usuarioId = localStorage.getItem('melodia_user_id');
        if (usuarioId) {
          await this.usuarioService.guardarHistorial({
            usuario_id: usuarioId,
            mood: this.mood,
            letra: detail.letra,
            task_id: taskId,
            imagen_ruta: '',
            titulo: `MelodIA - ${this.mood}`
          }).toPromise().catch(e => console.error('Error guardando historial:', e));
        }
        await this.esperarAudio(taskId);
      }

    } catch (error) {
      console.error('Error generando música:', error);
    } finally {
      this.cargandoMusica = false;
      if (this.tiempoInterval) clearInterval(this.tiempoInterval);
      this.cdr.detectChanges();
    }
  }

  async esperarAudio(taskId: string): Promise<void> {
    const maxIntentos = 40;
    let intentos = 0;

    return new Promise((resolve) => {
      this.pollingInterval = setInterval(async () => {
        intentos++;
        try {
          const res: any = await this.apiinService.verificarAudio(taskId).toPromise();
          if (res.audio_url) {
            this.audioUrl = res.audio_url;
            this.musicaGenerada = true;
            this.cdr.detectChanges();
            clearInterval(this.pollingInterval);
            resolve();
          } else if (intentos >= maxIntentos) {
            clearInterval(this.pollingInterval);
            resolve();
          }
        } catch {
          if (intentos >= maxIntentos) {
            clearInterval(this.pollingInterval);
            resolve();
          }
        }
      }, 3000);
    });
  }

  iniciarContador(): void {
    this.tiempoEspera = 0;
    this.tiempoInterval = setInterval(() => {
      this.tiempoEspera++;
      this.cdr.detectChanges();
    }, 1000);
  }

  animarLetras(): void {
    let index = 0;
    if (this.typingInterval) clearInterval(this.typingInterval);

    this.typingInterval = setInterval(() => {
      if (index < this.lyrics.length) {
        this.lyricsDisplay.push({ ...this.lyrics[index] });
        index++;
        this.cdr.detectChanges();
      } else {
        clearInterval(this.typingInterval);
        this.iniciarKaraoke();
        this.iniciarOndas();
      }
    }, 90);
  }

  iniciarKaraoke(): void {
    this.detenerKaraoke();
    const lineasLetra = this.lyricsDisplay
      .map((l, i) => ({ ...l, index: i }))
      .filter(l => l.tipo === 'letra');

    if (lineasLetra.length === 0) return;
    let karaokeIndex = 0;

    this.karaokeInterval = setInterval(() => {
      this.lyricsDisplay.forEach(l => l.active = false);
      if (karaokeIndex < lineasLetra.length) {
        this.lyricsDisplay[lineasLetra[karaokeIndex].index].active = true;
        this.lineaActual = lineasLetra[karaokeIndex].index;
        karaokeIndex++;
      } else {
        karaokeIndex = 0;
      }
      this.cdr.detectChanges();
    }, 2000);
  }

  iniciarOndas(): void {
    this.detenerOndas();
    this.ondasInterval = setInterval(() => {
      this.alturas = this.alturas.map(() => Math.floor(Math.random() * 35) + 5);
      this.cdr.detectChanges();
    }, 120);
  }

  detenerKaraoke(): void {
    if (this.karaokeInterval) { clearInterval(this.karaokeInterval); this.karaokeInterval = null; }
  }

  detenerOndas(): void {
    if (this.ondasInterval) {
      clearInterval(this.ondasInterval);
      this.ondasInterval = null;
      this.alturas = Array(20).fill(5);
    }
  }

  togglePlay(): void {
    if (!this.audioUrl) return;
    this.isPlaying = !this.isPlaying;
    const audio = document.getElementById('audioPlayer') as HTMLAudioElement;
    if (audio) { this.isPlaying ? audio.play() : audio.pause(); }
  }

  descargar(): void {
    if (this.audioUrl) {
      const a = document.createElement('a');
      a.href = this.audioUrl;
      a.download = `melodia-${this.mood}.mp3`;
      a.target = '_blank';
      a.click();
    }
    const letra = this.lyrics.filter(l => l.tipo !== 'seccion').map(l => l.text).join('\n');
    const blob = new Blob([letra], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `letra-${this.mood}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }
}