import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { apiUrl } from '../core/environment';

export type EstadoLaboratorio = 'ACTIVO' | 'EN_MANTENIMIENTO';

export interface Laboratorio {
  id: number;
  nombre: string;
  ubicacion: string;
  capacidad: number;
  horarioDisponible: string;
  estado: EstadoLaboratorio;
}

export interface LaboratorioRequest {
  nombre: string;
  ubicacion: string;
  capacidad: number;
  horarioDisponible: string;
}

@Injectable({ providedIn: 'root' })
export class LaboratorioService {
  private readonly http = inject(HttpClient);

  listarLaboratorios(): Observable<Laboratorio[]> {
    return this.http.get<Laboratorio[]>(`${apiUrl}/laboratorios`);
  }

  crearLaboratorio(request: LaboratorioRequest): Observable<Laboratorio> {
    return this.http.post<Laboratorio>(`${apiUrl}/laboratorios`, request);
  }

  actualizarLaboratorio(id: number, request: LaboratorioRequest): Observable<Laboratorio> {
    return this.http.put<Laboratorio>(`${apiUrl}/laboratorios/${id}`, request);
  }

  ponerEnMantenimiento(id: number): Observable<Laboratorio> {
    return this.http.patch<Laboratorio>(`${apiUrl}/laboratorios/${id}/mantenimiento`, {});
  }

  activarLaboratorio(id: number): Observable<Laboratorio> {
    return this.http.patch<Laboratorio>(`${apiUrl}/laboratorios/${id}/activar`, {});
  }
}
