import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { apiUrl } from './environment';

// Endpoints públicos: un token vencido en el header haría que el backend respondiera 401.
const rutasPublicas = [`${apiUrl}/asistencia/marcar`];

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const esBackend = req.url.startsWith(apiUrl);
  const esPublica = rutasPublicas.some((ruta) => req.url.startsWith(ruta));
  if (!esBackend || esPublica) {
    return next(req);
  }

  const token = auth.obtenerToken();
  const peticion = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(peticion).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        auth.cerrarSesion();
        router.navigate(['/login']);
      }
      return throwError(() => error);
    }),
  );
};
