import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { apiUrl } from '../core/environment';

export interface SesionResumen {
  id: number;
  cursoId: number;
  cursoNombre: string;
  cursoGrupo: string;
  laboratorioId: number;
  laboratorioNombre: string;
  fecha: string;
  hora: string;
  tema: string;
  estado: 'ABIERTA' | 'CERRADA';
  estudiantesMarcados: number;
}

export interface SesionRequest {
  cursoId: number;
  laboratorioId: number;
  administradorId: number;
  fecha: string;
  hora: string;
  tema: string;
}

export interface SesionResponse {
  id: number;
  cursoId: number;
  laboratorioId: number;
  administradorId: number;
  fecha: string;
  hora: string;
  tema: string;
  estado: string;
}

export interface AsistenciaEstudiante {
  estudianteId: number;
  nombre: string;
  codigo: string;
  correo: string;
  estado: 'PRESENTE' | 'TARDE' | 'AUSENTE' | 'JUSTIFICADO' | 'PENDIENTE';
  horaRegistro: string | null;
}

@Injectable({ providedIn: 'root' })
export class SesionesService {
  private readonly http = inject(HttpClient);

  listarSesiones(): Observable<SesionResumen[]> {
    return this.http.get<SesionResumen[]>(`${apiUrl}/sesiones`);
  }

  crearSesion(request: SesionRequest): Observable<SesionResponse> {
    return this.http.post<SesionResponse>(`${apiUrl}/sesiones`, request);
  }

  listarAsistencias(sesionId: number): Observable<AsistenciaEstudiante[]> {
    return this.http.get<AsistenciaEstudiante[]>(`${apiUrl}/sesiones/${sesionId}/asistencias`);
  }

  enviarEnlaces(sesionId: number): Observable<void> {
    return this.http.post<void>(`${apiUrl}/sesiones/${sesionId}/enviar-enlaces`, {});
  }

  cerrarSesion(sesionId: number): Observable<SesionResponse> {
    return this.http.patch<SesionResponse>(`${apiUrl}/sesiones/${sesionId}/cerrar`, {});
  }
}
