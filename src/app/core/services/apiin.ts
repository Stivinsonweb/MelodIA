import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ApiinService {
  private claudeUrl = 'https://api.anthropic.com/v1/messages';
  private claudeKey = 'YOUR_ANTHROPIC_API_KEY'; // ⚠️ Reemplaza con tu API key real (no la subas al repo)
  private proxyUrl = 'https://vps22920.cubepath.net/api/proxy.php';

  constructor(private http: HttpClient) {}

  generarCancionCompleta(texto: string) {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'x-api-key': this.claudeKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    });

    return this.http.post(this.claudeUrl, {
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: `Analiza el siguiente texto: "${texto}".
      
      Devuelve SOLO un JSON con este formato exacto sin markdown ni explicaciones:
      {
        "mood": "melancólico",
        "emocion": "tristeza profunda",
        "genero": "ballad",
        "letra": "línea 1\\nlínea 2\\n..."
      }
      
      La letra debe:
      - Estar en español
      - Tener ritmo y rima consonante o asonante entre líneas
      - Las líneas deben tener métrica similar para que suenen musicales al leerlas
      - Formato con saltos de línea entre secciones:
        * Verso 1: 4 líneas rimadas (ABAB o AABB)
        * línea vacía
        * Coro: 4 líneas pegajosas con ritmo fuerte que se repiten
        * línea vacía
        * Verso 2: 4 líneas rimadas que continúan la historia
        * línea vacía
        * Coro: mismas 4 líneas del primer coro
        * línea vacía
        * Puente: 4 líneas emotivas con ritmo diferente
        * línea vacía
        * Coro final: mismas 4 líneas del coro
      - Cada línea debe tener entre 8 y 12 sílabas
      - Sin etiquetas como Verso, Coro o Estribillo en la letra
      - La historia debe ser coherente y emotiva de principio a fin`
      }]
    }, { headers });
  }

  // Suno via proxy PHP en el servidor (evita CORS)
  generarMusica(letra: string, genero: string, mood: string) {
    return this.http.post(this.proxyUrl, {
      service: 'apiin',
      endpoint: 'audio/music',
      payload: {
        model: 'suno',
        prompt: letra,
        style: `${genero}, ${mood}, spanish lyrics, emotional`,
        make_instrumental: false,
        title: `MelodIA - ${mood}`
      }
    });
  }

  // Verificar tarea via proxy PHP
  verificarTarea(taskId: string) {
    return this.http.post(this.proxyUrl, {
      service: 'apiin',
      endpoint: `tasks/${taskId}`,
      method: 'GET',
      payload: {}
    });
  }
}
