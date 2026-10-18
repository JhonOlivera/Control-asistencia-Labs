import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Estudiante, EstudianteRequest, EstudianteService } from './estudiante.service';

type FiltroEstado = 'TODOS' | 'ACTIVOS' | 'INACTIVOS';

const CORREO_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

@Component({
  selector: 'app-estudiantes',
  imports: [FormsModule],
  template: `
    <section class="estudiantes">
      <header class="encabezado">
        <h1>Estudiantes</h1>
        @if (!mostrarFormulario()) {
          <button type="button" class="btn" (click)="nuevo()">Nuevo estudiante</button>
        }
      </header>

      @if (error(); as error) {
        <p class="mensaje-error" role="alert">{{ error }}</p>
      }

      @if (!mostrarFormulario()) {
        <div class="card filtros">
          <label>
            Buscar
            <input
              type="text"
              name="texto"
              placeholder="Nombre o código"
              [(ngModel)]="texto"
              (ngModelChange)="onTextoChange()"
            />
          </label>

          <label>
            Estado
            <select name="filtroEstado" [(ngModel)]="filtroEstado" (ngModelChange)="cargar()">
              <option value="TODOS">Todos</option>
              <option value="ACTIVOS">Activos</option>
              <option value="INACTIVOS">Inactivos</option>
            </select>
          </label>
        </div>
      }

      @if (mostrarFormulario()) {
        <form class="card formulario" (ngSubmit)="guardar()">
          <h2>{{ edicionId() === null ? 'Nuevo estudiante' : 'Editar estudiante' }}</h2>

          @if (errorFormulario(); as errorFormulario) {
            <p class="mensaje-error" role="alert">{{ errorFormulario }}</p>
          }

          <label>
            Código
            <input type="text" name="codigo" [(ngModel)]="codigo" required />
          </label>

          <label>
            Nombre
            <input type="text" name="nombre" [(ngModel)]="nombre" required />
          </label>

          <label>
            Correo
            <input type="email" name="correo" [(ngModel)]="correo" required />
          </label>

          <div class="acciones">
            <button type="button" class="btn btn--secundario" (click)="cancelar()">Cancelar</button>
            <button type="submit" class="btn" [disabled]="guardando()">
              {{ guardando() ? 'Guardando...' : 'Guardar' }}
            </button>
          </div>
        </form>
      }

      @if (!mostrarFormulario()) {
        @if (cargando()) {
          <p class="cargando">Cargando estudiantes...</p>
        } @else if (estudiantes().length === 0) {
          <p class="estado-vacio">No hay estudiantes que coincidan con la búsqueda.</p>
        } @else {
          <div class="tabla-contenedor">
            <table class="tabla">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Nombre</th>
                  <th>Correo</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                @for (estudiante of estudiantes(); track estudiante.id) {
                  <tr>
                    <td data-label="Código">{{ estudiante.codigo }}</td>
                    <td data-label="Nombre">{{ estudiante.nombre }}</td>
                    <td data-label="Correo">{{ estudiante.correo }}</td>
                    <td data-label="Estado">
                      <span [class]="claseBadge(estudiante.activo)">
                        {{ estudiante.activo ? 'ACTIVO' : 'INACTIVO' }}
                      </span>
                    </td>
                    <td data-label="Acciones" class="fila-acciones">
                      <button type="button" class="btn btn--secundario btn--chico" (click)="editar(estudiante)">
                        Editar
                      </button>
                      @if (estudiante.activo) {
                        <button
                          type="button"
                          class="btn btn--secundario btn--chico"
                          (click)="inactivar(estudiante)"
                        >
                          Inactivar
                        </button>
                      } @else {
                        <button type="button" class="btn btn--secundario btn--chico" (click)="activar(estudiante)">
                          Activar
                        </button>
                      }
                      <button type="button" class="btn btn--peligro btn--chico" (click)="eliminar(estudiante)">
                        Eliminar
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      }
    </section>
  `,
  styles: `
    .estudiantes {
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
    .filtros {
      display: flex;
      flex-wrap: wrap;
      gap: var(--espacio-4);
    }
    .filtros label:first-child {
      flex: 1 1 240px;
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
    input,
    select {
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
      flex-wrap: wrap;
      justify-content: flex-end;
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
export class EstudiantesComponent implements OnInit, OnDestroy {
  private readonly estudianteService = inject(EstudianteService);

  estudiantes = signal<Estudiante[]>([]);
  cargando = signal(true);
  error = signal<string | null>(null);

  mostrarFormulario = signal(false);
  edicionId = signal<number | null>(null);
  errorFormulario = signal<string | null>(null);
  guardando = signal(false);

  texto = '';
  filtroEstado: FiltroEstado = 'TODOS';

  codigo = '';
  nombre = '';
  correo = '';

  private debounceTimer?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    this.cargar();
  }

  ngOnDestroy(): void {
    clearTimeout(this.debounceTimer);
  }

  onTextoChange(): void {
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => this.cargar(), 300);
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(null);

    const activo =
      this.filtroEstado === 'ACTIVOS' ? true : this.filtroEstado === 'INACTIVOS' ? false : undefined;

    this.estudianteService.listarEstudiantes({ texto: this.texto.trim(), activo }).subscribe({
      next: (estudiantes) => {
        this.estudiantes.set(estudiantes);
        this.cargando.set(false);
      },
      error: (error: unknown) => {
        this.error.set(this.mensajeError(error, 'No se pudieron cargar los estudiantes.'));
        this.cargando.set(false);
      },
    });
  }

  nuevo(): void {
    this.edicionId.set(null);
    this.codigo = '';
    this.nombre = '';
    this.correo = '';
    this.errorFormulario.set(null);
    this.mostrarFormulario.set(true);
  }

  editar(estudiante: Estudiante): void {
    this.edicionId.set(estudiante.id);
    this.codigo = estudiante.codigo;
    this.nombre = estudiante.nombre;
    this.correo = estudiante.correo;
    this.errorFormulario.set(null);
    this.mostrarFormulario.set(true);
  }

  cancelar(): void {
    this.mostrarFormulario.set(false);
  }

  guardar(): void {
    if (!this.codigo.trim() || !this.nombre.trim() || !this.correo.trim()) {
      this.errorFormulario.set('Completa todos los campos.');
      return;
    }

    if (!CORREO_REGEX.test(this.correo.trim())) {
      this.errorFormulario.set('El correo debe tener un formato válido.');
      return;
    }

    const request: EstudianteRequest = {
      codigo: this.codigo.trim(),
      nombre: this.nombre.trim(),
      correo: this.correo.trim(),
    };

    this.errorFormulario.set(null);
    this.guardando.set(true);

    const edicionId = this.edicionId();
    const peticion =
      edicionId === null
        ? this.estudianteService.crearEstudiante(request)
        : this.estudianteService.actualizarEstudiante(edicionId, request);

    peticion.subscribe({
      next: () => {
        this.guardando.set(false);
        this.mostrarFormulario.set(false);
        this.cargar();
      },
      error: (error: unknown) => {
        this.guardando.set(false);
        this.errorFormulario.set(this.mensajeError(error, 'No se pudo guardar el estudiante.'));
      },
    });
  }

  inactivar(estudiante: Estudiante): void {
    this.error.set(null);
    this.estudianteService.inactivarEstudiante(estudiante.id).subscribe({
      next: () => this.cargar(),
      error: (error: unknown) =>
        this.error.set(this.mensajeError(error, 'No se pudo inactivar el estudiante.')),
    });
  }

  activar(estudiante: Estudiante): void {
    this.error.set(null);
    this.estudianteService.activarEstudiante(estudiante.id).subscribe({
      next: () => this.cargar(),
      error: (error: unknown) =>
        this.error.set(this.mensajeError(error, 'No se pudo activar el estudiante.')),
    });
  }

  eliminar(estudiante: Estudiante): void {
    if (!confirm(`¿Eliminar al estudiante ${estudiante.nombre}? Esta acción no se puede deshacer.`)) {
      return;
    }

    this.error.set(null);
    this.estudianteService.eliminarEstudiante(estudiante.id).subscribe({
      next: () => this.cargar(),
      error: (error: unknown) =>
        this.error.set(this.mensajeError(error, 'No se pudo eliminar el estudiante.')),
    });
  }

  claseBadge(activo: boolean): string {
    return activo ? 'badge-estado badge-estado--abierta' : 'badge-estado badge-estado--cerrada';
  }

  private mensajeError(error: unknown, mensajePorDefecto: string): string {
    if (error instanceof HttpErrorResponse && error.error?.message) {
      return error.error.message;
    }
    return mensajePorDefecto;
  }
}
