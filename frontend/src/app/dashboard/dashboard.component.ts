import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SesionPorFecha, SesionesService } from '../sesiones/sesiones.service';
import { ReportesService, ResumenReporte } from './reportes.service';

function fechaLocalHoy(): string {
  const hoy = new Date();
  const año = hoy.getFullYear();
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  const dia = String(hoy.getDate()).padStart(2, '0');
  return `${año}-${mes}-${dia}`;
}

@Component({
  selector: 'app-dashboard',
  imports: [FormsModule],
  template: `
    <section class="dashboard">
      @if (error(); as error) {
        <p class="mensaje-error" role="alert">{{ error }}</p>
      } @else if (cargando()) {
        <p class="cargando">Cargando dashboard...</p>
      } @else if (resumen(); as resumen) {
        <div class="tarjetas">
          <div class="card tarjeta">
            <span class="valor">{{ resumen.totalSesiones }}</span>
            <span class="etiqueta">Sesiones realizadas</span>
          </div>
          <div class="card tarjeta">
            <span class="valor">{{ resumen.asistenciaPromedio }}%</span>
            <span class="etiqueta">Asistencia promedio</span>
          </div>
          <div class="card tarjeta">
            <span class="valor">{{ resumen.totalEstudiantes }}</span>
            <span class="etiqueta">Total de estudiantes</span>
          </div>
        </div>

        <div class="riesgo">
          <h2>Estudiantes en riesgo (menos de 80% de asistencia)</h2>

          @if (resumen.estudiantesEnRiesgo.length === 0) {
            <p class="estado-vacio">Ningún estudiante está por debajo del 80% de asistencia.</p>
          } @else {
            <div class="tabla-contenedor">
              <table class="tabla">
                <thead>
                  <tr>
                    <th>Estudiante</th>
                    <th>Código</th>
                    <th>Curso</th>
                    <th>Porcentaje</th>
                    <th class="numero">Asistidas</th>
                  </tr>
                </thead>
                <tbody>
                  @for (estudiante of resumen.estudiantesEnRiesgo; track estudiante.id) {
                    <tr>
                      <td data-label="Estudiante">{{ estudiante.nombre }}</td>
                      <td data-label="Código">{{ estudiante.codigo }}</td>
                      <td data-label="Curso">{{ estudiante.curso }}</td>
                      <td data-label="Porcentaje">
                        <div class="porcentaje">
                          <div class="barra">
                            <div class="relleno" [style.width.%]="estudiante.porcentaje"></div>
                          </div>
                          <span>{{ estudiante.porcentaje }}%</span>
                        </div>
                      </td>
                      <td data-label="Asistidas" class="numero">
                        {{ estudiante.sesionesAsistidas }} / {{ estudiante.sesionesTotales }}
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      }

      <div class="card consulta-fecha">
        <h2>Consulta por fecha</h2>
        <label>
          Fecha
          <input
            type="date"
            name="fechaConsulta"
            [ngModel]="fecha()"
            (ngModelChange)="onFechaChange($event)"
          />
        </label>

        @if (errorSesiones(); as errorSesiones) {
          <p class="mensaje-error" role="alert">{{ errorSesiones }}</p>
        }

        <div aria-live="polite">
          @if (cargandoSesiones()) {
            <p class="cargando">Cargando sesiones...</p>
          } @else if (sesionesDelDia().length === 0) {
            <p class="estado-vacio">No hubo sesiones en esta fecha.</p>
          } @else {
            <div class="tabla-contenedor">
              <table class="tabla">
                <thead>
                  <tr>
                    <th>Laboratorio</th>
                    <th>Curso</th>
                    <th>Hora</th>
                    <th>Estado</th>
                    <th class="numero">Presentes</th>
                    <th class="numero">Tarde</th>
                    <th class="numero">Ausentes</th>
                  </tr>
                </thead>
                <tbody>
                  @for (sesion of sesionesDelDia(); track sesion.sesionId) {
                    <tr
                      tabindex="0"
                      role="link"
                      [attr.aria-label]="'Ver participantes de ' + sesion.cursoNombre"
                      (click)="irParticipantes(sesion.sesionId)"
                      (keydown.enter)="irParticipantes(sesion.sesionId)"
                    >
                      <td data-label="Laboratorio">{{ sesion.laboratorioNombre }}</td>
                      <td data-label="Curso">{{ sesion.cursoNombre }} ({{ sesion.cursoGrupo }})</td>
                      <td data-label="Hora">{{ sesion.horaInicio.slice(0, 5) }}</td>
                      <td data-label="Estado">
                        <span [class]="claseBadge(sesion.estado)">{{ sesion.estado }}</span>
                      </td>
                      <td data-label="Presentes" class="numero">{{ sesion.presentes }}</td>
                      <td data-label="Tarde" class="numero">{{ sesion.tarde }}</td>
                      <td data-label="Ausentes" class="numero">{{ sesion.ausentes }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      </div>
    </section>
  `,
  styles: `
    .dashboard {
      display: grid;
      gap: var(--espacio-5);
    }
    .tarjetas {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: var(--espacio-4);
    }
    .tarjeta {
      display: grid;
      gap: 4px;
    }
    .tarjeta .valor {
      font-size: var(--texto-2xl);
      font-weight: 700;
      color: var(--color-texto);
    }
    .tarjeta .etiqueta {
      font-size: var(--texto-sm);
      color: var(--color-texto-suave);
    }
    .riesgo h2,
    .consulta-fecha h2 {
      margin: 0 0 var(--espacio-3);
      font-size: var(--texto-lg);
      color: var(--color-texto);
    }
    .porcentaje {
      display: flex;
      align-items: center;
      gap: var(--espacio-2);
      min-width: 140px;
    }
    .barra {
      flex: 1;
      height: 8px;
      border-radius: var(--radio-pill);
      background: var(--color-fondo);
      overflow: hidden;
    }
    .relleno {
      height: 100%;
      border-radius: var(--radio-pill);
      background: var(--color-error);
    }
    .consulta-fecha {
      display: grid;
      gap: var(--espacio-4);
    }
    .consulta-fecha label {
      display: grid;
      gap: var(--espacio-1);
      max-width: 220px;
      color: var(--color-texto);
      font-weight: 600;
      font-size: var(--texto-sm);
    }
    .consulta-fecha input {
      min-height: 40px;
      padding: 0 var(--espacio-3);
      border: 1px solid var(--color-borde);
      border-radius: var(--radio-sm);
      background: var(--color-superficie);
      color: var(--color-texto);
      font: inherit;
    }
    @media (max-width: 767px) {
      .porcentaje {
        min-width: 0;
        flex: 1;
      }
    }
  `,
})
export class DashboardComponent implements OnInit {
  private readonly reportesService = inject(ReportesService);
  private readonly sesionesService = inject(SesionesService);
  private readonly router = inject(Router);

  resumen = signal<ResumenReporte | null>(null);
  cargando = signal(true);
  error = signal<string | null>(null);

  fecha = signal(fechaLocalHoy());
  sesionesDelDia = signal<SesionPorFecha[]>([]);
  cargandoSesiones = signal(true);
  errorSesiones = signal<string | null>(null);

  ngOnInit(): void {
    this.reportesService.obtenerResumen().subscribe({
      next: (resumen) => {
        this.resumen.set(resumen);
        this.cargando.set(false);
      },
      error: (error: unknown) => {
        this.error.set(this.mensajeError(error, 'No se pudo cargar el dashboard.'));
        this.cargando.set(false);
      },
    });

    this.cargarSesionesDelDia();
  }

  onFechaChange(valor: string): void {
    this.fecha.set(valor);
    this.cargarSesionesDelDia();
  }

  irParticipantes(sesionId: number): void {
    this.router.navigate(['/panel/sesiones', sesionId, 'participantes']);
  }

  claseBadge(estado: SesionPorFecha['estado']): string {
    return `badge-estado badge-estado--${estado.toLowerCase()}`;
  }

  private cargarSesionesDelDia(): void {
    this.cargandoSesiones.set(true);
    this.errorSesiones.set(null);

    this.sesionesService.listarPorFecha(this.fecha()).subscribe({
      next: (sesiones) => {
        this.sesionesDelDia.set(
          [...sesiones].sort((a, b) => a.horaInicio.localeCompare(b.horaInicio)),
        );
        this.cargandoSesiones.set(false);
      },
      error: (error: unknown) => {
        this.errorSesiones.set(
          this.mensajeError(error, 'No se pudieron cargar las sesiones de esta fecha.'),
        );
        this.cargandoSesiones.set(false);
      },
    });
  }

  private mensajeError(error: unknown, mensajePorDefecto: string): string {
    if (error instanceof HttpErrorResponse && error.error?.message) {
      return error.error.message;
    }
    return mensajePorDefecto;
  }
}
