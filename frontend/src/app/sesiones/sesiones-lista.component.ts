import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SesionResumen, SesionesService } from './sesiones.service';

type EstadoPestana = 'ABIERTA' | 'CERRADA';

@Component({
  selector: 'app-sesiones-lista',
  imports: [FormsModule],
  template: `
    <section class="sesiones-lista">
      <header class="encabezado">
        <h1>Sesiones</h1>
        <button type="button" class="btn" (click)="nuevaSesion()">Nueva sesión</button>
      </header>

      <div class="pestanas" role="tablist" aria-label="Estado de las sesiones">
        <button
          type="button"
          role="tab"
          [attr.aria-selected]="pestanaActiva() === 'ABIERTA'"
          [class.activa]="pestanaActiva() === 'ABIERTA'"
          (click)="cambiarPestana('ABIERTA')"
        >
          Activas
        </button>
        <button
          type="button"
          role="tab"
          [attr.aria-selected]="pestanaActiva() === 'CERRADA'"
          [class.activa]="pestanaActiva() === 'CERRADA'"
          (click)="cambiarPestana('CERRADA')"
        >
          Inactivas
        </button>
      </div>

      <div class="card filtros">
        <label>
          Fecha
          <input
            type="date"
            name="fecha"
            [ngModel]="fecha()"
            (ngModelChange)="onFechaChange($event)"
          />
        </label>
        <button
          type="button"
          class="btn btn--secundario"
          (click)="limpiarFecha()"
          [disabled]="!fecha()"
        >
          Limpiar fecha
        </button>
      </div>

      @if (error(); as error) {
        <p class="mensaje-error" role="alert">{{ error }}</p>
      }

      <div aria-live="polite">
        @if (cargando()) {
          <p class="cargando">Cargando sesiones...</p>
        } @else if (sesiones().length === 0) {
          <p class="estado-vacio">
            No hay sesiones {{ pestanaActiva() === 'ABIERTA' ? 'activas' : 'inactivas' }}{{
              fecha() ? ' en esta fecha' : ''
            }}.
          </p>
        } @else {
          <div class="tabla-contenedor">
            <table class="tabla">
              <thead>
                <tr>
                  <th>Curso</th>
                  <th>Laboratorio</th>
                  <th>Fecha</th>
                  <th>Hora</th>
                  <th>Estado</th>
                  <th class="numero">Marcaron</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                @for (sesion of sesiones(); track sesion.id) {
                  <tr
                    tabindex="0"
                    role="link"
                    [attr.aria-label]="'Ver detalle de la sesión de ' + sesion.cursoNombre"
                    (click)="irDetalle(sesion.id)"
                    (keydown.enter)="irDetalle(sesion.id)"
                  >
                    <td data-label="Curso" class="col-curso">
                      {{ sesion.cursoNombre }} ({{ sesion.cursoGrupo }})
                    </td>
                    <td data-label="Laboratorio">{{ sesion.laboratorioNombre }}</td>
                    <td data-label="Fecha">{{ sesion.fecha }}</td>
                    <td data-label="Hora">{{ sesion.hora }}</td>
                    <td data-label="Estado">
                      <span [class]="claseBadge(sesion.estado)">{{ sesion.estado }}</span>
                    </td>
                    <td data-label="Marcaron" class="numero">{{ sesion.estudiantesMarcados }}</td>
                    <td data-label="Acciones" class="fila-acciones">
                      <button
                        type="button"
                        class="btn btn--secundario btn--chico"
                        (click)="irParticipantes(sesion.id, $event)"
                      >
                        Participantes
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    </section>
  `,
  styles: `
    .sesiones-lista {
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
    .pestanas {
      display: flex;
      gap: var(--espacio-2);
      border-bottom: 1px solid var(--color-borde);
    }
    .pestanas button {
      padding: var(--espacio-3) var(--espacio-4);
      border: none;
      border-bottom: 2px solid transparent;
      background: transparent;
      color: var(--color-texto-suave);
      font: inherit;
      font-weight: 700;
      font-size: var(--texto-sm);
      cursor: pointer;
    }
    .pestanas button:hover {
      color: var(--color-texto);
    }
    .pestanas button.activa {
      color: var(--color-primario);
      border-bottom-color: var(--color-primario);
    }
    .filtros {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-end;
      gap: var(--espacio-4);
    }
    label {
      display: grid;
      gap: var(--espacio-1);
      color: var(--color-texto);
      font-weight: 600;
      font-size: var(--texto-sm);
    }
    input {
      min-height: 40px;
      padding: 0 var(--espacio-3);
      border: 1px solid var(--color-borde);
      border-radius: var(--radio-sm);
      background: var(--color-superficie);
      color: var(--color-texto);
      font: inherit;
    }
    .fila-acciones {
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-end;
      gap: var(--espacio-2);
    }
    .btn--chico {
      min-height: 32px;
      padding: 0 var(--espacio-3);
      font-size: var(--texto-xs);
    }
    @media (min-width: 768px) {
      .col-curso {
        max-width: 260px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }
    @media (max-width: 480px) {
      .filtros {
        flex-direction: column;
        align-items: stretch;
      }
    }
  `,
})
export class SesionesListaComponent implements OnInit, OnDestroy {
  private readonly sesionesService = inject(SesionesService);
  private readonly router = inject(Router);

  pestanaActiva = signal<EstadoPestana>('ABIERTA');
  fecha = signal('');
  sesiones = signal<SesionResumen[]>([]);
  cargando = signal(true);
  error = signal<string | null>(null);

  private debounceTimer?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    this.cargar();
  }

  ngOnDestroy(): void {
    clearTimeout(this.debounceTimer);
  }

  cambiarPestana(estado: EstadoPestana): void {
    if (this.pestanaActiva() === estado) {
      return;
    }
    this.pestanaActiva.set(estado);
    this.cargar();
  }

  onFechaChange(valor: string): void {
    this.fecha.set(valor);
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => this.cargar(), 300);
  }

  limpiarFecha(): void {
    if (!this.fecha()) {
      return;
    }
    this.fecha.set('');
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(null);

    this.sesionesService
      .listarSesiones({ estado: this.pestanaActiva(), fecha: this.fecha() || undefined })
      .subscribe({
        next: (sesiones) => {
          this.sesiones.set([...sesiones].sort((a, b) => a.hora.localeCompare(b.hora)));
          this.cargando.set(false);
        },
        error: (error: unknown) => {
          this.error.set(this.mensajeError(error));
          this.cargando.set(false);
        },
      });
  }

  nuevaSesion(): void {
    this.router.navigate(['/panel/sesiones/nueva']);
  }

  irDetalle(id: number): void {
    this.router.navigate(['/panel/sesiones', id]);
  }

  irParticipantes(id: number, evento: Event): void {
    evento.stopPropagation();
    this.router.navigate(['/panel/sesiones', id, 'participantes']);
  }

  claseBadge(estado: SesionResumen['estado']): string {
    return `badge-estado badge-estado--${estado.toLowerCase()}`;
  }

  private mensajeError(error: unknown): string {
    if (error instanceof HttpErrorResponse && error.error?.message) {
      return error.error.message;
    }
    return 'No se pudieron cargar las sesiones.';
  }
}
