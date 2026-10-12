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
          <button type="button" (click)="nuevo()">Nuevo laboratorio</button>
        }
      </header>

      @if (error(); as error) {
        <p class="error">{{ error }}</p>
      }

      @if (mostrarFormulario()) {
        <form class="formulario" (ngSubmit)="guardar()">
          <h2>{{ edicionId() === null ? 'Nuevo laboratorio' : 'Editar laboratorio' }}</h2>

          @if (errorFormulario(); as errorFormulario) {
            <p class="error">{{ errorFormulario }}</p>
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
            <button type="button" (click)="cancelar()">Cancelar</button>
            <button type="submit" [disabled]="guardando()">
              {{ guardando() ? 'Guardando...' : 'Guardar' }}
            </button>
          </div>
        </form>
      }

      @if (cargando()) {
        <p>Cargando laboratorios...</p>
      } @else if (laboratorios().length === 0) {
        <p>No hay laboratorios registrados.</p>
      } @else {
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Ubicación</th>
              <th>Capacidad</th>
              <th>Horario</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (laboratorio of laboratorios(); track laboratorio.id) {
              <tr>
                <td>{{ laboratorio.nombre }}</td>
                <td>{{ laboratorio.ubicacion }}</td>
                <td>{{ laboratorio.capacidad }}</td>
                <td>{{ laboratorio.horarioDisponible }}</td>
                <td>
                  <span class="estado" [class.mantenimiento]="laboratorio.estado === 'EN_MANTENIMIENTO'">
                    {{ laboratorio.estado }}
                  </span>
                </td>
                <td class="fila-acciones">
                  <button type="button" (click)="editar(laboratorio)">Editar</button>
                  @if (laboratorio.estado === 'ACTIVO') {
                    <button type="button" (click)="ponerEnMantenimiento(laboratorio)">
                      Poner en mantenimiento
                    </button>
                  } @else {
                    <button type="button" (click)="activar(laboratorio)">Activar</button>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      }
    </section>
  `,
  styles: `
    .laboratorios {
      display: grid;
      gap: 16px;
    }
    .encabezado {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    h1 {
      margin: 0;
      font-size: 24px;
      color: var(--color-texto);
    }
    h2 {
      margin: 0;
      font-size: 18px;
      color: var(--color-texto);
    }
    .encabezado button {
      min-height: 40px;
      padding: 0 16px;
      border: 1px solid var(--color-primario);
      border-radius: 4px;
      background: var(--color-primario);
      color: #fff;
      font: inherit;
      font-weight: 700;
      cursor: pointer;
    }
    .encabezado button:hover {
      opacity: 0.9;
    }
    .error {
      padding: 10px 14px;
      border-radius: 6px;
      background: #fde8e8;
      color: #9b2c2c;
    }
    .formulario {
      display: grid;
      gap: 14px;
      max-width: 480px;
      padding: 20px;
      border: 1px solid var(--color-borde);
      border-radius: 8px;
      background: var(--color-superficie);
    }
    label {
      display: grid;
      gap: 6px;
      color: var(--color-texto);
      font-weight: 600;
      font-size: 14px;
    }
    label small {
      font-weight: 400;
      color: var(--color-texto-suave);
    }
    input {
      min-height: 40px;
      padding: 0 10px;
      border: 1px solid var(--color-borde);
      border-radius: 4px;
      font: inherit;
    }
    .acciones {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 8px;
    }
    .acciones button {
      min-height: 40px;
      padding: 0 16px;
      border-radius: 4px;
      font: inherit;
      font-weight: 700;
      cursor: pointer;
    }
    .acciones button[type='submit'] {
      border: 1px solid var(--color-primario);
      background: var(--color-primario);
      color: #fff;
    }
    .acciones button[type='submit']:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .acciones button[type='button'] {
      border: 1px solid var(--color-borde);
      background: var(--color-superficie);
      color: var(--color-texto);
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
    .estado {
      padding: 2px 10px;
      border-radius: 999px;
      background: var(--color-primario-suave);
      color: var(--color-primario);
      font-size: 12px;
      font-weight: 700;
    }
    .estado.mantenimiento {
      background: var(--color-fondo);
      color: var(--color-texto-suave);
    }
    .fila-acciones {
      display: flex;
      gap: 8px;
    }
    .fila-acciones button {
      min-height: 32px;
      padding: 0 10px;
      border: 1px solid var(--color-borde);
      border-radius: 4px;
      background: var(--color-superficie);
      color: var(--color-texto);
      font: inherit;
      font-size: 13px;
      cursor: pointer;
    }
    .fila-acciones button:hover {
      background: var(--color-fondo);
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

  private mensajeError(error: unknown, mensajePorDefecto: string): string {
    if (error instanceof HttpErrorResponse && error.error?.message) {
      return error.error.message;
    }
    return mensajePorDefecto;
  }
}
