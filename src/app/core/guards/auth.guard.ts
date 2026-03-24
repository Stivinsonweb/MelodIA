import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = async (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  await auth.init();

  if (auth.user()) return true;

  if (!isPlatformBrowser(platformId)) {
    return router.parseUrl('/login');
  }

  return router.createUrlTree(['/login'], { queryParams: { returnTo: state.url } });
};

