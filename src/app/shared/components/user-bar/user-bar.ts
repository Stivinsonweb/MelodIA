import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuarioService } from '../../../core/services/usuario';

@Component({
  selector: 'app-user-bar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-bar.html',
  styleUrl: './user-bar.css'
})
export class UserBar implements OnInit {
  selectedIndex = 0;
  apodo = '';
  guardado = false;
  isLoggedIn = false;
  alertaMensaje = '';
  alertaTipo = '';

  iconos = [0, 1, 2, 3, 4, 5];

  constructor(
    private usuarioService: UsuarioService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarPerfil();

    window.addEventListener('usuarioCargado', (e: any) => {
      this.isLoggedIn = true;
      this.apodo = e.detail?.apodo || '';
      this.selectedIndex = e.detail?.icono_index || 0;
      this.cdr.detectChanges();
    });

    window.addEventListener('usuarioCerroSesion', () => {
      this.isLoggedIn = false;
      this.apodo = '';
      this.selectedIndex = 0;
      this.cdr.detectChanges();
    });
  }

  cargarPerfil(): void {
    const savedUser = localStorage.getItem('melodia_user');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      this.apodo = user.apodo || '';
      this.selectedIndex = user.icono_index || 0;
      this.isLoggedIn = true;
      this.cdr.detectChanges();
    }
  }

  selectAvatar(index: number): void {
    this.selectedIndex = index;
  }

  guardarApodo(): void {
    if (!this.isLoggedIn) {
      this.mostrarAlerta('Debes iniciar sesión para guardar tu perfil', 'error');
      return;
    }

    const savedUser = localStorage.getItem('melodia_user');
    if (!savedUser) return;

    const user = JSON.parse(savedUser);
    user.apodo = this.apodo;
    user.icono_index = this.selectedIndex;
    localStorage.setItem('melodia_user', JSON.stringify(user));

    window.dispatchEvent(new CustomEvent('perfilActualizado', {
      detail: { apodo: this.apodo, icono_index: this.selectedIndex }
    }));

    this.usuarioService.guardarUsuario({
      google_id: user.google_id,
      nombre: user.name,
      email: user.email,
      foto_url: user.picture,
      apodo: this.apodo,
      icono_index: this.selectedIndex
    }).subscribe({
      next: () => {
        this.mostrarAlerta('¡Perfil actualizado correctamente!', 'success');
        this.guardado = true;
        setTimeout(() => { this.guardado = false; this.cdr.detectChanges(); }, 2000);
        this.cdr.detectChanges();
      },
      error: () => {
        this.mostrarAlerta('Error al guardar el perfil', 'error');
      }
    });
  }

  mostrarAlerta(mensaje: string, tipo: string): void {
    this.alertaMensaje = mensaje;
    this.alertaTipo = tipo;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.alertaMensaje = '';
      this.alertaTipo = '';
      this.cdr.detectChanges();
    }, 3000);
  }
}
