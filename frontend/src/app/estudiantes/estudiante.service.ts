import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { apiUrl } from '../core/environment';

export interface Estudiante {
  id: number;
  nombre: string;
  correo: string;
  codigo: string;
  activo: boolean;
}

export interface EstudianteRequest {
  nombre: string;
  correo: string;
  codigo: string;
}

export interface FiltroEstudiantes {
  texto?: string;
  activo?: boolean;
}

@Injectable({ providedIn: 'root' })
export class EstudianteService {
  private readonly http = inject(HttpClient);

  listarEstudiantes(filtro: FiltroEstudiantes = {}): Observable<Estudiante[]> {
    let params = new HttpParams();
    if (filtro.texto) {
      params = params.set('texto', filtro.texto);
    }
    if (filtro.activo !== undefined) {
      params = params.set('activo', filtro.activo);
    }
    return this.http.get<Estudiante[]>(`${apiUrl}/estudiantes`, { params });
  }

  obtenerEstudiante(id: number): Observable<Estudiante> {
    return this.http.get<Estudiante>(`${apiUrl}/estudiantes/${id}`);
  }

  crearEstudiante(request: EstudianteRequest): Observable<Estudiante> {
    return this.http.post<Estudiante>(`${apiUrl}/estudiantes`, request);
  }

  actualizarEstudiante(id: number, request: EstudianteRequest): Observable<Estudiante> {
    return this.http.put<Estudiante>(`${apiUrl}/estudiantes/${id}`, request);
  }

  inactivarEstudiante(id: number): Observable<Estudiante> {
    return this.http.patch<Estudiante>(`${apiUrl}/estudiantes/${id}/inactivar`, {});
  }

  activarEstudiante(id: number): Observable<Estudiante> {
    return this.http.patch<Estudiante>(`${apiUrl}/estudiantes/${id}/activar`, {});
  }

  eliminarEstudiante(id: number): Observable<void> {
    return this.http.delete<void>(`${apiUrl}/estudiantes/${id}`);
  }
}
