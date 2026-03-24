import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
};

type MeResponse =
  | { ok: true; user: AuthUser; csrfToken: string }
  | { ok: false };

@Injectable({ providedIn: 'root' })
export class AuthService {
  private platformId = inject(PLATFORM_ID);
  private initialized = false;

  user = signal<AuthUser | null>(null);
  csrfToken = signal<string | null>(null);
  loading = signal(false);

  async init() {
    if (this.initialized) return;
    this.initialized = true;
    if (!isPlatformBrowser(this.platformId)) return;
    await this.refresh();
  }

  async refresh() {
    if (!isPlatformBrowser(this.platformId)) return;
    this.loading.set(true);
    try {
      const resp = await fetch('/api/auth/me', { credentials: 'include' });
      const data = (await resp.json().catch(() => ({ ok: false }))) as MeResponse;
      if (data.ok) {
        this.user.set(data.user);
        this.csrfToken.set(data.csrfToken);
      } else {
        this.user.set(null);
        this.csrfToken.set(null);
      }
    } finally {
      this.loading.set(false);
    }
  }

  login(returnTo?: string, remember?: boolean) {
    if (!isPlatformBrowser(this.platformId)) return;
    const rt =
      returnTo ??
      `${location.pathname}${location.search}${location.hash}`;
    const qp = new URLSearchParams();
    qp.set('returnTo', rt);
    if (remember) qp.set('remember', '1');
    location.assign(`/auth/google?${qp.toString()}`);
  }

  async logout() {
    if (!isPlatformBrowser(this.platformId)) return;
    const csrf = this.csrfToken();
    await fetch('/auth/logout', {
      method: 'POST',
      credentials: 'include',
      headers: csrf ? { 'x-csrf-token': csrf } : undefined
    }).catch(() => null);
    await this.refresh();
  }
}
