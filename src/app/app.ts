import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Header } from './shared/components/header/header';
import { UserBar } from './shared/components/user-bar/user-bar';
import { Upload } from './features/upload/upload';
import { Player } from './features/player/player';
import { History } from './shared/components/history/history';
import { Footer } from './shared/components/footer/footer';
import { CancionService } from './core/services/cancion';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    Header,
    UserBar,
    Upload,
    Player,
    History,
    Footer
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  moodBg = 'default';
  moodColor = '#c084fc';
  particulas: { x: number; y: number; size: number; opacity: number; delay: number }[] = [];

  moodConfig: Record<string, { color: string; bg: string; particle: string }> = {
    'melancólico': { color: '#818cf8', bg: 'radial-gradient(ellipse at 30% 40%, rgba(99,102,241,0.15) 0%, rgba(10,10,26,0) 70%)', particle: 'rgba(129,140,248,0.4)' },
    'melancólica': { color: '#818cf8', bg: 'radial-gradient(ellipse at 30% 40%, rgba(99,102,241,0.15) 0%, rgba(10,10,26,0) 70%)', particle: 'rgba(129,140,248,0.4)' },
    'triste': { color: '#818cf8', bg: 'radial-gradient(ellipse at 20% 60%, rgba(79,70,229,0.18) 0%, rgba(10,10,26,0) 70%)', particle: 'rgba(129,140,248,0.3)' },
    'tristeza': { color: '#818cf8', bg: 'radial-gradient(ellipse at 20% 60%, rgba(79,70,229,0.18) 0%, rgba(10,10,26,0) 70%)', particle: 'rgba(129,140,248,0.3)' },
    'feliz': { color: '#fbbf24', bg: 'radial-gradient(ellipse at 70% 30%, rgba(251,191,36,0.15) 0%, rgba(10,10,26,0) 70%)', particle: 'rgba(251,191,36,0.5)' },
    'alegre': { color: '#fbbf24', bg: 'radial-gradient(ellipse at 70% 30%, rgba(251,191,36,0.15) 0%, rgba(10,10,26,0) 70%)', particle: 'rgba(251,191,36,0.5)' },
    'alegría': { color: '#fbbf24', bg: 'radial-gradient(ellipse at 70% 30%, rgba(251,191,36,0.15) 0%, rgba(10,10,26,0) 70%)', particle: 'rgba(251,191,36,0.5)' },
    'romántico': { color: '#f472b6', bg: 'radial-gradient(ellipse at 50% 50%, rgba(244,114,182,0.15) 0%, rgba(10,10,26,0) 70%)', particle: 'rgba(244,114,182,0.5)' },
    'romántica': { color: '#f472b6', bg: 'radial-gradient(ellipse at 50% 50%, rgba(244,114,182,0.15) 0%, rgba(10,10,26,0) 70%)', particle: 'rgba(244,114,182,0.5)' },
    'amor': { color: '#f472b6', bg: 'radial-gradient(ellipse at 50% 50%, rgba(244,114,182,0.15) 0%, rgba(10,10,26,0) 70%)', particle: 'rgba(244,114,182,0.5)' },
    'energético': { color: '#34d399', bg: 'radial-gradient(ellipse at 80% 20%, rgba(52,211,153,0.15) 0%, rgba(10,10,26,0) 70%)', particle: 'rgba(52,211,153,0.5)' },
    'energía': { color: '#34d399', bg: 'radial-gradient(ellipse at 80% 20%, rgba(52,211,153,0.15) 0%, rgba(10,10,26,0) 70%)', particle: 'rgba(52,211,153,0.5)' },
    'relajado': { color: '#67e8f9', bg: 'radial-gradient(ellipse at 40% 70%, rgba(103,232,249,0.12) 0%, rgba(10,10,26,0) 70%)', particle: 'rgba(103,232,249,0.4)' },
    'nostálgico': { color: '#a78bfa', bg: 'radial-gradient(ellipse at 60% 40%, rgba(167,139,250,0.15) 0%, rgba(10,10,26,0) 70%)', particle: 'rgba(167,139,250,0.4)' },
    'enojado': { color: '#f87171', bg: 'radial-gradient(ellipse at 50% 30%, rgba(248,113,113,0.15) 0%, rgba(10,10,26,0) 70%)', particle: 'rgba(248,113,113,0.4)' },
  };

  currentBg = '';
  currentParticleColor = 'rgba(192,132,252,0.3)';

  constructor(
    private cancionService: CancionService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      this.generateStars();

      this.cancionService.cancion$.subscribe(detail => {
        if (detail?.mood) {
          this.actualizarFondo(detail.mood);
        }
      });
    }
  }

  actualizarFondo(mood: string): void {
    const key = mood.toLowerCase();
    const config = this.moodConfig[key];
    if (!config) return;

    this.currentBg = config.bg;
    this.currentParticleColor = config.particle;
    this.moodColor = config.color;

    // Regenerar partículas con nuevo color
    this.generarParticulas(config.particle);
    this.cdr.detectChanges();
  }

  generarParticulas(color: string): void {
    const container = document.getElementById('particles');
    if (!container) return;
    container.innerHTML = '';

    for (let i = 0; i < 25; i++) {
      const p = document.createElement('div');
      const size = Math.random() * 4 + 2;
      const x = Math.random() * 100;
      const duration = Math.random() * 8 + 6;
      const delay = Math.random() * 5;

      p.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        border-radius: 50%;
        left: ${x}%;
        bottom: -10px;
        animation: floatUp ${duration}s ${delay}s infinite ease-in;
        pointer-events: none;
      `;
      container.appendChild(p);
    }
  }

  generateStars(): void {
    const container = document.getElementById('stars');
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
}