import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-bar.html',
  styleUrl: './user-bar.css'
})
export class UserBar {
  selectedIndex = 0;

  selectAvatar(index: number): void {
    this.selectedIndex = index;
  }
}