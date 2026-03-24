import { Component, OnInit, PLATFORM_ID, Inject, inject } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login implements OnInit {
  auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  remember = true;
  returnTo = '/';
  error: string | null = null;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  async ngOnInit(): Promise<void> {
    if (isPlatformBrowser(this.platformId)) {
      this.generateStars();
    }
    await this.auth.init();
    this.returnTo = this.route.snapshot.queryParamMap.get('returnTo') || '/';
    const authError = this.route.snapshot.queryParamMap.get('authError');
    if (authError === 'google') {
      this.error = 'No se pudo iniciar sesión con Google. Inténtalo de nuevo.';
    }
    if (this.auth.user()) {
      await this.router.navigateByUrl(this.returnTo);
    }
  }

  generateStars(): void {
    const container = document.getElementById('login-stars');
    if (!container) return;

    for (let i = 0; i < 60; i++) {
      const star = document.createElement('div');
      const size = Math.random() * 2 + 1;
      star.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        background: rgba(255,255,255,${Math.random() * 0.4 + 0.1});
        border-radius: 50%;
        left: ${Math.random() * 100}%;
        top: ${Math.random() * 100}%;
      `;
      container.appendChild(star);
    }

    const icons = [
      `<svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="1"><path d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z"/></svg>`,
      `<svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="1"><path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3M8 22h8"/></svg>`,
      `<svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="1"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>`,
      `<svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="1"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`
    ];

    for (let i = 0; i < 16; i++) {
      const icon = document.createElement('div');
      const size = Math.random() * 32 + 18;
      icon.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        left: ${Math.random() * 100}%;
        top: ${Math.random() * 100}%;
      `;
      icon.innerHTML = icons[Math.floor(Math.random() * icons.length)];
      container.appendChild(icon);
    }
  }

  login() {
    this.auth.login(this.returnTo, this.remember);
  }
}
