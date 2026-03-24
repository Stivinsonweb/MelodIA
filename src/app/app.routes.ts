import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login)
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./app-shell').then((m) => m.AppShell)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
