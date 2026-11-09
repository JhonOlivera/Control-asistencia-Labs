import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { formatearEncabezadoFechaHora, formatearFechaHoraCorta } from '../core/fecha.utils';
import { SesionParticipantesResponse, SesionesService } from './sesiones.service';

type FiltroAsistencia = 'TODOS' | 'PRESENTE' | 'TARDE' | 'AUSENTE';
type FiltroMatricula = 'TODOS' | 'ACTIVA' | 'INACTIVA';

@Component({
  selector: 'app-sesion-participantes',
  imports: [FormsModule],
  template: `
    <section class="participantes">
      <div class="volver">
        <button type="button" class="btn btn--secundario" (click)="volver()">← Volver</button>
      </div>

      @if (error(); as error) {
        <p class="mensaje-error" role="alert">{{ error }}</p>
      }

      @if (cargando()) {
        <p class="cargando">
          Cargando participantes... Si el servidor estaba inactivo, puede tardar hasta un minuto.
        </p>
      } @else if (datos(); as datos) {
        <header class="encabezado">
          <div>
            <h1>{{ datos.cursoNombre }} ({{ datos.cursoGrupo }})</h1>
            <p class="subtitulo">
              {{ datos.laboratorioNombre }} · {{ encabezadoFechaHora(datos) }}
            </p>
          </div>
          <span [class]="claseBadgeEstado(datos.estado)">{{ datos.estado }}</span>
        </header>

        <div class="tarjetas" aria-live="polite">
          <div class="card tarjeta">
            <span class="valor">{{ datos.resumen.matriculados }}</span>
            <span class="etiqueta">Matriculados</span>
          </div>
          <div class="card tarjeta">
            <span class="valor">{{ datos.resumen.presentes }}</span>
            <span class="etiqueta">Presentes</span>
          </div>
          <div class="card tarjeta">
            <span class="valor">{{ datos.resumen.tarde }}</span>
            <span class="etiqueta">Tarde</span>
          </div>
          <div class="card tarjeta">
            <span class="valor">{{ datos.resumen.ausentes }}</span>
            <span class="etiqueta">Ausentes</span>
          </div>
        </div>

        <div class="card filtros">
          <label>
            Asistencia
            <select
              name="filtroAsistencia"
              [(ngModel)]="filtroAsistencia"
              (ngModelChange)="aplicarFiltros()"
            >
              <option value="TODOS">Todos</option>
              <option value="PRESENTE">Presente</option>
              <option value="TARDE">Tarde</option>
              <option value="AUSENTE">Ausente</option>
            </select>
          </label>
          <label>
            Matrícula
            <select
              name="filtroMatricula"
              [(ngModel)]="filtroMatricula"
              (ngModelChange)="aplicarFiltros()"
            >
              <option value="TODOS">Todos</option>
              <option value="ACTIVA">Activos</option>
              <option value="INACTIVA">Inactivos</option>
            </select>
          </label>
        </div>

        <div class="card descarga">
          <label class="interruptor">
            <input type="checkbox" name="incluirAusentes" [(ngModel)]="incluirAusentes" />
            Incluir ausentes
          </label>
          <button type="button" class="btn" (click)="descargarCsv()" [disabled]="descargando()">
            {{ descargando() ? 'Descargando...' : 'Descargar lista (CSV)' }}
          </button>
        </div>

        @if (errorDescarga(); as errorDescarga) {
          <p class="mensaje-error" role="alert">{{ errorDescarga }}</p>
        }

        <div aria-live="polite">
          @if (datos.participantes.length === 0) {
            <p class="estado-vacio">No hay participantes que coincidan con los filtros.</p>
          } @else {
            <div class="tabla-contenedor">
              <table class="tabla">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Nombre</th>
                    <th>Correo</th>
                    <th>Asistencia</th>
                    <th>Hora de registro</th>
                    <th>Matrícula</th>
                  </tr>
                </thead>
                <tbody>
                  @for (participante of datos.participantes; track participante.estudianteId) {
                    <tr>
                      <td data-label="Código">{{ participante.codigo }}</td>
                      <td data-label="Nombre">{{ participante.nombre }}</td>
                      <td data-label="Correo">{{ participante.correo }}</td>
                      <td data-label="Asistencia">
                        <span [class]="claseBadgeEstado(participante.asistencia)">
                          {{ participante.asistencia }}
                        </span>
                      </td>
                      <td data-label="Hora de registro">
                        {{ horaRegistroCorta(participante.horaRegistro) }}
                      </td>
                      <td data-label="Matrícula">
                        <span [class]="claseBadgeMatricula(participante.estadoMatricula)">
                          {{ participante.estadoMatricula === 'ACTIVA' ? 'ACTIVO' : 'INACTIVO' }}
                        </span>
                      </td>
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
    .participantes {
      display: grid;
      gap: var(--espacio-4);
    }
    .encabezado {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: var(--espacio-4);
    }
    h1 {
      margin: 0;
      font-size: var(--texto-xl);
      color: var(--color-texto);
    }
    .subtitulo {
      margin: var(--espacio-1) 0 0;
      color: var(--color-texto-suave);
    }
    .tarjetas {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: var(--espacio-3);
    }
    .tarjeta {
      display: grid;
      gap: 2px;
    }
    .tarjeta .valor {
      font-size: var(--texto-2xl);
      font-weight: 700;
      color: var(--color-texto);
    }
    .tarjeta .etiqueta {
      font-size: var(--texto-xs);
      color: var(--color-texto-suave);
      text-transform: uppercase;
    }
    .filtros {
      display: flex;
      flex-wrap: wrap;
      gap: var(--espacio-4);
    }
    .descarga {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: var(--espacio-3);
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
    .interruptor {
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: var(--espacio-2);
    }
    .interruptor input {
      width: 18px;
      height: 18px;
      accent-color: var(--color-primario);
      flex-shrink: 0;
    }
    @media (max-width: 480px) {
      .descarga {
        flex-direction: column;
        align-items: stretch;
      }
      .descarga .btn {
        width: 100%;
      }
    }
  `,
})
export class SesionParticipantesComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly sesionesService = inject(SesionesService);

  private readonly sesionId = Number(this.route.snapshot.paramMap.get('id'));

  datos = signal<SesionParticipantesResponse | null>(null);
  cargando = signal(true);
  error = signal<string | null>(null);

  filtroAsistencia: FiltroAsistencia = 'TODOS';
  filtroMatricula: FiltroMatricula = 'TODOS';
  incluirAusentes = false;

  descargando = signal(false);
  errorDescarga = signal<string | null>(null);

  ngOnInit(): void {
    if (!this.sesionId) {
      this.error.set('Sesión no válida.');
      this.cargando.set(false);
      return;
    }
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(null);

    this.sesionesService
      .obtenerParticipantes(this.sesionId, {
        asistencia: this.filtroAsistencia === 'TODOS' ? undefined : this.filtroAsistencia,
        matricula: this.filtroMatricula === 'TODOS' ? undefined : this.filtroMatricula,
      })
      .subscribe({
        next: (datos) => {
          this.datos.set(datos);
          this.cargando.set(false);
        },
        error: (error: unknown) => {
          this.error.set(this.mensajeError(error, 'No se pudieron cargar los participantes.'));
          this.cargando.set(false);
        },
      });
  }

  aplicarFiltros(): void {
    this.cargar();
  }

  volver(): void {
    this.router.navigate(['/panel/sesiones']);
  }

  descargarCsv(): void {
    this.descargando.set(true);
    this.errorDescarga.set(null);

    this.sesionesService.descargarParticipantes(this.sesionId, this.incluirAusentes).subscribe({
      next: (respuesta) => {
        this.descargando.set(false);
        const blob = respuesta.body;
        if (!blob) {
          this.errorDescarga.set('No se pudo generar el archivo.');
          return;
        }

        const nombrePorDefecto = `asistencia-${this.datos()?.fecha ?? 'sesion'}.csv`;
        const nombreArchivo = this.extraerNombreArchivo(
          respuesta.headers.get('Content-Disposition'),
          nombrePorDefecto,
        );

        const url = window.URL.createObjectURL(blob);
        const enlace = document.createElement('a');
        enlace.href = url;
        enlace.download = nombreArchivo;
        enlace.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.descargando.set(false);
        this.errorDescarga.set('No se pudo descargar la lista de participantes.');
      },
    });
  }

  claseBadgeEstado(estado: string): string {
    return `badge-estado badge-estado--${estado.toLowerCase()}`;
  }

  claseBadgeMatricula(estadoMatricula: string): string {
    return estadoMatricula === 'ACTIVA'
      ? 'badge-estado badge-estado--abierta'
      : 'badge-estado badge-estado--cerrada';
  }

  horaRegistroCorta(horaRegistro: string | null): string {
    return formatearFechaHoraCorta(horaRegistro);
  }

  encabezadoFechaHora(datos: SesionParticipantesResponse): string {
    return formatearEncabezadoFechaHora(datos.fecha, datos.horaInicio);
  }

  private extraerNombreArchivo(encabezado: string | null, nombrePorDefecto: string): string {
    if (!encabezado) {
      return nombrePorDefecto;
    }

    const coincidenciaUtf8 = encabezado.match(/filename\*=UTF-8''([^;]+)/i);
    if (coincidenciaUtf8) {
      try {
        return decodeURIComponent(coincidenciaUtf8[1]);
      } catch {
        // Si falla la decodificación, se intenta con el nombre simple.
      }
    }

    const coincidenciaSimple = encabezado.match(/filename="?([^";]+)"?/i);
    return coincidenciaSimple ? coincidenciaSimple[1] : nombrePorDefecto;
  }

  private mensajeError(error: unknown, mensajePorDefecto: string): string {
    if (error instanceof HttpErrorResponse && error.error?.message) {
      return error.error.message;
    }
    return mensajePorDefecto;
  }
}
