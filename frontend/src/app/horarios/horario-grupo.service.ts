import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { apiUrl } from '../core/environment';

export type DiaSemana =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY';

export interface HorarioGrupo {
  id: number;
  cursoId: number;
  cursoNombre: string;
  cursoGrupo: string;
  laboratorioId: number;
  laboratorioNombre: string;
  diaSemana: DiaSemana;
  horaInicio: string;
  horaFin: string;
  activo: boolean;
}

export interface HorarioGrupoRequest {
  cursoId: number;
  laboratorioId: number;
  diaSemana: DiaSemana;
  horaInicio: string;
  horaFin: string;
}

@Injectable({ providedIn: 'root' })
export class HorarioGrupoService {
  private readonly http = inject(HttpClient);

  listarPorCurso(cursoId: number): Observable<HorarioGrupo[]> {
    const params = new HttpParams().set('cursoId', cursoId);
    return this.http.get<HorarioGrupo[]>(`${apiUrl}/horarios-grupo`, { params });
  }

  crearHorario(request: HorarioGrupoRequest): Observable<HorarioGrupo> {
    return this.http.post<HorarioGrupo>(`${apiUrl}/horarios-grupo`, request);
  }

  actualizarHorario(id: number, request: HorarioGrupoRequest): Observable<HorarioGrupo> {
    return this.http.put<HorarioGrupo>(`${apiUrl}/horarios-grupo/${id}`, request);
  }

  desactivarHorario(id: number): Observable<HorarioGrupo> {
    return this.http.patch<HorarioGrupo>(`${apiUrl}/horarios-grupo/${id}/desactivar`, {});
  }
}
