import { Component, OnInit, inject, PLATFORM_ID, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-user-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-bar.html',
  styleUrl: './user-bar.css'
})
export class UserBar implements OnInit {
  auth = inject(AuthService);
  private platformId = inject(PLATFORM_ID);
  authError = signal<string | null>(null);
  selectedIndex = 0;

  ngOnInit(): void {
    void this.auth.init();
    if (isPlatformBrowser(this.platformId)) {
      const params = new URLSearchParams(location.search);
      const authError = params.get('authError');
      if (authError === 'google') {
        this.authError.set('No se pudo iniciar sesión con Google. Inténtalo de nuevo.');
      }
      if (authError) {
        params.delete('authError');
        const next = `${location.pathname}${params.toString() ? `?${params.toString()}` : ''}${location.hash}`;
        history.replaceState(null, '', next);
      }
    }
  }

  dismissAuthError(): void {
    this.authError.set(null);
  }

  getInitials(name: string) {
    const parts = name
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    const first = parts[0]?.[0] ?? '';
    const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? '' : '';
    return `${first}${last}`.toUpperCase();
  }

  selectAvatar(index: number): void {
    this.selectedIndex = index;
  }
}
