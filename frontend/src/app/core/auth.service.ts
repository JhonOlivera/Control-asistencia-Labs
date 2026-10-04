import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { apiUrl } from './environment';

export interface UsuarioAutenticado {
  id: number;
  correo: string;
  nombre: string;
  rol: 'ADMINISTRADOR' | 'DOCENTE';
}

const CLAVE_TOKEN = 'token_acceso';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  guardarToken(token: string): void {
    try {
      localStorage.setItem(CLAVE_TOKEN, token);
    } catch {
      // Sin almacenamiento disponible la sesión no se puede conservar.
    }
  }

  obtenerToken(): string | null {
    try {
      return localStorage.getItem(CLAVE_TOKEN);
    } catch {
      return null;
    }
  }

  cerrarSesion(): void {
    try {
      localStorage.removeItem(CLAVE_TOKEN);
    } catch {
      // Nada que limpiar.
    }
  }

  /** true si hay un token guardado y su fecha de expiración (exp) no ha pasado. */
  estaAutenticado(): boolean {
    const token = this.obtenerToken();
    if (!token) {
      return false;
    }
    try {
      const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const { exp } = JSON.parse(atob(payload)) as { exp?: number };
      return typeof exp === 'number' && exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }

  obtenerUsuario(): Observable<UsuarioAutenticado> {
    return this.http.get<UsuarioAutenticado>(`${apiUrl}/auth/me`);
  }
}
