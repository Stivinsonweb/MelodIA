import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-player',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './player.html',
  styleUrl: './player.css'
})
export class Player {
  isPlaying = false;

  lyrics = [
    { text: 'Bajo el cielo de agosto', active: true },
    { text: 'recuerdo tu sonrisa al atardecer', active: true },
    { text: 'el viento susurra tu nombre', active: false },
    { text: 'y yo no puedo olvidarte', active: false },
    { text: '— Estribillo —', active: false },
    { text: 'Vuelve, vuelve a mí', active: false },
    { text: 'como la lluvia al mar', active: false },
    { text: 'que sin ti el mundo no tiene color', active: false },
  ];

  togglePlay(): void {
    this.isPlaying = !this.isPlaying;
  }
}