import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Curso, CursoService } from '../sesiones/curso.service';
import { ImportacionResultado, ImportarEstudiantesService } from './importar-estudiantes.service';

const TAMANO_MAXIMO_BYTES = 2 * 1024 * 1024;
const EXTENSIONES_PERMITIDAS = ['.csv', '.xlsx'];
const PLANTILLA_CSV =
  'codigo,nombre,correo\n' +
  'EST-9001,Estudiante Ejemplo Uno,estudiante.uno@ejemplo.edu.co\n' +
  'EST-9002,Estudiante Ejemplo Dos,estudiante.dos@ejemplo.edu.co\n';

@Component({
  selector: 'app-importar-estudiantes',
  imports: [FormsModule, RouterLink],
  template: `
    <section class="importar">
      <header class="encabezado">
        <h1>Importar estudiantes</h1>
      </header>

      <p class="ayuda">
        El archivo debe tener las columnas <strong>código</strong>, <strong>nombre</strong> y
        <strong>correo</strong>, en formato CSV o Excel (.xlsx), con un tamaño máximo de 2 MB. Si un
        estudiante ya existe (por código o por correo) se reutiliza y solo se matricula en el curso si
        aún no lo está. Esta importación no envía correos a los estudiantes.
      </p>

      @if (error(); as error) {
        <p class="mensaje-error" role="alert">{{ error }}</p>
      }

      <form class="card formulario" (ngSubmit)="importar()">
        <label>
          Curso
          <select
            name="cursoId"
            [ngModel]="cursoId()"
            (ngModelChange)="seleccionarCurso($event)"
            required
          >
            <option [ngValue]="null" disabled>Selecciona un curso</option>
            @for (curso of cursos(); track curso.id) {
              <option [ngValue]="curso.id">{{ curso.nombre }} ({{ curso.grupo }})</option>
            }
          </select>
          <a class="enlace-crear-grupo" routerLink="/panel/grupos">¿No existe el grupo? Créalo</a>
        </label>

        <div class="campo-archivo">
          <label for="archivo-input">Archivo (.csv o .xlsx)</label>
          <input
            id="archivo-input"
            type="file"
            accept=".csv,.xlsx"
            (change)="seleccionarArchivo($event)"
          />

          @if (archivo(); as archivoElegido) {
            <p class="archivo-elegido">
              <span>{{ archivoElegido.name }} ({{ formatearTamano(archivoElegido.size) }})</span>
              <button type="button" class="btn btn--secundario btn--chico" (click)="quitarArchivo()">
                Quitar
              </button>
            </p>
          }
        </div>

        <div class="acciones">
          <button type="button" class="btn btn--secundario" (click)="descargarPlantilla()">
            Descargar plantilla
          </button>
          <button
            type="submit"
            class="btn"
            [disabled]="cursoId() === null || !archivo() || importando()"
          >
            {{ importando() ? 'Importando...' : 'Importar' }}
          </button>
        </div>

        @if (importando()) {
          <p class="cargando" role="status">
            Importando... (si el servidor estaba dormido puede tardar hasta 1 minuto)
          </p>
        }
      </form>

      @if (resultado(); as resultado) {
        <div class="card resultado" role="status">
          <div class="tarjetas-resumen">
            <div class="tarjeta-metrica">
              <span class="valor">{{ resultado.totalFilas }}</span>
              <span class="etiqueta">Filas totales</span>
            </div>
            <div class="tarjeta-metrica">
              <span class="valor">{{ resultado.creados }}</span>
              <span class="etiqueta">Creados</span>
            </div>
            <div class="tarjeta-metrica">
              <span class="valor">{{ resultado.yaExistentes }}</span>
              <span class="etiqueta">Ya existentes</span>
            </div>
            <div class="tarjeta-metrica">
              <span class="valor">{{ resultado.matriculados }}</span>
              <span class="etiqueta">Matriculados</span>
            </div>
          </div>

          @if (resultado.errores.length === 0) {
            <p class="resumen-linea resumen-linea--exito">Se importaron todas las filas sin errores.</p>
          } @else {
            <p class="resumen-linea resumen-linea--error">
              {{ resultado.errores.length }} fila(s) con error:
            </p>
            <div class="tabla-contenedor">
              <table class="tabla">
                <thead>
                  <tr>
                    <th>Fila</th>
                    <th>Código</th>
                    <th>Motivo</th>
                  </tr>
                </thead>
                <tbody>
                  @for (fila of resultado.errores; track fila.numeroFila) {
                    <tr>
                      <td data-label="Fila">{{ fila.numeroFila }}</td>
                      <td data-label="Código">{{ fila.codigo || '—' }}</td>
                      <td data-label="Motivo">{{ fila.motivo }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      }
    </section>
  `,
  styles: `
    .importar {
      display: grid;
      gap: var(--espacio-4);
    }
    .encabezado {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--espacio-3);
    }
    h1 {
      margin: 0;
      font-size: var(--texto-xl);
      color: var(--color-texto);
    }
    .ayuda {
      margin: 0;
      padding: var(--espacio-3) var(--espacio-4);
      border-radius: var(--radio-sm);
      background: var(--color-primario-suave);
      color: var(--color-texto);
      font-size: var(--texto-sm);
    }
    .formulario {
      display: grid;
      gap: var(--espacio-4);
      max-width: 520px;
    }
    label {
      display: grid;
      gap: var(--espacio-1);
      color: var(--color-texto);
      font-weight: 600;
      font-size: var(--texto-sm);
    }
    select {
      min-height: 40px;
      padding: 0 var(--espacio-3);
      border: 1px solid var(--color-borde);
      border-radius: var(--radio-sm);
      background: var(--color-superficie);
      color: var(--color-texto);
      font: inherit;
    }
    .enlace-crear-grupo {
      justify-self: start;
      color: var(--color-primario);
      font-weight: 600;
      font-size: var(--texto-xs);
      text-decoration: none;
    }
    .enlace-crear-grupo:hover {
      text-decoration: underline;
    }
    .campo-archivo {
      display: grid;
      gap: var(--espacio-2);
    }
    .campo-archivo input[type='file'] {
      min-height: 40px;
      padding: var(--espacio-2) var(--espacio-3);
      border: 1px solid var(--color-borde);
      border-radius: var(--radio-sm);
      background: var(--color-superficie);
      color: var(--color-texto);
      font: inherit;
    }
    .archivo-elegido {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: var(--espacio-3);
      margin: 0;
      padding: var(--espacio-2) var(--espacio-3);
      border: 1px solid var(--color-borde);
      border-radius: var(--radio-sm);
      background: var(--color-fondo);
      color: var(--color-texto);
      font-weight: 400;
      font-size: var(--texto-sm);
    }
    .acciones {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      gap: var(--espacio-3);
      margin-top: var(--espacio-2);
    }
    .resultado {
      display: grid;
      gap: var(--espacio-3);
    }
    .tarjetas-resumen {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: var(--espacio-3);
    }
    .tarjeta-metrica {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--espacio-1);
      padding: var(--espacio-3);
      border: 1px solid var(--color-borde);
      border-radius: var(--radio-sm);
      background: var(--color-fondo);
    }
    .tarjeta-metrica .valor {
      font-size: var(--texto-2xl);
      font-weight: 700;
      color: var(--color-primario);
    }
    .tarjeta-metrica .etiqueta {
      font-size: var(--texto-xs);
      color: var(--color-texto-suave);
      text-align: center;
    }
    .resumen-linea {
      margin: 0;
      font-size: var(--texto-sm);
      font-weight: 600;
    }
    .resumen-linea--exito {
      color: var(--color-presente);
    }
    .resumen-linea--error {
      color: var(--color-error);
    }
    .btn--chico {
      min-height: 32px;
      padding: 0 var(--espacio-3);
      font-size: var(--texto-xs);
    }
    @media (max-width: 480px) {
      .acciones {
        flex-direction: column-reverse;
      }
      .acciones .btn {
        width: 100%;
      }
    }
  `,
})
export class ImportarEstudiantesComponent implements OnInit {
  private readonly cursoService = inject(CursoService);
  private readonly importarEstudiantesService = inject(ImportarEstudiantesService);

  cursos = signal<Curso[]>([]);
  cursoId = signal<number | null>(null);
  archivo = signal<File | null>(null);
  error = signal<string | null>(null);
  importando = signal(false);
  resultado = signal<ImportacionResultado | null>(null);

  ngOnInit(): void {
    this.cursoService.listarCursos().subscribe({
      next: (cursos) => this.cursos.set(cursos),
      error: () => this.error.set('No se pudieron cargar los cursos.'),
    });
  }

  seleccionarCurso(cursoId: number | null): void {
    this.cursoId.set(cursoId);
  }

  seleccionarArchivo(evento: Event): void {
    const input = evento.target as HTMLInputElement;
    const archivoElegido = input.files?.[0] ?? null;
    input.value = '';

    if (!archivoElegido) {
      return;
    }

    this.error.set(null);
    this.resultado.set(null);

    const nombre = archivoElegido.name.toLowerCase();
    const extensionValida = EXTENSIONES_PERMITIDAS.some((extension) => nombre.endsWith(extension));
    if (!extensionValida) {
      this.error.set('Solo se aceptan archivos .csv o .xlsx.');
      return;
    }

    if (archivoElegido.size > TAMANO_MAXIMO_BYTES) {
      this.error.set('El archivo supera el tamaño máximo permitido de 2 MB.');
      return;
    }

    this.archivo.set(archivoElegido);
  }

  quitarArchivo(): void {
    this.archivo.set(null);
  }

  descargarPlantilla(): void {
    const contenidoConBom = '﻿' + PLANTILLA_CSV;
    const blob = new Blob([contenidoConBom], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = 'plantilla-estudiantes.csv';
    enlace.click();

    URL.revokeObjectURL(url);
  }

  importar(): void {
    const cursoId = this.cursoId();
    const archivo = this.archivo();
    if (cursoId === null || archivo === null || this.importando()) {
      return;
    }

    this.error.set(null);
    this.resultado.set(null);
    this.importando.set(true);

    this.importarEstudiantesService.importarEstudiantes(cursoId, archivo).subscribe({
      next: (resultado) => {
        this.importando.set(false);
        this.resultado.set(resultado);
      },
      error: (error: unknown) => {
        this.importando.set(false);
        this.error.set(this.mensajeError(error, 'No se pudo importar el archivo.'));
      },
    });
  }

  formatearTamano(bytes: number): string {
    if (bytes < 1024) {
      return `${bytes} B`;
    }
    const kb = bytes / 1024;
    if (kb < 1024) {
      return `${kb.toFixed(1)} KB`;
    }
    return `${(kb / 1024).toFixed(1)} MB`;
  }

  private mensajeError(error: unknown, mensajePorDefecto: string): string {
    if (error instanceof HttpErrorResponse && error.error?.message) {
      return error.error.message;
    }
    return mensajePorDefecto;
  }
}
