import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ApiinService {
  private proxyUrl = 'https://vps22920.cubepath.net/api/proxy.php';

  constructor(private http: HttpClient) {}

  private postClaude(endpoint: string, payload: any) {
    return this.http.post(this.proxyUrl, {
      service: 'claude',
      endpoint,
      payload
    });
  }

  analizarMood(texto: string, imagenBase64?: string) {
    const content: any[] = [];

    if (imagenBase64) {
      content.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: 'image/jpeg',
          data: imagenBase64
        }
      });
    }

    content.push({
      type: 'text',
      text: `Analiza ${imagenBase64 ? 'esta imagen y ' : ''}el siguiente texto: "${texto}". 
      Devuelve SOLO un JSON con este formato exacto sin markdown:
      {"mood": "nostálgico", "emocion": "tristeza suave", "genero": "ballad", "tempo": "slow", "descripcion": "Una melodía suave y melancólica"}`
    });

    return this.postClaude('messages', {
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content
      }]
    });
  }

  generarLetra(mood: string, emocion: string, descripcion: string) {
    return this.postClaude('messages', {
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: `Escribe una letra de canción en español con estas características:
        - Mood: ${mood}
        - Emoción: ${emocion}
        - Descripción: ${descripcion}
        - Formato: 2 estrofas y un estribillo
        - Tono: poético y emotivo
        Devuelve SOLO la letra, sin títulos ni explicaciones.`
      }]
    });
  }
}