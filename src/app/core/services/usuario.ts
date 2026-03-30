import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private apiUrl = 'https://vps22920.cubepath.net/api';

  constructor(private http: HttpClient) {}

  private get(endpoint: string) {
    return this.http.get(`${this.apiUrl}/${endpoint}`, {
      headers: new HttpHeaders({
        'Accept': 'application/json'
      })
    });
  }

  private post(endpoint: string, data: any) {
    return this.http.post(`${this.apiUrl}/${endpoint}`, data, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      })
    });
  }

  guardarUsuario(data: any) {
    return this.post('guardar-usuario.php', data);
  }

  obtenerUsuario(email: string) {
    return this.get(`obtener-usuario.php?email=${encodeURIComponent(email)}`);
  }

  guardarHistorial(data: any) {
    return this.post('guardar-historial.php', data);
  }

  obtenerAudio(taskId: string) {
    return this.get(`obtener-audio.php?task_id=${taskId}`);
  }

  obtenerHistorial(usuarioId: number) {
    return this.get(`obtener-historial.php?usuario_id=${usuarioId}`);
  }

  obtenerUsuariosRecientes() {
    return this.get('obtener-usuarios-recientes.php');
  }
}