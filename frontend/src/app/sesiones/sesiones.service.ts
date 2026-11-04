import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
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

export interface FiltroSesiones {
  estado?: 'ABIERTA' | 'CERRADA';
  fecha?: string;
}

export interface SesionPorFecha {
  sesionId: number;
  cursoId: number;
  cursoNombre: string;
  cursoGrupo: string;
  laboratorioId: number;
  laboratorioNombre: string;
  fecha: string;
  horaInicio: string;
  estado: 'ABIERTA' | 'CERRADA';
  presentes: number;
  tarde: number;
  ausentes: number;
}

export interface ResumenParticipantes {
  matriculados: number;
  presentes: number;
  tarde: number;
  ausentes: number;
}

export interface Participante {
  estudianteId: number;
  codigo: string;
  nombre: string;
  correo: string;
  estadoMatricula: 'ACTIVA' | 'INACTIVA';
  asistencia: 'PRESENTE' | 'TARDE' | 'AUSENTE';
  horaRegistro: string | null;
}

export interface SesionParticipantesResponse {
  sesionId: number;
  cursoId: number;
  cursoNombre: string;
  cursoGrupo: string;
  laboratorioId: number;
  laboratorioNombre: string;
  fecha: string;
  horaInicio: string;
  estado: 'ABIERTA' | 'CERRADA';
  resumen: ResumenParticipantes;
  participantes: Participante[];
}

export interface FiltroParticipantes {
  asistencia?: 'PRESENTE' | 'TARDE' | 'AUSENTE';
  matricula?: 'ACTIVA' | 'INACTIVA';
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

  listarSesiones(filtro?: FiltroSesiones): Observable<SesionResumen[]> {
    let params = new HttpParams();
    if (filtro?.estado) {
      params = params.set('estado', filtro.estado);
    }
    if (filtro?.fecha) {
      params = params.set('fecha', filtro.fecha);
    }
    return this.http.get<SesionResumen[]>(`${apiUrl}/sesiones`, { params });
  }

  listarPorFecha(fecha: string): Observable<SesionPorFecha[]> {
    const params = new HttpParams().set('fecha', fecha);
    return this.http.get<SesionPorFecha[]>(`${apiUrl}/sesiones/por-fecha`, { params });
  }

  obtenerParticipantes(
    sesionId: number,
    filtro?: FiltroParticipantes,
  ): Observable<SesionParticipantesResponse> {
    let params = new HttpParams();
    if (filtro?.asistencia) {
      params = params.set('asistencia', filtro.asistencia);
    }
    if (filtro?.matricula) {
      params = params.set('matricula', filtro.matricula);
    }
    return this.http.get<SesionParticipantesResponse>(
      `${apiUrl}/sesiones/${sesionId}/participantes`,
      { params },
    );
  }

  descargarParticipantes(sesionId: number, incluirAusentes: boolean): Observable<HttpResponse<Blob>> {
    const params = new HttpParams().set('incluirAusentes', incluirAusentes);
    return this.http.get(`${apiUrl}/sesiones/${sesionId}/participantes/exportar`, {
      params,
      responseType: 'blob',
      observe: 'response',
    });
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
