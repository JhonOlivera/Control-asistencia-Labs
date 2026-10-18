import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { SesionResumen, SesionesService } from './sesiones.service';

@Component({
  selector: 'app-sesiones-lista',
  template: `
    <section class="sesiones-lista">
      <header class="encabezado">
        <h1>Sesiones</h1>
        <button type="button" class="btn" (click)="nuevaSesion()">Nueva sesión</button>
      </header>

      @if (error(); as error) {
        <p class="mensaje-error" role="alert">{{ error }}</p>
      }

      @if (cargando()) {
        <p class="cargando">Cargando sesiones...</p>
      } @else if (sesiones().length === 0) {
        <p class="estado-vacio">No hay sesiones registradas.</p>
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
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
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
    @media (min-width: 768px) {
      .col-curso {
        max-width: 260px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }
  `,
})
export class SesionesListaComponent implements OnInit {
  private readonly sesionesService = inject(SesionesService);
  private readonly router = inject(Router);

  sesiones = signal<SesionResumen[]>([]);
  cargando = signal(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.sesionesService.listarSesiones().subscribe({
      next: (sesiones) => {
        this.sesiones.set(sesiones);
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
