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
        <p class="error" role="alert">{{ error }}</p>
      } @else if (cargando()) {
        <p>Cargando historial del estudiante...</p>
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
            <p class="vacio">No hay cursos para mostrar.</p>
          } @else {
            <div class="tarjetas">
              @for (curso of historial.porcentajesPorCurso; track curso.cursoId) {
                <article class="tarjeta">
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
            <p class="vacio">No hay sesiones para mostrar.</p>
          } @else {
            <div class="tabla-contenedor">
              <table>
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
                      <td>{{ sesion.fecha }} {{ sesion.hora }}</td>
                      <td>{{ sesion.curso }}</td>
                      <td>{{ sesion.laboratorio }}</td>
                      <td>
                        <span class="estado" [class]="claseEstado(sesion.estado)">
                          {{ sesion.estado }}
                        </span>
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
      gap: 24px;
      color: var(--color-texto);
    }
    .encabezado {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
    }
    h1,
    h2,
    h3,
    p {
      margin: 0;
    }
    h1 {
      font-size: 24px;
    }
    h2 {
      margin-bottom: 12px;
      font-size: 18px;
    }
    h3 {
      font-size: 16px;
    }
    .codigo,
    .sesiones {
      color: var(--color-texto-suave);
    }
    .codigo {
      margin-top: 4px;
    }
    .etiqueta {
      padding: 6px 12px;
      border-radius: 999px;
      background: var(--color-primario-suave);
      color: var(--color-primario);
      font-size: 12px;
      font-weight: 700;
      white-space: nowrap;
    }
    .tarjetas {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
    }
    .tarjeta {
      display: grid;
      align-content: start;
      gap: 14px;
      padding: 18px;
      border: 1px solid var(--color-borde);
      border-radius: 8px;
      background: var(--color-superficie);
    }
    .resumen-porcentaje {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 12px;
    }
    .porcentaje {
      color: var(--color-primario);
      font-size: 24px;
      font-weight: 700;
    }
    .sesiones {
      font-size: 13px;
    }
    .barra {
      height: 10px;
      overflow: hidden;
      border-radius: 999px;
      background: var(--color-fondo);
    }
    .progreso {
      height: 100%;
      border-radius: inherit;
      background: var(--color-primario);
    }
    .sin-sesiones,
    .vacio {
      color: var(--color-texto-suave);
    }
    .sin-sesiones {
      padding: 10px;
      border-radius: 6px;
      background: var(--color-fondo);
      font-weight: 600;
    }
    .tabla-contenedor {
      overflow-x: auto;
      border: 1px solid var(--color-borde);
      border-radius: 8px;
      background: var(--color-superficie);
    }
    table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }
    th,
    td {
      padding: 12px 14px;
      border-bottom: 1px solid var(--color-borde);
      white-space: nowrap;
    }
    th {
      color: var(--color-texto-suave);
      font-size: 12px;
      text-transform: uppercase;
    }
    tbody tr:last-child td {
      border-bottom: 0;
    }
    .estado {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 700;
    }
    .estado-presente {
      background: var(--color-primario-suave);
      color: var(--color-primario);
    }
    .estado-tarde {
      background: var(--color-advertencia-suave);
      color: var(--color-advertencia);
    }
    .estado-ausente {
      background: var(--color-error-suave);
      color: var(--color-error);
    }
    .estado-justificado {
      background: var(--color-fondo);
      color: var(--color-texto-suave);
    }
    .error {
      padding: 10px 14px;
      border-radius: 6px;
      background: var(--color-error-suave);
      color: var(--color-error);
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
    return `estado-${estado.toLowerCase()}`;
  }

  private mensajeError(error: unknown): string {
    if (error instanceof HttpErrorResponse && typeof error.error?.message === 'string') {
      return error.error.message;
    }
    return 'No se pudo cargar el historial del estudiante.';
  }
}
