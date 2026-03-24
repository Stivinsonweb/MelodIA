import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-player',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './player.html',
  styleUrl: './player.css'
})
export class Player implements OnInit, OnDestroy {
  isPlaying = false;
  cargando = false;
  lyrics: { text: string; active: boolean }[] = [];
  mood: string = '';
  cancionGenerada = false;
  private cancionListener: any;

  ngOnInit(): void {
    this.cancionListener = (event: any) => {
      this.recibirCancion(event.detail);
    };
    window.addEventListener('cancionGenerada', this.cancionListener);

    this.lyrics = [
      { text: 'Bajo el cielo de agosto', active: true },
      { text: 'recuerdo tu sonrisa al atardecer', active: true },
      { text: 'el viento susurra tu nombre', active: false },
      { text: 'y yo no puedo olvidarte', active: false },
      { text: '— Estribillo —', active: false },
      { text: 'Vuelve, vuelve a mí', active: false },
      { text: 'como la lluvia al mar', active: false },
      { text: 'que sin ti el mundo no tiene color', active: false },
    ];
  }

  ngOnDestroy(): void {
    window.removeEventListener('cancionGenerada', this.cancionListener);
  }

  recibirCancion(detail: any): void {
    this.mood = detail.mood;
    const lineas = detail.letra.split('\n').filter((l: string) => l.trim());
    this.lyrics = lineas.map((text: string, i: number) => ({
      text,
      active: i < 2
    }));
    this.cancionGenerada = true;
  }

  togglePlay(): void {
    this.isPlaying = !this.isPlaying;
  }

  descargar(): void {
    const letra = this.lyrics.map(l => l.text).join('\n');
    const blob = new Blob([letra], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `letra-${this.mood}.txt`;
    a.click();
  }
}