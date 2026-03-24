import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './upload.html',
  styleUrl: './upload.css'
})
export class Upload {
  selectedMood: string = '';

  moods = ['Feliz', 'Nostálgico', 'Romántico', 'Energético', 'Melancólico', 'Relajado'];

  selectMood(mood: string): void {
    this.selectedMood = mood;
  }

  onHoverUpload(hover: boolean): void {
    const zone = document.querySelector('.upload-zone') as HTMLElement;
    if (zone) {
      zone.style.borderColor = hover
        ? 'rgba(192,132,252,0.4)'
        : 'rgba(255,255,255,0.15)';
    }
  }
}