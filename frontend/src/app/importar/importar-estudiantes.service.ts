import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { apiUrl } from '../core/environment';

export interface ImportacionError {
  numeroFila: number;
  codigo: string;
  motivo: string;
}

export interface ImportacionResultado {
  totalFilas: number;
  creados: number;
  yaExistentes: number;
  matriculados: number;
  errores: ImportacionError[];
}

@Injectable({ providedIn: 'root' })
export class ImportarEstudiantesService {
  private readonly http = inject(HttpClient);

  importarEstudiantes(cursoId: number, archivo: File): Observable<ImportacionResultado> {
    const formData = new FormData();
    formData.append('archivo', archivo);
    return this.http.post<ImportacionResultado>(
      `${apiUrl}/cursos/${cursoId}/importar-estudiantes`,
      formData,
    );
  }
}
