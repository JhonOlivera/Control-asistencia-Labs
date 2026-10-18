import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ReportesService, ResumenReporte } from './reportes.service';

@Component({
  selector: 'app-dashboard',
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
    .riesgo h2 {
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

  resumen = signal<ResumenReporte | null>(null);
  cargando = signal(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.reportesService.obtenerResumen().subscribe({
      next: (resumen) => {
        this.resumen.set(resumen);
        this.cargando.set(false);
      },
      error: (error: unknown) => {
        this.error.set(this.mensajeError(error));
        this.cargando.set(false);
      },
    });
  }

  private mensajeError(error: unknown): string {
    if (error instanceof HttpErrorResponse && error.error?.message) {
      return error.error.message;
    }
    return 'No se pudo cargar el dashboard.';
  }
}
