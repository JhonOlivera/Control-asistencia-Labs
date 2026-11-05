import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, forkJoin, map, of } from 'rxjs';
import { ConfirmacionDialogComponent } from './confirmacion-dialog.component';
import { SesionResumen, SesionesService } from './sesiones.service';

type EstadoPestana = 'ABIERTA' | 'CERRADA';

@Component({
  selector: 'app-sesiones-lista',
  imports: [FormsModule, ConfirmacionDialogComponent],
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
      @if (mensaje(); as mensaje) {
        <p class="mensaje-exito">{{ mensaje }}</p>
      }

      @if (pestanaActiva() === 'CERRADA' && seleccionadas().size > 0) {
        <div class="barra-seleccion">
          <span>{{ seleccionadas().size }} sesión(es) seleccionada(s)</span>
          <button type="button" class="btn btn--peligro" (click)="abrirEliminarLote()">
            Eliminar seleccionadas ({{ seleccionadas().size }})
          </button>
        </div>
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
                  @if (pestanaActiva() === 'CERRADA') {
                    <th class="col-check"></th>
                  }
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
                    @if (pestanaActiva() === 'CERRADA') {
                      <td data-label="Seleccionar" class="col-check" (click)="$event.stopPropagation()">
                        <input
                          type="checkbox"
                          [attr.aria-label]="'Seleccionar sesión de ' + sesion.cursoNombre"
                          [checked]="estaSeleccionada(sesion.id)"
                          (change)="toggleSeleccion(sesion.id)"
                        />
                      </td>
                    }
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
                      @if (sesion.estado === 'CERRADA') {
                        <button
                          type="button"
                          class="btn btn--peligro btn--chico"
                          (click)="abrirEliminar(sesion, $event)"
                        >
                          Eliminar
                        </button>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>

      @if (sesionAEliminar(); as sesion) {
        <app-confirmacion-dialog
          titulo="Eliminar sesión"
          [detalles]="detalleEliminacion()"
          advertencia="Esta acción no se puede deshacer."
          textoConfirmar="Eliminar"
          [confirmando]="eliminando()"
          (cancelar)="cancelarEliminar()"
          (confirmar)="confirmarEliminar()"
        />
      }

      @if (mostrarConfirmacionLote()) {
        <app-confirmacion-dialog
          titulo="Eliminar sesiones seleccionadas"
          [detalles]="[
            'Se eliminarán ' + seleccionadas().size + ' sesión(es) y sus asistencias registradas.',
          ]"
          advertencia="Esta acción no se puede deshacer."
          textoConfirmar="Eliminar"
          [confirmando]="eliminandoLote()"
          (cancelar)="cancelarEliminarLote()"
          (confirmar)="confirmarEliminarLote()"
        />
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
    .col-check {
      width: 36px;
    }
    .col-check input {
      width: 18px;
      height: 18px;
      accent-color: var(--color-primario);
    }
    .barra-seleccion {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: var(--espacio-3);
      padding: var(--espacio-3) var(--espacio-4);
      border: 1px solid var(--color-borde);
      border-radius: var(--radio-md);
      background: var(--color-superficie);
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
    @media (max-width: 480px) {
      .filtros {
        flex-direction: column;
        align-items: stretch;
      }
      .barra-seleccion {
        flex-direction: column;
        align-items: stretch;
      }
      .barra-seleccion .btn {
        width: 100%;
      }
    }
  `,
})
export class SesionesListaComponent implements OnInit, OnDestroy {
  private readonly sesionesService = inject(SesionesService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  pestanaActiva = signal<EstadoPestana>('ABIERTA');
  fecha = signal('');
  sesiones = signal<SesionResumen[]>([]);
  cargando = signal(true);
  error = signal<string | null>(null);
  mensaje = signal<string | null>(null);

  seleccionadas = signal<Set<number>>(new Set());

  sesionAEliminar = signal<SesionResumen | null>(null);
  detalleEliminacion = signal<string[]>([]);
  eliminando = signal(false);

  mostrarConfirmacionLote = signal(false);
  eliminandoLote = signal(false);

  private debounceTimer?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    const estadoParam = this.route.snapshot.queryParamMap.get('estado');
    if (estadoParam === 'ABIERTA' || estadoParam === 'CERRADA') {
      this.pestanaActiva.set(estadoParam);
    }
    const fechaParam = this.route.snapshot.queryParamMap.get('fecha');
    if (fechaParam) {
      this.fecha.set(fechaParam);
    }
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
    this.seleccionadas.set(new Set());
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
    this.seleccionadas.set(new Set());

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
    this.router.navigate(['/panel/sesiones', id], {
      queryParams: { estado: this.pestanaActiva(), fecha: this.fecha() || null },
    });
  }

  irParticipantes(id: number, evento: Event): void {
    evento.stopPropagation();
    this.router.navigate(['/panel/sesiones', id, 'participantes']);
  }

  claseBadge(estado: SesionResumen['estado']): string {
    return `badge-estado badge-estado--${estado.toLowerCase()}`;
  }

  estaSeleccionada(id: number): boolean {
    return this.seleccionadas().has(id);
  }

  toggleSeleccion(id: number): void {
    const copia = new Set(this.seleccionadas());
    if (copia.has(id)) {
      copia.delete(id);
    } else {
      copia.add(id);
    }
    this.seleccionadas.set(copia);
  }

  abrirEliminar(sesion: SesionResumen, evento: Event): void {
    evento.stopPropagation();
    this.mensaje.set(null);
    this.error.set(null);
    this.sesionAEliminar.set(sesion);
    this.detalleEliminacion.set([
      `Curso: ${sesion.cursoNombre} (${sesion.cursoGrupo})`,
      `Laboratorio: ${sesion.laboratorioNombre}`,
      `Fecha: ${sesion.fecha} ${sesion.hora}`,
      `Asistencias registradas (presentes y tarde): ${sesion.estudiantesMarcados}`,
    ]);

    this.sesionesService.obtenerParticipantes(sesion.id).subscribe({
      next: (datos) => {
        if (this.sesionAEliminar()?.id !== sesion.id) {
          return;
        }
        this.detalleEliminacion.set([
          `Curso: ${sesion.cursoNombre} (${sesion.cursoGrupo})`,
          `Laboratorio: ${sesion.laboratorioNombre}`,
          `Fecha: ${sesion.fecha} ${sesion.hora}`,
          `Asistencias que se borrarán: ${datos.resumen.presentes} presentes, ${datos.resumen.tarde} tarde.`,
        ]);
      },
      error: () => {
        // Si no se pueden cargar los conteos detallados, se mantiene el total que ya trae la lista.
      },
    });
  }

  cancelarEliminar(): void {
    this.sesionAEliminar.set(null);
    this.detalleEliminacion.set([]);
  }

  confirmarEliminar(): void {
    const sesion = this.sesionAEliminar();
    if (!sesion) {
      return;
    }
    this.eliminando.set(true);

    this.sesionesService.eliminarSesion(sesion.id).subscribe({
      next: () => {
        this.eliminando.set(false);
        this.sesionAEliminar.set(null);
        this.detalleEliminacion.set([]);
        this.mensaje.set('La sesión se eliminó correctamente.');
        this.cargar();
      },
      error: (error: unknown) => {
        this.eliminando.set(false);
        this.sesionAEliminar.set(null);
        this.detalleEliminacion.set([]);
        this.error.set(this.mensajeError(error, 'No se pudo eliminar la sesión.'));
        this.cargar();
      },
    });
  }

  abrirEliminarLote(): void {
    this.mensaje.set(null);
    this.error.set(null);
    this.mostrarConfirmacionLote.set(true);
  }

  cancelarEliminarLote(): void {
    this.mostrarConfirmacionLote.set(false);
  }

  confirmarEliminarLote(): void {
    const seleccionadas = this.sesiones().filter((sesion) => this.seleccionadas().has(sesion.id));
    if (seleccionadas.length === 0) {
      this.mostrarConfirmacionLote.set(false);
      return;
    }
    this.eliminandoLote.set(true);

    const eliminaciones = seleccionadas.map((sesion) =>
      this.sesionesService.eliminarSesion(sesion.id).pipe(
        map(() => ({ sesion, exito: true as const })),
        catchError(() => of({ sesion, exito: false as const })),
      ),
    );

    forkJoin(eliminaciones).subscribe((resultados) => {
      const exitosos = resultados.filter((resultado) => resultado.exito);
      const fallidos = resultados.filter((resultado) => !resultado.exito);

      this.eliminandoLote.set(false);
      this.mostrarConfirmacionLote.set(false);

      if (fallidos.length === 0) {
        this.mensaje.set(`Se eliminaron ${exitosos.length} sesión(es).`);
      } else {
        const etiquetas = fallidos
          .map((resultado) => `${resultado.sesion.cursoNombre} (${resultado.sesion.fecha})`)
          .join(', ');
        this.error.set(
          `Se eliminaron ${exitosos.length} sesión(es); fallaron ${fallidos.length}: ${etiquetas}.`,
        );
      }
      this.cargar();
    });
  }

  private mensajeError(error: unknown, mensajePorDefecto = 'No se pudieron cargar las sesiones.'): string {
    if (error instanceof HttpErrorResponse && error.error?.message) {
      return error.error.message;
    }
    return mensajePorDefecto;
  }
}
