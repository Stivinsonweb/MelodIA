import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiinService } from '../../core/services/apiin';

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './upload.html',
  styleUrl: './upload.css'
})
export class Upload {
  selectedMood: string = '';
  texto: string = '';
  imagenBase64: string = '';
  imagenNombre: string = '';
  cargando: boolean = false;
  modo: 'texto' | 'imagen' | '' = '';

  moods = ['Feliz', 'Nostálgico', 'Romántico', 'Energético', 'Melancólico', 'Relajado'];

  constructor(private apiinService: ApiinService) {}

  selectMood(mood: string): void {
    this.selectedMood = mood;
  }

  onTextoChange(): void {
    if (this.texto.trim()) {
      this.modo = 'texto';
      this.imagenBase64 = '';
      this.imagenNombre = '';
    } else {
      this.modo = '';
    }
  }

  onImagenSeleccionada(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    this.texto = '';
    this.modo = 'imagen';
    this.imagenNombre = file.name;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.imagenBase64 = e.target.result.split(',')[1];
    };
    reader.readAsDataURL(file);
  }

  limpiarImagen(): void {
    this.imagenBase64 = '';
    this.imagenNombre = '';
    this.modo = '';
  }

  async generarCancion(): Promise<void> {
    if (!this.texto && !this.imagenBase64 && !this.selectedMood) {
      alert('Escribe cómo te sientes o sube una imagen');
      return;
    }

    const user = localStorage.getItem('melodia_user');
    if (!user) {
      alert('Debes iniciar sesión para generar una canción');
      return;
    }

    this.cargando = true;

    try {
      // Paso 1: Analizar mood
      const moodRes: any = await this.apiinService
        .analizarMood(this.texto || this.selectedMood, this.imagenBase64)
        .toPromise();

      console.log('Respuesta mood:', moodRes);

      if (!moodRes || !moodRes.content || !moodRes.content[0]) {
        console.error('Respuesta inválida:', moodRes);
        alert('Error en la respuesta de la IA. Revisa la consola.');
        return;
      }

      const moodContent = moodRes.content[0].text
        .replace(/```json|```/g, '').trim();
      const moodData = JSON.parse(moodContent);

      console.log('Mood detectado:', moodData);

      // Paso 2: Generar letra
      const letraRes: any = await this.apiinService
        .generarLetra(moodData.mood, moodData.emocion, moodData.descripcion)
        .toPromise();

      console.log('Respuesta letra:', letraRes);

      if (!letraRes || !letraRes.content || !letraRes.content[0]) {
        console.error('Respuesta letra inválida:', letraRes);
        alert('Error generando la letra. Revisa la consola.');
        return;
      }

      const letra = letraRes.content[0].text;

      // Emitir resultado al player
      window.dispatchEvent(new CustomEvent('cancionGenerada', {
        detail: {
          letra,
          mood: moodData.mood,
          moodData,
          imagenRuta: this.imagenNombre
        }
      }));

    } catch (error) {
      console.error('Error generando canción:', error);
      alert('Error al generar la canción. Intenta de nuevo.');
    } finally {
      this.cargando = false;
    }
  }
}