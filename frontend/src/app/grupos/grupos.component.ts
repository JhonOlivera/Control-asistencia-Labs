import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Curso, CursoRequest, CursoService } from '../sesiones/curso.service';

@Component({
  selector: 'app-grupos',
  imports: [FormsModule],
  template: `
    <section class="grupos">
      <header class="encabezado">
        <h1>Grupos</h1>
        @if (!mostrarFormulario()) {
          <button type="button" class="btn" (click)="nuevo()">Nuevo grupo</button>
        }
      </header>

      @if (error(); as error) {
        <p class="mensaje-error" role="alert">{{ error }}</p>
      }

      @if (mensajeExito(); as mensajeExito) {
        <p class="mensaje-exito" role="status">{{ mensajeExito }}</p>
      }

      @if (mostrarFormulario()) {
        <form class="card formulario" (ngSubmit)="guardar()">
          <h2>{{ edicionId() === null ? 'Nuevo grupo' : 'Editar grupo' }}</h2>

          @if (errorFormulario(); as errorFormulario) {
            <p class="mensaje-error" role="alert">{{ errorFormulario }}</p>
          }

          <label>
            Nombre
            <input type="text" name="nombre" [(ngModel)]="nombre" required />
          </label>

          <label>
            Grupo
            <input type="text" name="grupo" [(ngModel)]="grupo" required />
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
        <p class="cargando">Cargando grupos...</p>
      } @else if (cursos().length === 0) {
        <p class="estado-vacio">No hay grupos registrados.</p>
      } @else {
        <div class="tabla-contenedor">
          <table class="tabla">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Grupo</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (curso of cursos(); track curso.id) {
                <tr>
                  <td data-label="Nombre">{{ curso.nombre }}</td>
                  <td data-label="Grupo">{{ curso.grupo }}</td>
                  <td data-label="Acciones" class="fila-acciones">
                    <button type="button" class="btn btn--secundario btn--chico" (click)="editar(curso)">
                      Editar
                    </button>
                    <button type="button" class="btn btn--peligro btn--chico" (click)="eliminar(curso)">
                      Eliminar
                    </button>
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
    .grupos {
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
export class GruposComponent implements OnInit {
  private readonly cursoService = inject(CursoService);

  cursos = signal<Curso[]>([]);
  cargando = signal(true);
  error = signal<string | null>(null);
  mensajeExito = signal<string | null>(null);

  mostrarFormulario = signal(false);
  edicionId = signal<number | null>(null);
  errorFormulario = signal<string | null>(null);
  guardando = signal(false);

  nombre = '';
  grupo = '';

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.cursoService.listarCursos().subscribe({
      next: (cursos) => {
        this.cursos.set(cursos);
        this.cargando.set(false);
      },
      error: (error: unknown) => {
        this.error.set(this.mensajeError(error, 'No se pudieron cargar los grupos.'));
        this.cargando.set(false);
      },
    });
  }

  nuevo(): void {
    this.edicionId.set(null);
    this.nombre = '';
    this.grupo = '';
    this.errorFormulario.set(null);
    this.mensajeExito.set(null);
    this.mostrarFormulario.set(true);
  }

  editar(curso: Curso): void {
    this.edicionId.set(curso.id);
    this.nombre = curso.nombre;
    this.grupo = curso.grupo;
    this.errorFormulario.set(null);
    this.mensajeExito.set(null);
    this.mostrarFormulario.set(true);
  }

  cancelar(): void {
    this.mostrarFormulario.set(false);
  }

  guardar(): void {
    if (!this.nombre.trim() || !this.grupo.trim()) {
      this.errorFormulario.set('Completa todos los campos.');
      return;
    }

    const request: CursoRequest = {
      nombre: this.nombre.trim(),
      grupo: this.grupo.trim(),
    };

    this.errorFormulario.set(null);
    this.guardando.set(true);

    const edicionId = this.edicionId();
    const peticion =
      edicionId === null
        ? this.cursoService.crearCurso(request)
        : this.cursoService.actualizarCurso(edicionId, request);

    peticion.subscribe({
      next: () => {
        this.guardando.set(false);
        this.mostrarFormulario.set(false);
        this.mensajeExito.set(edicionId === null ? 'Grupo creado correctamente.' : 'Grupo actualizado correctamente.');
        this.cargar();
      },
      error: (error: unknown) => {
        this.guardando.set(false);
        this.errorFormulario.set(this.mensajeError(error, 'No se pudo guardar el grupo.'));
      },
    });
  }

  eliminar(curso: Curso): void {
    if (!confirm(`Se eliminará el grupo "${curso.nombre} (${curso.grupo})".`)) {
      return;
    }

    this.error.set(null);
    this.mensajeExito.set(null);

    this.cursoService.eliminarCurso(curso.id).subscribe({
      next: () => {
        this.mensajeExito.set('Grupo eliminado correctamente.');
        this.cargar();
      },
      error: (error: unknown) =>
        this.error.set(this.mensajeError(error, 'No se pudo eliminar el grupo.')),
    });
  }

  private mensajeError(error: unknown, mensajePorDefecto: string): string {
    if (error instanceof HttpErrorResponse && error.error?.message) {
      return error.error.message;
    }
    return mensajePorDefecto;
  }
}
