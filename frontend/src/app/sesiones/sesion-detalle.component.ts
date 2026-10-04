import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { interval, startWith, switchMap, takeWhile } from 'rxjs';
import { AsistenciaEstudiante, SesionResumen, SesionesService } from './sesiones.service';

const INTERVALO_ACTUALIZACION_MS = 10_000;

@Component({
  selector: 'app-sesion-detalle',
  template: `
    <section class="sesion-detalle">
      @if (error(); as error) {
        <p class="error">{{ error }}</p>
      }

      @if (sesion(); as sesion) {
        <header class="encabezado">
          <div>
            <h1>{{ sesion.cursoNombre }} ({{ sesion.cursoGrupo }})</h1>
            <p class="subtitulo">
              {{ sesion.laboratorioNombre }} · {{ sesion.fecha }} {{ sesion.hora }} ·
              {{ sesion.tema }}
            </p>
          </div>
          <span class="estado" [class.cerrada]="sesion.estado === 'CERRADA'">
            {{ sesion.estado }}
          </span>
        </header>

        <div class="acciones">
          <button type="button" (click)="enviarEnlaces()" [disabled]="enviando()">
            {{ enviando() ? 'Enviando...' : 'Enviar enlaces' }}
          </button>
          <button
            type="button"
            class="cerrar"
            (click)="cerrarSesion()"
            [disabled]="sesion.estado === 'CERRADA' || cerrando()"
          >
            {{ cerrando() ? 'Cerrando...' : 'Cerrar sesión de laboratorio' }}
          </button>
        </div>

        @if (mensaje(); as mensaje) {
          <p class="mensaje">{{ mensaje }}</p>
        }

        <div class="contadores">
          <div class="contador">
            <span class="numero">{{ conteos().presentes }}</span>
            <span class="etiqueta">Presentes</span>
          </div>
          <div class="contador">
            <span class="numero">{{ conteos().tarde }}</span>
            <span class="etiqueta">Tarde</span>
          </div>
          <div class="contador">
            <span class="numero">{{ conteos().pendientes }}</span>
            <span class="etiqueta">Pendientes</span>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Estudiante</th>
              <th>Código</th>
              <th>Correo</th>
              <th>Estado</th>
              <th>Hora de registro</th>
            </tr>
          </thead>
          <tbody>
            @for (asistencia of asistencias(); track asistencia.estudianteId) {
              <tr>
                <td>{{ asistencia.nombre }}</td>
                <td>{{ asistencia.codigo }}</td>
                <td>{{ asistencia.correo }}</td>
                <td>{{ asistencia.estado }}</td>
                <td>{{ asistencia.horaRegistro ?? '—' }}</td>
              </tr>
            }
          </tbody>
        </table>
      } @else if (cargando()) {
        <p>Cargando sesión...</p>
      }
    </section>
  `,
  styles: `
    .sesion-detalle {
      display: grid;
      gap: 16px;
    }
    .error {
      padding: 10px 14px;
      border-radius: 6px;
      background: #fde8e8;
      color: #9b2c2c;
    }
    .mensaje {
      padding: 10px 14px;
      border-radius: 6px;
      background: var(--color-primario-suave);
      color: var(--color-primario);
    }
    .encabezado {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
    }
    h1 {
      margin: 0;
      font-size: 22px;
      color: var(--color-texto);
    }
    .subtitulo {
      margin: 4px 0 0;
      color: var(--color-texto-suave);
    }
    .estado {
      padding: 4px 12px;
      border-radius: 999px;
      background: var(--color-primario-suave);
      color: var(--color-primario);
      font-size: 12px;
      font-weight: 700;
      white-space: nowrap;
    }
    .estado.cerrada {
      background: var(--color-fondo);
      color: var(--color-texto-suave);
    }
    .acciones {
      display: flex;
      gap: 10px;
    }
    .acciones button {
      min-height: 40px;
      padding: 0 16px;
      border-radius: 4px;
      font: inherit;
      font-weight: 700;
      cursor: pointer;
      border: 1px solid var(--color-primario);
      background: var(--color-primario);
      color: #fff;
    }
    .acciones button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .acciones button.cerrar {
      border-color: var(--color-borde);
      background: var(--color-superficie);
      color: var(--color-texto);
    }
    .contadores {
      display: flex;
      gap: 12px;
    }
    .contador {
      display: grid;
      gap: 2px;
      padding: 12px 20px;
      border: 1px solid var(--color-borde);
      border-radius: 8px;
      background: var(--color-superficie);
      min-width: 100px;
    }
    .numero {
      font-size: 26px;
      font-weight: 700;
      color: var(--color-texto);
    }
    .etiqueta {
      font-size: 12px;
      color: var(--color-texto-suave);
      text-transform: uppercase;
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
  `,
})
export class SesionDetalleComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly sesionesService = inject(SesionesService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly sesionId = Number(this.route.snapshot.paramMap.get('id'));

  sesion = signal<SesionResumen | null>(null);
  asistencias = signal<AsistenciaEstudiante[]>([]);
  cargando = signal(true);
  error = signal<string | null>(null);
  mensaje = signal<string | null>(null);
  enviando = signal(false);
  cerrando = signal(false);

  conteos = computed(() => {
    const lista = this.asistencias();
    return {
      presentes: lista.filter((a) => a.estado === 'PRESENTE').length,
      tarde: lista.filter((a) => a.estado === 'TARDE').length,
      pendientes: lista.filter((a) => a.estado === 'PENDIENTE').length,
    };
  });

  ngOnInit(): void {
    if (!this.sesionId) {
      this.error.set('Sesión no válida.');
      this.cargando.set(false);
      return;
    }

    this.cargarSesion();

    // GET /api/sesiones no tiene filtro por id; se busca en la lista completa.
    let destruido = false;
    this.destroyRef.onDestroy(() => (destruido = true));

    interval(INTERVALO_ACTUALIZACION_MS)
      .pipe(
        startWith(0),
        takeWhile(() => !destruido),
        switchMap(() => this.sesionesService.listarAsistencias(this.sesionId)),
      )
      .subscribe({
        next: (asistencias) => {
          this.asistencias.set(asistencias);
          this.cargando.set(false);
        },
        error: (error: unknown) => {
          this.error.set(this.mensajeError(error));
          this.cargando.set(false);
        },
      });
  }

  enviarEnlaces(): void {
    this.enviando.set(true);
    this.mensaje.set(null);
    this.error.set(null);
    this.sesionesService.enviarEnlaces(this.sesionId).subscribe({
      next: () => {
        this.enviando.set(false);
        this.mensaje.set('Los enlaces se enviaron a los estudiantes del curso.');
      },
      error: (error: unknown) => {
        this.enviando.set(false);
        this.error.set(this.mensajeError(error));
      },
    });
  }

  cerrarSesion(): void {
    this.cerrando.set(true);
    this.mensaje.set(null);
    this.error.set(null);
    this.sesionesService.cerrarSesion(this.sesionId).subscribe({
      next: () => {
        this.cerrando.set(false);
        this.mensaje.set('La sesión se cerró correctamente.');
        this.cargarSesion();
      },
      error: (error: unknown) => {
        this.cerrando.set(false);
        this.error.set(this.mensajeError(error));
      },
    });
  }

  private cargarSesion(): void {
    this.sesionesService.listarSesiones().subscribe({
      next: (sesiones) => {
        const encontrada = sesiones.find((s) => s.id === this.sesionId) ?? null;
        this.sesion.set(encontrada);
        if (!encontrada) {
          this.error.set('Sesión no encontrada.');
        }
      },
      error: (error: unknown) => this.error.set(this.mensajeError(error)),
    });
  }

  private mensajeError(error: unknown): string {
    if (error instanceof HttpErrorResponse && error.error?.message) {
      return error.error.message;
    }
    return 'Ocurrió un error al comunicarse con el servidor.';
  }
}
