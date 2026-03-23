import { Component, OnInit } from '@angular/core';
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

  constructor(private usuarioService: UsuarioService) {}

  ngOnInit(): void {
    const savedUser = localStorage.getItem('melodia_user');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      this.apodo = user.apodo || '';
      this.selectedIndex = user.icono_index || 0;
    }
  }

  guardarApodo(): void {
    const savedUser = localStorage.getItem('melodia_user');
    if (!savedUser) return;

    const user = JSON.parse(savedUser);
    user.apodo = this.apodo;
    user.icono_index = this.selectedIndex;
    localStorage.setItem('melodia_user', JSON.stringify(user));

    this.usuarioService.guardarUsuario({
      google_id: user.google_id,
      nombre: user.name,
      email: user.email,
      foto_url: user.picture,
      apodo: this.apodo,
      icono_index: this.selectedIndex
    }).subscribe({
      next: () => {
        this.guardado = true;
        setTimeout(() => this.guardado = false, 2000);
      },
      error: (err) => console.error('Error guardando apodo:', err)
    });
  }

  selectAvatar(index: number): void {
    this.selectedIndex = index;
  }
}