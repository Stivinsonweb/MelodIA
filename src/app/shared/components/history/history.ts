import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './history.html',
  styleUrl: './history.css'
})
export class History implements OnInit {
  isLoggedIn = false;

  history = [
    { mood: 'Nostálgico', title: 'Bajo el cielo de agosto', date: 'Hoy, 3:24pm' },
    { mood: 'Romántico', title: 'Luz de luna', date: 'Ayer, 9:10pm' },
    { mood: 'Energético', title: 'Fuego interior', date: '22 Mar, 5:00pm' },
  ];

  ngOnInit(): void {
    const savedUser = localStorage.getItem('melodia_user');
    this.isLoggedIn = !!savedUser;
  }

  onHover(event: MouseEvent, hover: boolean): void {
    const el = event.currentTarget as HTMLElement;
    el.style.borderColor = hover
      ? 'rgba(192,132,252,0.3)'
      : 'rgba(255,255,255,0.08)';
  }
}