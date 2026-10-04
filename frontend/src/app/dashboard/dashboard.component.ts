import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ReportesService, ResumenReporte } from './reportes.service';

@Component({
  selector: 'app-dashboard',
  template: `
    <section class="dashboard">
      @if (error(); as error) {
        <p class="error">{{ error }}</p>
      } @else if (cargando()) {
        <p>Cargando dashboard...</p>
      } @else if (resumen(); as resumen) {
        <div class="tarjetas">
          <div class="tarjeta">
            <span class="valor">{{ resumen.totalSesiones }}</span>
            <span class="etiqueta">Sesiones realizadas</span>
          </div>
          <div class="tarjeta">
            <span class="valor">{{ resumen.asistenciaPromedio }}%</span>
            <span class="etiqueta">Asistencia promedio</span>
          </div>
          <div class="tarjeta">
            <span class="valor">{{ resumen.totalEstudiantes }}</span>
            <span class="etiqueta">Total de estudiantes</span>
          </div>
        </div>

        <div class="riesgo">
          <h2>Estudiantes en riesgo (menos de 80% de asistencia)</h2>

          @if (resumen.estudiantesEnRiesgo.length === 0) {
            <p class="sin-riesgo">Ningún estudiante está por debajo del 80% de asistencia.</p>
          } @else {
            <table>
              <thead>
                <tr>
                  <th>Estudiante</th>
                  <th>Código</th>
                  <th>Curso</th>
                  <th>Porcentaje</th>
                  <th>Asistidas</th>
                </tr>
              </thead>
              <tbody>
                @for (estudiante of resumen.estudiantesEnRiesgo; track estudiante.id) {
                  <tr>
                    <td>{{ estudiante.nombre }}</td>
                    <td>{{ estudiante.codigo }}</td>
                    <td>{{ estudiante.curso }}</td>
                    <td>
                      <div class="porcentaje">
                        <div class="barra">
                          <div class="relleno" [style.width.%]="estudiante.porcentaje"></div>
                        </div>
                        <span>{{ estudiante.porcentaje }}%</span>
                      </div>
                    </td>
                    <td>{{ estudiante.sesionesAsistidas }} / {{ estudiante.sesionesTotales }}</td>
                  </tr>
                }
              </tbody>
            </table>
          }
        </div>
      }
    </section>
  `,
  styles: `
    .dashboard {
      display: grid;
      gap: 24px;
    }
    .error {
      padding: 10px 14px;
      border-radius: 6px;
      background: #fde8e8;
      color: #9b2c2c;
    }
    .tarjetas {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }
    .tarjeta {
      display: grid;
      gap: 4px;
      padding: 20px;
      border: 1px solid var(--color-borde);
      border-radius: 8px;
      background: var(--color-superficie);
    }
    .tarjeta .valor {
      font-size: 32px;
      font-weight: 700;
      color: var(--color-texto);
    }
    .tarjeta .etiqueta {
      font-size: 13px;
      color: var(--color-texto-suave);
    }
    .riesgo h2 {
      margin: 0 0 12px;
      font-size: 18px;
      color: var(--color-texto);
    }
    .sin-riesgo {
      margin: 0;
      padding: 16px;
      border: 1px solid var(--color-borde);
      border-radius: 8px;
      background: var(--color-primario-suave);
      color: var(--color-primario);
      font-weight: 600;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      background: var(--color-superficie);
      border: 1px solid var(--color-borde);
      border-radius: 8px;
      overflow: hidden;
    }
    th,
    td {
      padding: 10px 14px;
      text-align: left;
      border-bottom: 1px solid var(--color-borde);
    }
    th {
      color: var(--color-texto-suave);
      font-size: 12px;
      text-transform: uppercase;
    }
    .porcentaje {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 140px;
    }
    .barra {
      flex: 1;
      height: 8px;
      border-radius: 999px;
      background: var(--color-fondo);
      overflow: hidden;
    }
    .relleno {
      height: 100%;
      border-radius: 999px;
      background: #c0392b;
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
