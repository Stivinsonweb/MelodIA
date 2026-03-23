import { Component, OnInit } from '@angular/core';
import { Header } from './shared/components/header/header';
import { UserBar } from './shared/components/user-bar/user-bar';
import { Upload } from './features/upload/upload';
import { Player } from './features/player/player';
import { History } from './shared/components/history/history';
import { Footer } from './shared/components/footer/footer';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
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
export class App implements OnInit  {
  ngOnInit(): void {
    this.generateStars();
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