import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsuarioService } from '../../../core/services/usuario';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './history.html',
  styleUrl: './history.css'
})
export class History implements OnInit {
  isLoggedIn = false;
  historial: any[] = [];
  usuariosRecientes: any[] = [];
  cargando = false;

  constructor(
    private usuarioService: UsuarioService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const savedUser = localStorage.getItem('melodia_user');
    if (savedUser) {
      this.isLoggedIn = true;
      this.cargarHistorial();
    }

    this.cargarUsuariosRecientes();

    window.addEventListener('usuarioCargado', () => {
      this.isLoggedIn = true;
      this.cdr.detectChanges();
      this.cargarHistorial();
      this.cargarUsuariosRecientes();
    });

    window.addEventListener('usuarioCerroSesion', () => {
      this.isLoggedIn = false;
      this.historial = [];
      this.cdr.detectChanges();
    });

    window.addEventListener('cancionGenerada', () => {
      setTimeout(() => {
        this.cargarHistorial();
        this.cargarUsuariosRecientes();
        this.cdr.detectChanges();
      }, 1500);
    });
  }

  cargarHistorial(): void {
    const usuarioId = localStorage.getItem('melodia_user_id');
    if (!usuarioId) return;

    this.cargando = true;
    this.cdr.detectChanges();

    this.usuarioService.obtenerHistorial(Number(usuarioId)).subscribe({
      next: (res: any) => {
        if (res.historial) {
          this.historial = res.historial;
        }
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error cargando historial:', err);
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  cargarUsuariosRecientes(): void {
    this.usuarioService.obtenerUsuariosRecientes().subscribe({
      next: (res: any) => {
        if (res.usuarios) {
          this.usuariosRecientes = res.usuarios;
          this.cdr.detectChanges();
        }
      },
      error: (err: any) => console.error('Error cargando usuarios:', err)
    });
  }

  getAvatarUrl(usuario: any): string {
    return usuario.foto_url ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(usuario.nombre)}&background=7c3aed&color=fff`;
  }

  onImageError(event: any, usuario: any): void {
    event.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(usuario.nombre)}&background=7c3aed&color=fff`;
  }

  descargarLetra(item: any): void {
    const letra = item.letra || '';
    const blob = new Blob([letra], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `letra-${item.mood || 'cancion'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
