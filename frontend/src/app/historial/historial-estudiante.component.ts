import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { EMPTY, catchError, distinctUntilChanged, finalize, map, switchMap, tap } from 'rxjs';
import {
  EstadoAsistencia,
  HistorialEstudiante,
  HistorialService,
} from './historial.service';

@Component({
  selector: 'app-historial-estudiante',
  template: `
    <section class="historial">
      @if (error(); as error) {
        <p class="mensaje-error" role="alert">{{ error }}</p>
      } @else if (cargando()) {
        <p class="cargando">Cargando historial del estudiante...</p>
      } @else if (historial(); as historial) {
        <header class="encabezado">
          <div>
            <h1>{{ historial.nombre }}</h1>
            <p class="codigo">Código: {{ historial.codigo }}</p>
          </div>
          <span class="etiqueta">Historial de estudiante</span>
        </header>

        <section class="cursos" aria-labelledby="titulo-cursos">
          <h2 id="titulo-cursos">Asistencia por curso</h2>
          @if (historial.porcentajesPorCurso.length === 0) {
            <p class="estado-vacio">No hay cursos para mostrar.</p>
          } @else {
            <div class="tarjetas">
              @for (curso of historial.porcentajesPorCurso; track curso.cursoId) {
                <article class="card tarjeta">
                  <h3>{{ curso.curso }}</h3>
                  @if (curso.porcentaje === null) {
                    <p class="sin-sesiones">Sin sesiones cerradas</p>
                  } @else {
                    <div class="resumen-porcentaje">
                      <span class="porcentaje">{{ curso.porcentaje }}%</span>
                      <span class="sesiones">
                        {{ curso.sesionesAsistidas }} de {{ curso.sesionesTotales }} sesiones
                      </span>
                    </div>
                    <div
                      class="barra"
                      role="progressbar"
                      [attr.aria-valuenow]="curso.porcentaje"
                      aria-valuemin="0"
                      aria-valuemax="100"
                      [attr.aria-label]="'Asistencia en ' + curso.curso"
                    >
                      <div class="progreso" [style.width.%]="anchoBarra(curso.porcentaje)"></div>
                    </div>
                  }
                </article>
              }
            </div>
          }
        </section>

        <section class="sesiones" aria-labelledby="titulo-sesiones">
          <h2 id="titulo-sesiones">Sesiones</h2>
          @if (historial.sesiones.length === 0) {
            <p class="estado-vacio">No hay sesiones para mostrar.</p>
          } @else {
            <div class="tabla-contenedor">
              <table class="tabla">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Curso</th>
                    <th>Laboratorio</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  @for (sesion of historial.sesiones; track sesion.sesionId) {
                    <tr>
                      <td data-label="Fecha">{{ sesion.fecha }} {{ sesion.hora }}</td>
                      <td data-label="Curso">{{ sesion.curso }}</td>
                      <td data-label="Laboratorio">{{ sesion.laboratorio }}</td>
                      <td data-label="Estado">
                        <span [class]="claseEstado(sesion.estado)">{{ sesion.estado }}</span>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </section>
      }
    </section>
  `,
  styles: `
    .historial {
      display: grid;
      gap: var(--espacio-5);
      color: var(--color-texto);
    }
    .encabezado {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: var(--espacio-4);
    }
    h1,
    h2,
    h3,
    p {
      margin: 0;
    }
    h1 {
      font-size: var(--texto-xl);
    }
    h2 {
      margin-bottom: var(--espacio-3);
      font-size: var(--texto-lg);
    }
    h3 {
      font-size: var(--texto-base);
    }
    .codigo,
    .sesiones {
      color: var(--color-texto-suave);
    }
    .codigo {
      margin-top: var(--espacio-1);
    }
    .etiqueta {
      padding: var(--espacio-1) var(--espacio-3);
      border-radius: var(--radio-pill);
      background: var(--color-primario-suave);
      color: var(--color-primario);
      font-size: var(--texto-xs);
      font-weight: 700;
      white-space: nowrap;
    }
    .tarjetas {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: var(--espacio-4);
    }
    .tarjeta {
      display: grid;
      align-content: start;
      gap: var(--espacio-3);
    }
    .resumen-porcentaje {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: var(--espacio-3);
    }
    .porcentaje {
      color: var(--color-primario);
      font-size: var(--texto-xl);
      font-weight: 700;
    }
    .sesiones {
      font-size: var(--texto-sm);
    }
    .barra {
      height: 10px;
      overflow: hidden;
      border-radius: var(--radio-pill);
      background: var(--color-fondo);
    }
    .progreso {
      height: 100%;
      border-radius: inherit;
      background: var(--color-primario);
    }
    .sin-sesiones {
      padding: var(--espacio-2);
      border-radius: var(--radio-sm);
      background: var(--color-fondo);
      color: var(--color-texto-suave);
      font-weight: 600;
    }
    @media (max-width: 600px) {
      .encabezado {
        flex-direction: column;
      }
    }
  `,
})
export class HistorialEstudianteComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly historialService = inject(HistorialService);
  private readonly destroyRef = inject(DestroyRef);

  readonly historial = signal<HistorialEstudiante | null>(null);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        map((params) => params.get('id')),
        distinctUntilChanged(),
        switchMap((idParametro) => {
          this.historial.set(null);
          this.error.set(null);

          if (!idParametro || !/^\d+$/.test(idParametro) || Number(idParametro) <= 0) {
            this.cargando.set(false);
            this.error.set('El identificador del estudiante no es válido.');
            return EMPTY;
          }

          this.cargando.set(true);
          return this.historialService.obtenerHistorial(Number(idParametro)).pipe(
            tap((historial) => this.historial.set(historial)),
            catchError((error: unknown) => {
              this.error.set(this.mensajeError(error));
              return EMPTY;
            }),
            finalize(() => this.cargando.set(false)),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  anchoBarra(porcentaje: number): number {
    return Math.min(100, Math.max(0, porcentaje));
  }

  claseEstado(estado: EstadoAsistencia): string {
    return `badge-estado badge-estado--${estado.toLowerCase()}`;
  }

  private mensajeError(error: unknown): string {
    if (error instanceof HttpErrorResponse && typeof error.error?.message === 'string') {
      return error.error.message;
    }
    return 'No se pudo cargar el historial del estudiante.';
  }
}
