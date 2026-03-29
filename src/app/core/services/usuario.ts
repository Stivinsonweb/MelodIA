import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private apiUrl = 'https://vps22920.cubepath.net/api';

  constructor(private http: HttpClient) {}

  guardarUsuario(data: any) {
    return this.http.post(`${this.apiUrl}/guardar-usuario.php`, data);
  }

  obtenerUsuario(email: string) {
    return this.http.get(`${this.apiUrl}/obtener-usuario.php?email=${email}`);
  }

  guardarHistorial(data: any) {
    return this.http.post(`${this.apiUrl}/guardar-historial.php`, data);
  }

  obtenerAudio(taskId: string) {
    return this.http.get(`${this.apiUrl}/obtener-audio.php?task_id=${taskId}`);
  }

  obtenerHistorial(usuarioId: number) {
    return this.http.get(`${this.apiUrl}/obtener-historial.php?usuario_id=${usuarioId}`);
  }

  obtenerUsuariosRecientes() {
    return this.http.get(`${this.apiUrl}/obtener-usuarios-recientes.php`);
  }
}
