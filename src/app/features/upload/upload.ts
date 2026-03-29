import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiinService } from '../../core/services/apiin';
import { UsuarioService } from '../../core/services/usuario';
import { CancionService } from '../../core/services/cancion';

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './upload.html',
  styleUrl: './upload.css'
})
export class Upload implements OnInit {
  texto: string = '';
  cargando: boolean = false;
  isLoggedIn: boolean = false;
  errorMensaje: string = '';
  exitoMensaje: string = '';

  constructor(
    private apiinService: ApiinService,
    private usuarioService: UsuarioService,
    private cancionService: CancionService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const savedUser = localStorage.getItem('melodia_user');
    this.isLoggedIn = !!savedUser;
    window.addEventListener('usuarioCargado', () => {
      this.isLoggedIn = true;
      this.cdr.detectChanges();
    });
    window.addEventListener('usuarioCerroSesion', () => {
      this.isLoggedIn = false;
      this.cdr.detectChanges();
    });
  }

  mostrarError(mensaje: string): void {
    this.errorMensaje = mensaje;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.errorMensaje = '';
      this.cdr.detectChanges();
    }, 4000);
  }

  mostrarExito(mensaje: string): void {
    this.exitoMensaje = mensaje;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.exitoMensaje = '';
      this.cdr.detectChanges();
    }, 3000);
  }

  async generarCancion(): Promise<void> {
    if (!this.texto.trim()) {
      this.mostrarError('✏️ Escribe cómo te sientes para generar tu canción');
      return;
    }

    if (this.texto.trim().length < 5) {
      this.mostrarError('✏️ Describe un poco más cómo te sientes');
      return;
    }

    this.cargando = true;
    this.errorMensaje = '';
    this.cdr.detectChanges();
    this.cancionService.setCargando(true);
    this.cancionService.setCancion(null);

    try {
      const res: any = await this.apiinService
        .generarCancionCompleta(this.texto)
        .toPromise();

      if (!res || !res.content || !res.content[0]) {
        this.mostrarError('❌ Error al conectar con la IA. Intenta de nuevo.');
        return;
      }

      let data: any;
      try {
        data = JSON.parse(
          res.content[0].text.replace(/```json|```/g, '').trim()
        );
      } catch (e) {
        this.mostrarError('❌ Error procesando la respuesta. Intenta de nuevo.');
        return;
      }

      if (!data.letra) {
        this.mostrarError('❌ No se pudo generar la letra. Intenta con otro texto.');
        return;
      }

      const user = localStorage.getItem('melodia_user');
      const usuarioId = localStorage.getItem('melodia_user_id');
      const isLoggedIn = !!(user && usuarioId);

      if (isLoggedIn) {
        try {
          await this.usuarioService.guardarHistorial({
            usuario_id: usuarioId,
            mood: data.mood,
            letra: data.letra,
            task_id: '',
            imagen_ruta: '',
            titulo: `MelodIA - ${data.mood}`
          }).toPromise();
        } catch (e) {
          console.error('Error guardando historial:', e);
        }
      }

      this.mostrarExito('🎵 ¡Canción generada exitosamente!');

      this.cancionService.setCancion({
        letra: data.letra,
        mood: data.mood,
        moodData: data,
        isLoggedIn
      });

    } catch (error: any) {
      console.error('Error:', error);
      if (error?.status === 0) {
        this.mostrarError('🌐 Error de conexión. Verifica tu internet e intenta de nuevo.');
      } else if (error?.status === 429) {
        this.mostrarError('⏳ Demasiadas solicitudes. Espera un momento e intenta de nuevo.');
      } else if (error?.status === 500) {
        this.mostrarError('🔧 Error en el servidor. Intenta de nuevo en unos segundos.');
      } else {
        this.mostrarError('❌ Error al generar la canción. Intenta de nuevo.');
      }
    } finally {
      this.cargando = false;
      this.cdr.detectChanges();
      this.cancionService.setCargando(false);
    }
  }
}
