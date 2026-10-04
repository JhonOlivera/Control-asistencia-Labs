import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { apiUrl } from '../core/environment';

export interface EstudianteEnRiesgo {
  id: number;
  nombre: string;
  codigo: string;
  curso: string;
  porcentaje: number;
  sesionesAsistidas: number;
  sesionesTotales: number;
}

export interface ResumenReporte {
  totalSesiones: number;
  asistenciaPromedio: number;
  totalEstudiantes: number;
  estudiantesEnRiesgo: EstudianteEnRiesgo[];
}

@Injectable({ providedIn: 'root' })
export class ReportesService {
  private readonly http = inject(HttpClient);

  obtenerResumen(): Observable<ResumenReporte> {
    return this.http.get<ResumenReporte>(`${apiUrl}/reportes/resumen`);
  }
}
