import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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

  constructor(
    private usuarioService: UsuarioService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      if (hash.includes('access_token')) {
        const params = new URLSearchParams(hash.substring(1));
        const accessToken = params.get('access_token');
        if (accessToken) {
          this.getUserInfo(accessToken);
          window.history.replaceState({}, document.title, '/');
          return;
        }
      }

      const savedUser = localStorage.getItem('melodia_user');
      if (savedUser) {
        this.user = JSON.parse(savedUser);
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('usuarioCargado', { detail: this.user }));
          this.cdr.detectChanges();
        }, 0);
      }

      window.addEventListener('perfilActualizado', (e: any) => {
        if (this.user) {
          this.user = { ...this.user, apodo: e.detail.apodo, icono_index: e.detail.icono_index };
          localStorage.setItem('melodia_user', JSON.stringify(this.user));
          this.cdr.detectChanges();
        }
      });
    }
  }

  getUserInfo(accessToken: string): void {
    fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken}`)
      .then(res => res.json())
      .then(data => {
        this.usuarioService.obtenerUsuario(data.email).subscribe({
          next: (res: any) => {
            const apodo = res.usuario?.apodo || '';
            const icono_index = res.usuario?.icono_index || 0;

            this.user = {
              google_id: data.sub,
              name: data.name,
              email: data.email,
              picture: data.picture,
              apodo,
              icono_index
            };

            localStorage.setItem('melodia_user', JSON.stringify(this.user));
            this.cdr.detectChanges();

            this.usuarioService.guardarUsuario({
              google_id: data.sub,
              nombre: data.name,
              email: data.email,
              foto_url: data.picture,
              apodo,
              icono_index
            }).subscribe({
              next: (r: any) => {
                localStorage.setItem('melodia_user_id', r.id);
                setTimeout(() => {
                  window.dispatchEvent(new CustomEvent('usuarioCargado', { detail: this.user }));
                  this.cdr.detectChanges();
                }, 0);
              }
            });
          },
          error: () => {
            this.user = {
              google_id: data.sub,
              name: data.name,
              email: data.email,
              picture: data.picture,
              apodo: '',
              icono_index: 0
            };
            localStorage.setItem('melodia_user', JSON.stringify(this.user));
            this.cdr.detectChanges();
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('usuarioCargado', { detail: this.user }));
            }, 0);
          }
        });
      });
  }

  loginWithGoogle(): void {
    const clientId = '1623928222-8hhd5odq3m8lt1mhidmdpf9apd97nnq6.apps.googleusercontent.com';
    const redirectUri = encodeURIComponent(window.location.origin);
    const scope = encodeURIComponent('openid email profile');
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=token&scope=${scope}`;
    window.location.href = url;
  }

  logout(): void {
    this.user = null;
    localStorage.removeItem('melodia_user');
    localStorage.removeItem('melodia_user_id');
    this.cdr.detectChanges();
    window.dispatchEvent(new Event('usuarioCerroSesion'));
  }
}
