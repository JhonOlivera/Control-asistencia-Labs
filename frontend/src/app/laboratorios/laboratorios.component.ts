import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Laboratorio, LaboratorioRequest, LaboratorioService } from './laboratorio.service';

@Component({
  selector: 'app-laboratorios',
  imports: [FormsModule],
  template: `
    <section class="laboratorios">
      <header class="encabezado">
        <h1>Laboratorios</h1>
        @if (!mostrarFormulario()) {
          <button type="button" class="btn" (click)="nuevo()">Nuevo laboratorio</button>
        }
      </header>

      @if (error(); as error) {
        <p class="mensaje-error" role="alert">{{ error }}</p>
      }

      @if (mostrarFormulario()) {
        <form class="card formulario" (ngSubmit)="guardar()">
          <h2>{{ edicionId() === null ? 'Nuevo laboratorio' : 'Editar laboratorio' }}</h2>

          @if (errorFormulario(); as errorFormulario) {
            <p class="mensaje-error" role="alert">{{ errorFormulario }}</p>
          }

          <label>
            Nombre
            <input type="text" name="nombre" [(ngModel)]="nombre" required />
          </label>

          <label>
            Ubicación
            <input type="text" name="ubicacion" [(ngModel)]="ubicacion" required />
          </label>

          <label>
            Capacidad
            <input type="number" name="capacidad" [(ngModel)]="capacidad" min="1" required />
          </label>

          <label>
            Horario disponible
            <input
              type="text"
              name="horarioDisponible"
              [(ngModel)]="horarioDisponible"
              placeholder="LUN-VIE 07:00-18:00"
              required
            />
            <small>Formato: tres letras del día inicial y final en mayúsculas, guion, y el rango de horas en 24h. Ejemplo: LUN-VIE 07:00-18:00.</small>
          </label>

          <div class="acciones">
            <button type="button" class="btn btn--secundario" (click)="cancelar()">Cancelar</button>
            <button type="submit" class="btn" [disabled]="guardando()">
              {{ guardando() ? 'Guardando...' : 'Guardar' }}
            </button>
          </div>
        </form>
      }

      @if (cargando()) {
        <p class="cargando">Cargando laboratorios...</p>
      } @else if (laboratorios().length === 0) {
        <p class="estado-vacio">No hay laboratorios registrados.</p>
      } @else {
        <div class="tabla-contenedor">
          <table class="tabla">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Ubicación</th>
                <th class="numero">Capacidad</th>
                <th>Horario</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (laboratorio of laboratorios(); track laboratorio.id) {
                <tr>
                  <td data-label="Nombre">{{ laboratorio.nombre }}</td>
                  <td data-label="Ubicación">{{ laboratorio.ubicacion }}</td>
                  <td data-label="Capacidad" class="numero">{{ laboratorio.capacidad }}</td>
                  <td data-label="Horario">{{ laboratorio.horarioDisponible }}</td>
                  <td data-label="Estado">
                    <span [class]="claseBadge(laboratorio.estado)">{{ laboratorio.estado }}</span>
                  </td>
                  <td data-label="Acciones" class="fila-acciones">
                    <button type="button" class="btn btn--secundario btn--chico" (click)="editar(laboratorio)">
                      Editar
                    </button>
                    @if (laboratorio.estado === 'ACTIVO') {
                      <button
                        type="button"
                        class="btn btn--peligro btn--chico"
                        (click)="ponerEnMantenimiento(laboratorio)"
                      >
                        Poner en mantenimiento
                      </button>
                    } @else {
                      <button type="button" class="btn btn--secundario btn--chico" (click)="activar(laboratorio)">
                        Activar
                      </button>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </section>
  `,
  styles: `
    .laboratorios {
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
    h2 {
      margin: 0;
      font-size: var(--texto-lg);
      color: var(--color-texto);
    }
    .formulario {
      display: grid;
      gap: var(--espacio-4);
      max-width: 480px;
    }
    label {
      display: grid;
      gap: var(--espacio-1);
      color: var(--color-texto);
      font-weight: 600;
      font-size: var(--texto-sm);
    }
    label small {
      font-weight: 400;
      color: var(--color-texto-suave);
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
    .acciones {
      display: flex;
      justify-content: flex-end;
      gap: var(--espacio-3);
      margin-top: var(--espacio-2);
    }
    .fila-acciones {
      display: flex;
      gap: var(--espacio-2);
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
export class LaboratoriosComponent implements OnInit {
  private readonly laboratorioService = inject(LaboratorioService);

  laboratorios = signal<Laboratorio[]>([]);
  cargando = signal(true);
  error = signal<string | null>(null);

  mostrarFormulario = signal(false);
  edicionId = signal<number | null>(null);
  errorFormulario = signal<string | null>(null);
  guardando = signal(false);

  nombre = '';
  ubicacion = '';
  capacidad: number | null = null;
  horarioDisponible = '';

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.laboratorioService.listarLaboratorios().subscribe({
      next: (laboratorios) => {
        this.laboratorios.set(laboratorios);
        this.cargando.set(false);
      },
      error: (error: unknown) => {
        this.error.set(this.mensajeError(error, 'No se pudieron cargar los laboratorios.'));
        this.cargando.set(false);
      },
    });
  }

  nuevo(): void {
    this.edicionId.set(null);
    this.nombre = '';
    this.ubicacion = '';
    this.capacidad = null;
    this.horarioDisponible = '';
    this.errorFormulario.set(null);
    this.mostrarFormulario.set(true);
  }

  editar(laboratorio: Laboratorio): void {
    this.edicionId.set(laboratorio.id);
    this.nombre = laboratorio.nombre;
    this.ubicacion = laboratorio.ubicacion;
    this.capacidad = laboratorio.capacidad;
    this.horarioDisponible = laboratorio.horarioDisponible;
    this.errorFormulario.set(null);
    this.mostrarFormulario.set(true);
  }

  cancelar(): void {
    this.mostrarFormulario.set(false);
  }

  guardar(): void {
    if (!this.nombre.trim() || !this.ubicacion.trim() || !this.capacidad || !this.horarioDisponible.trim()) {
      this.errorFormulario.set('Completa todos los campos.');
      return;
    }

    const request: LaboratorioRequest = {
      nombre: this.nombre.trim(),
      ubicacion: this.ubicacion.trim(),
      capacidad: this.capacidad,
      horarioDisponible: this.horarioDisponible.trim(),
    };

    this.errorFormulario.set(null);
    this.guardando.set(true);

    const edicionId = this.edicionId();
    const peticion =
      edicionId === null
        ? this.laboratorioService.crearLaboratorio(request)
        : this.laboratorioService.actualizarLaboratorio(edicionId, request);

    peticion.subscribe({
      next: () => {
        this.guardando.set(false);
        this.mostrarFormulario.set(false);
        this.cargar();
      },
      error: (error: unknown) => {
        this.guardando.set(false);
        this.errorFormulario.set(this.mensajeError(error, 'No se pudo guardar el laboratorio.'));
      },
    });
  }

  ponerEnMantenimiento(laboratorio: Laboratorio): void {
    this.error.set(null);
    this.laboratorioService.ponerEnMantenimiento(laboratorio.id).subscribe({
      next: () => this.cargar(),
      error: (error: unknown) =>
        this.error.set(this.mensajeError(error, 'No se pudo poner el laboratorio en mantenimiento.')),
    });
  }

  activar(laboratorio: Laboratorio): void {
    this.error.set(null);
    this.laboratorioService.activarLaboratorio(laboratorio.id).subscribe({
      next: () => this.cargar(),
      error: (error: unknown) =>
        this.error.set(this.mensajeError(error, 'No se pudo activar el laboratorio.')),
    });
  }

  claseBadge(estado: Laboratorio['estado']): string {
    return estado === 'ACTIVO' ? 'badge-estado badge-estado--abierta' : 'badge-estado badge-estado--cerrada';
  }

  private mensajeError(error: unknown, mensajePorDefecto: string): string {
    if (error instanceof HttpErrorResponse && error.error?.message) {
      return error.error.message;
    }
    return mensajePorDefecto;
  }
}
