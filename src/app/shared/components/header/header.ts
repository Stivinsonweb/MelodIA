import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsuarioService } from '../../../core/services/usuario';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class Header implements OnInit {
  user: any = null;

  constructor(private usuarioService: UsuarioService) {}

  ngOnInit(): void {
    const hash = window.location.hash;
    if (hash.includes('access_token')) {
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get('access_token');
      if (accessToken) {
        this.getUserInfo(accessToken);
        window.history.replaceState({}, document.title, '/');
      }
    }

    const savedUser = localStorage.getItem('melodia_user');
    if (savedUser) {
      this.user = JSON.parse(savedUser);
    }

    // Escuchar cambios en localStorage para actualizar apodo e icono
    window.addEventListener('storage', () => {
      const updated = localStorage.getItem('melodia_user');
      if (updated) this.user = JSON.parse(updated);
    });
  }

  getUserInfo(accessToken: string): void {
    fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken}`)
      .then(res => res.json())
      .then(data => {
        const existingUser = localStorage.getItem('melodia_user');
        const existing = existingUser ? JSON.parse(existingUser) : {};

        this.user = {
          google_id: data.sub,
          name: data.name,
          email: data.email,
          picture: data.picture,
          apodo: existing.apodo || '',
          icono_index: existing.icono_index || 0
        };
        localStorage.setItem('melodia_user', JSON.stringify(this.user));

        this.usuarioService.guardarUsuario({
          google_id: data.sub,
          nombre: data.name,
          email: data.email,
          foto_url: data.picture,
          apodo: this.user.apodo,
          icono_index: this.user.icono_index
        }).subscribe({
          next: (res: any) => {
            console.log('Usuario guardado:', res);
            localStorage.setItem('melodia_user_id', res.id);
          },
          error: (err) => console.error('Error guardando usuario:', err)
        });
      });
  }

  loginWithGoogle(): void {
    const clientId = '1623928222-8hhd5odq3m8lt1mhidmdpf9apd97nnq6.apps.googleusercontent.com';
    const redirectUri = encodeURIComponent('http://localhost:4200');
    const scope = encodeURIComponent('openid email profile');
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=token&scope=${scope}`;
    window.location.href = url;
  }

  logout(): void {
    this.user = null;
    localStorage.removeItem('melodia_user');
    localStorage.removeItem('melodia_user_id');
  }
}