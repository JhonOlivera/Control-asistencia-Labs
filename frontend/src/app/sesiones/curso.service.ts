import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { apiUrl } from '../core/environment';

export interface Curso {
  id: number;
  nombre: string;
  grupo: string;
}

@Injectable({ providedIn: 'root' })
export class CursoService {
  private readonly http = inject(HttpClient);

  listarCursos(): Observable<Curso[]> {
    return this.http.get<Curso[]>(`${apiUrl}/cursos`);
  }
}
