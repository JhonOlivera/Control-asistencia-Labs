import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { SesionResumen, SesionesService } from './sesiones.service';

@Component({
  selector: 'app-sesiones-lista',
  imports: [RouterLink],
  template: `
    <section class="sesiones-lista">
      <header class="encabezado">
        <h1>Sesiones</h1>
        <button type="button" (click)="nuevaSesion()">Nueva sesión</button>
      </header>

      @if (error(); as error) {
        <p class="error">{{ error }}</p>
      }

      @if (cargando()) {
        <p>Cargando sesiones...</p>
      } @else if (sesiones().length === 0) {
        <p>No hay sesiones registradas.</p>
      } @else {
        <table>
          <thead>
            <tr>
              <th>Curso</th>
              <th>Laboratorio</th>
              <th>Fecha</th>
              <th>Hora</th>
              <th>Estado</th>
              <th>Marcaron</th>
            </tr>
          </thead>
          <tbody>
            @for (sesion of sesiones(); track sesion.id) {
              <tr [routerLink]="['/panel/sesiones', sesion.id]">
                <td>{{ sesion.cursoNombre }} ({{ sesion.cursoGrupo }})</td>
                <td>{{ sesion.laboratorioNombre }}</td>
                <td>{{ sesion.fecha }}</td>
                <td>{{ sesion.hora }}</td>
                <td>
                  <span class="estado" [class.cerrada]="sesion.estado === 'CERRADA'">
                    {{ sesion.estado }}
                  </span>
                </td>
                <td>{{ sesion.estudiantesMarcados }}</td>
              </tr>
            }
          </tbody>
        </table>
      }
    </section>
  `,
  styles: `
    .sesiones-lista {
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
    tbody tr {
      cursor: pointer;
    }
    tbody tr:hover {
      background: var(--color-fondo);
    }
    .estado {
      padding: 2px 10px;
      border-radius: 999px;
      background: var(--color-primario-suave);
      color: var(--color-primario);
      font-size: 12px;
      font-weight: 700;
    }
    .estado.cerrada {
      background: var(--color-fondo);
      color: var(--color-texto-suave);
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

  private mensajeError(error: unknown): string {
    if (error instanceof HttpErrorResponse && error.error?.message) {
      return error.error.message;
    }
    return 'No se pudieron cargar las sesiones.';
  }
}
