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
}