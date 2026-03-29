import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CancionService {
  private cancionSubject = new BehaviorSubject<any>(null);
  private cargandoSubject = new BehaviorSubject<boolean>(false);

  cancion$ = this.cancionSubject.asObservable();
  cargando$ = this.cargandoSubject.asObservable();

  setCargando(valor: boolean): void {
    this.cargandoSubject.next(valor);
  }

  setCancion(data: any): void {
    this.cancionSubject.next(data);
  }

  getCancion(): any {
    return this.cancionSubject.getValue();
  }
}
