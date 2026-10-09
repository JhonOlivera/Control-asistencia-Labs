import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { apiUrl } from '../core/environment';

export type EstadoAsistencia = 'PRESENTE' | 'TARDE' | 'AUSENTE' | 'JUSTIFICADO';

export interface SesionHistorial {
  sesionId: number;
  fecha: string;
  hora: string;
  curso: string;
  laboratorio: string;
  estado: EstadoAsistencia;
}

export interface PorcentajeCurso {
  cursoId: number;
  curso: string;
  porcentaje: number | null;
  sesionesAsistidas: number;
  sesionesTotales: number;
}

export interface HistorialEstudiante {
  id: number;
  nombre: string;
  codigo: string;
  sesiones: SesionHistorial[];
  porcentajesPorCurso: PorcentajeCurso[];
}

@Injectable({ providedIn: 'root' })
export class HistorialService {
  private readonly http = inject(HttpClient);

  obtenerHistorial(estudianteId: number): Observable<HistorialEstudiante> {
    return this.http.get<HistorialEstudiante>(
      `${apiUrl}/reportes/estudiantes/${estudianteId}/historial`,
    );
  }
}
