import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { apiUrl } from '../core/environment';

export interface Curso {
  id: number;
  nombre: string;
  grupo: string;
}

export interface CursoRequest {
  nombre: string;
  grupo: string;
}

@Injectable({ providedIn: 'root' })
export class CursoService {
  private readonly http = inject(HttpClient);

  listarCursos(): Observable<Curso[]> {
    return this.http.get<Curso[]>(`${apiUrl}/cursos`);
  }

  crearCurso(request: CursoRequest): Observable<Curso> {
    return this.http.post<Curso>(`${apiUrl}/cursos`, request);
  }

  actualizarCurso(id: number, request: CursoRequest): Observable<Curso> {
    return this.http.put<Curso>(`${apiUrl}/cursos/${id}`, request);
  }

  eliminarCurso(id: number): Observable<void> {
    return this.http.delete<void>(`${apiUrl}/cursos/${id}`);
  }
}
