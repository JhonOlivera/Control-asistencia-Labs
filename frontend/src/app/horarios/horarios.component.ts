import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable, catchError, forkJoin, map, of } from 'rxjs';
import { Laboratorio, LaboratorioService } from '../laboratorios/laboratorio.service';
import { Curso, CursoService } from '../sesiones/curso.service';
import { DiaSemana, HorarioGrupo, HorarioGrupoService } from './horario-grupo.service';

const DIAS_SEMANA: DiaSemana[] = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
];

const ETIQUETAS_DIA: Record<DiaSemana, string> = {
  MONDAY: 'Lunes',
  TUESDAY: 'Martes',
  WEDNESDAY: 'Miércoles',
  THURSDAY: 'Jueves',
  FRIDAY: 'Viernes',
  SATURDAY: 'Sábado',
  SUNDAY: 'Domingo',
};

const ETIQUETAS_DIA_CORTA: Record<DiaSemana, string> = {
  MONDAY: 'Lun',
  TUESDAY: 'Mar',
  WEDNESDAY: 'Mié',
  THURSDAY: 'Jue',
  FRIDAY: 'Vie',
  SATURDAY: 'Sáb',
  SUNDAY: 'Dom',
};

const ORDEN_DIA: Record<DiaSemana, number> = DIAS_SEMANA.reduce(
  (acumulado, dia, indice) => ({ ...acumulado, [dia]: indice }),
  {} as Record<DiaSemana, number>,
);

type AccionHorario = 'creado' | 'actualizado' | 'desactivado';

const ETIQUETAS_ACCION: Record<AccionHorario, string> = {
  creado: 'creado',
  actualizado: 'actualizado',
  desactivado: 'desactivado',
};

interface OperacionResultado {
  dia: DiaSemana;
  accion: AccionHorario;
  exito: boolean;
  mensaje?: string;
}

interface ResultadoGuardado {
  exitosos: { dia: DiaSemana; accion: AccionHorario }[];
  fallidos: { dia: DiaSemana; accion: AccionHorario; mensaje: string }[];
}

interface GrupoHorario {
  claveId: string;
  laboratorioId: number;
  laboratorioNombre: string;
  horaInicio: string;
  horaFin: string;
  dias: DiaSemana[];
  registros: Record<DiaSemana, number>;
}

function diasVacios(): Record<DiaSemana, boolean> {
  return {
    MONDAY: false,
    TUESDAY: false,
    WEDNESDAY: false,
    THURSDAY: false,
    FRIDAY: false,
    SATURDAY: false,
    SUNDAY: false,
  };
}

@Component({
  selector: 'app-horarios',
  imports: [FormsModule],
  template: `
    <section class="horarios">
      <header class="encabezado">
        <h1>Horarios</h1>
        @if (!mostrarFormulario() && cursoId() !== null) {
          <button type="button" class="btn" (click)="nuevo()">Nuevo horario</button>
        }
      </header>

      @if (error(); as error) {
        <p class="mensaje-error" role="alert">{{ error }}</p>
      }

      @if (resultado(); as resultado) {
        <div class="card resumen" role="status">
          @if (resultado.exitosos.length > 0) {
            <p class="resumen-linea resumen-linea--exito">Listo: {{ resumenTexto(resultado.exitosos) }}</p>
          }
          @if (resultado.fallidos.length > 0) {
            <p class="resumen-linea resumen-linea--error">No se pudo completar:</p>
            <ul class="resumen-lista">
              @for (fallo of resultado.fallidos; track fallo.dia + fallo.accion) {
                <li>{{ etiquetaDia(fallo.dia) }} ({{ etiquetaAccion(fallo.accion) }}): {{ fallo.mensaje }}</li>
              }
            </ul>
          }
        </div>
      }

      @if (!mostrarFormulario()) {
        <div class="card filtros">
          <label>
            Curso
            <select
              name="cursoId"
              [ngModel]="cursoId()"
              (ngModelChange)="seleccionarCurso($event)"
            >
              <option [ngValue]="null" disabled>Selecciona un curso</option>
              @for (curso of cursos(); track curso.id) {
                <option [ngValue]="curso.id">{{ curso.nombre }} ({{ curso.grupo }})</option>
              }
            </select>
          </label>
          @if (cursoId() !== null) {
            <label class="interruptor">
              <input
                type="checkbox"
                [ngModel]="mostrarInactivos()"
                (ngModelChange)="mostrarInactivos.set($event)"
              />
              Mostrar inactivos
            </label>
          }
        </div>
      }

      @if (mostrarFormulario()) {
        <form class="card formulario" (ngSubmit)="guardar()">
          <h2>{{ edicionGrupo() === null ? 'Nuevo horario' : 'Editar horario' }}</h2>

          @if (errorFormulario(); as errorFormulario) {
            <p class="mensaje-error" role="alert">{{ errorFormulario }}</p>
          }

          <fieldset class="dias-semana">
            <legend>Días de la semana</legend>
            <div class="dias-grid">
              @for (dia of diasSemana; track dia) {
                <label class="dia-checkbox">
                  <input
                    type="checkbox"
                    [checked]="diasSeleccionados[dia]"
                    (change)="alternarDia(dia, $event)"
                  />
                  {{ etiquetaDia(dia) }}
                </label>
              }
            </div>
          </fieldset>

          <label>
            Hora de inicio
            <input type="time" name="horaInicio" [(ngModel)]="horaInicio" required />
          </label>

          <label>
            Hora de fin
            <input type="time" name="horaFin" [(ngModel)]="horaFin" required />
          </label>

          <label>
            Laboratorio
            <select name="laboratorioId" [(ngModel)]="laboratorioId" required>
              <option [ngValue]="null" disabled>Selecciona un laboratorio</option>
              @for (laboratorio of laboratorios(); track laboratorio.id) {
                <option [ngValue]="laboratorio.id">{{ laboratorio.nombre }}</option>
              }
            </select>
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
        @if (cursoId() === null) {
          <p class="estado-vacio">Selecciona un curso para ver sus horarios.</p>
        } @else if (cargando()) {
          <p class="cargando">Cargando horarios...</p>
        } @else if (gruposActivos().length === 0) {
          <p class="estado-vacio">Este curso no tiene horarios activos registrados.</p>
        } @else {
          <div class="tabla-contenedor">
            <table class="tabla">
              <thead>
                <tr>
                  <th>Días</th>
                  <th>Hora inicio</th>
                  <th>Hora fin</th>
                  <th>Laboratorio</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                @for (grupo of gruposActivos(); track grupo.claveId) {
                  <tr>
                    <td data-label="Días">
                      <div class="dia-chips">
                        @for (dia of grupo.dias; track dia) {
                          <span class="chip-dia">{{ etiquetaDiaCorta(dia) }}</span>
                        }
                      </div>
                    </td>
                    <td data-label="Hora inicio">{{ grupo.horaInicio }}</td>
                    <td data-label="Hora fin">{{ grupo.horaFin }}</td>
                    <td data-label="Laboratorio">{{ grupo.laboratorioNombre }}</td>
                    <td data-label="Acciones" class="fila-acciones">
                      <button type="button" class="btn btn--secundario btn--chico" (click)="editarGrupo(grupo)">
                        Editar
                      </button>
                      <button type="button" class="btn btn--peligro btn--chico" (click)="desactivarGrupo(grupo)">
                        Desactivar
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }

        @if (mostrarInactivos() && cursoId() !== null) {
          <div class="seccion-inactivos">
            <h2>Horarios inactivos</h2>
            @if (gruposInactivos().length === 0) {
              <p class="estado-vacio">Este curso no tiene horarios inactivos.</p>
            } @else {
              <div class="tabla-contenedor">
                <table class="tabla">
                  <thead>
                    <tr>
                      <th>Días</th>
                      <th>Hora inicio</th>
                      <th>Hora fin</th>
                      <th>Laboratorio</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (grupo of gruposInactivos(); track grupo.claveId) {
                      <tr>
                        <td data-label="Días">
                          <div class="dia-chips">
                            @for (dia of grupo.dias; track dia) {
                              <span class="chip-dia chip-dia--inactivo">{{ etiquetaDiaCorta(dia) }}</span>
                            }
                          </div>
                        </td>
                        <td data-label="Hora inicio">{{ grupo.horaInicio }}</td>
                        <td data-label="Hora fin">{{ grupo.horaFin }}</td>
                        <td data-label="Laboratorio">{{ grupo.laboratorioNombre }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </div>
        }
      }
    </section>
  `,
  styles: `
    .horarios {
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
      align-items: center;
      gap: var(--espacio-4);
    }
    .filtros label:first-child {
      flex: 1 1 280px;
    }
    .interruptor {
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: var(--espacio-2);
      color: var(--color-texto);
      font-weight: 600;
      font-size: var(--texto-sm);
    }
    .interruptor input {
      width: 18px;
      height: 18px;
      accent-color: var(--color-primario);
      flex-shrink: 0;
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
    .dias-semana {
      display: grid;
      gap: var(--espacio-2);
      padding: 0;
      border: none;
      margin: 0;
    }
    .dias-semana legend {
      padding: 0;
      color: var(--color-texto);
      font-weight: 600;
      font-size: var(--texto-sm);
    }
    .dias-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
      gap: var(--espacio-2);
    }
    .dia-checkbox {
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: var(--espacio-2);
      min-height: 40px;
      padding: 0 var(--espacio-3);
      border: 1px solid var(--color-borde);
      border-radius: var(--radio-sm);
      background: var(--color-superficie);
      color: var(--color-texto);
      font-weight: 600;
      font-size: var(--texto-sm);
      cursor: pointer;
    }
    .dia-checkbox input {
      width: 18px;
      height: 18px;
      accent-color: var(--color-primario);
      flex-shrink: 0;
    }
    .dia-chips {
      display: flex;
      flex-wrap: wrap;
      gap: var(--espacio-1);
      justify-content: flex-start;
    }
    .chip-dia {
      display: inline-flex;
      align-items: center;
      padding: 2px var(--espacio-2);
      border-radius: var(--radio-pill);
      background: var(--color-primario-suave);
      color: var(--color-primario);
      font-size: var(--texto-xs);
      font-weight: 700;
      white-space: nowrap;
    }
    .chip-dia--inactivo {
      background: var(--color-borde);
      color: var(--color-texto-suave);
    }
    .seccion-inactivos {
      display: grid;
      gap: var(--espacio-3);
      margin-top: var(--espacio-2);
    }
    .seccion-inactivos h2 {
      font-size: var(--texto-base);
      color: var(--color-texto-suave);
    }
    .resumen {
      display: grid;
      gap: var(--espacio-2);
    }
    .resumen-linea {
      margin: 0;
      font-size: var(--texto-sm);
    }
    .resumen-linea--exito {
      color: var(--color-presente);
      font-weight: 600;
    }
    .resumen-linea--error {
      color: var(--color-error);
      font-weight: 600;
    }
    .resumen-lista {
      margin: 0;
      padding-left: var(--espacio-5);
      color: var(--color-error);
      font-size: var(--texto-sm);
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
    @media (max-width: 767px) {
      .dia-chips {
        justify-content: flex-end;
      }
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
export class HorariosComponent implements OnInit {
  private readonly horarioGrupoService = inject(HorarioGrupoService);
  private readonly cursoService = inject(CursoService);
  private readonly laboratorioService = inject(LaboratorioService);

  readonly diasSemana = DIAS_SEMANA;

  cursos = signal<Curso[]>([]);
  laboratorios = signal<Laboratorio[]>([]);
  horarios = signal<HorarioGrupo[]>([]);
  cursoId = signal<number | null>(null);
  cargando = signal(false);
  error = signal<string | null>(null);
  mostrarInactivos = signal(false);

  gruposActivos = computed(() =>
    this.agruparHorarios(this.horarios().filter((horario) => horario.activo)),
  );
  gruposInactivos = computed(() =>
    this.agruparHorarios(this.horarios().filter((horario) => !horario.activo)),
  );

  mostrarFormulario = signal(false);
  edicionGrupo = signal<GrupoHorario | null>(null);
  errorFormulario = signal<string | null>(null);
  guardando = signal(false);
  resultado = signal<ResultadoGuardado | null>(null);

  diasSeleccionados: Record<DiaSemana, boolean> = diasVacios();
  horaInicio = '';
  horaFin = '';
  laboratorioId: number | null = null;

  ngOnInit(): void {
    this.cursoService.listarCursos().subscribe({
      next: (cursos) => this.cursos.set(cursos),
      error: () => this.error.set('No se pudieron cargar los cursos.'),
    });

    this.laboratorioService.listarLaboratorios().subscribe({
      next: (laboratorios) =>
        this.laboratorios.set(laboratorios.filter((laboratorio) => laboratorio.estado === 'ACTIVO')),
      error: () => this.error.set('No se pudieron cargar los laboratorios.'),
    });
  }

  seleccionarCurso(cursoId: number | null): void {
    this.cursoId.set(cursoId);
    this.mostrarFormulario.set(false);
    this.resultado.set(null);
    this.cargarHorarios();
  }

  cargarHorarios(): void {
    const cursoId = this.cursoId();
    if (cursoId === null) {
      this.horarios.set([]);
      return;
    }

    this.cargando.set(true);
    this.error.set(null);

    this.horarioGrupoService.listarPorCurso(cursoId).subscribe({
      next: (horarios) => {
        this.horarios.set(horarios);
        this.cargando.set(false);
      },
      error: (error: unknown) => {
        this.error.set(this.mensajeError(error, 'No se pudieron cargar los horarios.'));
        this.cargando.set(false);
      },
    });
  }

  nuevo(): void {
    if (this.cursoId() === null) {
      return;
    }
    this.edicionGrupo.set(null);
    this.diasSeleccionados = diasVacios();
    this.horaInicio = '';
    this.horaFin = '';
    this.laboratorioId = null;
    this.errorFormulario.set(null);
    this.resultado.set(null);
    this.mostrarFormulario.set(true);
  }

  editarGrupo(grupo: GrupoHorario): void {
    this.edicionGrupo.set(grupo);
    const seleccion = diasVacios();
    grupo.dias.forEach((dia) => (seleccion[dia] = true));
    this.diasSeleccionados = seleccion;
    this.horaInicio = grupo.horaInicio;
    this.horaFin = grupo.horaFin;
    this.laboratorioId = grupo.laboratorioId;
    this.errorFormulario.set(null);
    this.resultado.set(null);
    this.mostrarFormulario.set(true);
  }

  cancelar(): void {
    this.mostrarFormulario.set(false);
  }

  alternarDia(dia: DiaSemana, evento: Event): void {
    const marcado = (evento.target as HTMLInputElement).checked;
    this.diasSeleccionados = { ...this.diasSeleccionados, [dia]: marcado };
  }

  guardar(): void {
    const cursoId = this.cursoId();
    if (cursoId === null) {
      this.errorFormulario.set('Selecciona un curso.');
      return;
    }

    if (!this.horaInicio || !this.horaFin || !this.laboratorioId) {
      this.errorFormulario.set('Completa todos los campos.');
      return;
    }

    if (this.horaFin <= this.horaInicio) {
      this.errorFormulario.set('La hora de fin debe ser posterior a la hora de inicio.');
      return;
    }

    const diasMarcados = this.diasSemana.filter((dia) => this.diasSeleccionados[dia]);
    if (diasMarcados.length === 0) {
      this.errorFormulario.set('Marca al menos un día de la semana.');
      return;
    }

    this.errorFormulario.set(null);

    const grupoOriginal = this.edicionGrupo();
    if (grupoOriginal) {
      this.guardarEdicionGrupo(cursoId, grupoOriginal, diasMarcados);
    } else {
      this.guardarNuevos(cursoId, diasMarcados);
    }
  }

  desactivarGrupo(grupo: GrupoHorario): void {
    if (!confirm(`Se desactivará el horario de ${this.etiquetasDiasCortas(grupo.dias)}.`)) {
      return;
    }

    this.error.set(null);
    this.resultado.set(null);

    const operaciones: Observable<OperacionResultado>[] = grupo.dias.map((dia) =>
      this.horarioGrupoService.desactivarHorario(grupo.registros[dia]).pipe(
        map(() => ({ dia, accion: 'desactivado' as const, exito: true as const })),
        catchError((error: unknown) =>
          of({
            dia,
            accion: 'desactivado' as const,
            exito: false as const,
            mensaje: this.mensajeError(error, 'No se pudo desactivar el horario.'),
          }),
        ),
      ),
    );

    forkJoin(operaciones).subscribe((resultados) =>
      this.manejarResultadoOperaciones(resultados, { remarcarDiasFallidos: false }),
    );
  }

  etiquetaDia(dia: DiaSemana): string {
    return ETIQUETAS_DIA[dia];
  }

  etiquetaDiaCorta(dia: DiaSemana): string {
    return ETIQUETAS_DIA_CORTA[dia];
  }

  etiquetaAccion(accion: AccionHorario): string {
    return ETIQUETAS_ACCION[accion];
  }

  etiquetasDiasCortas(dias: DiaSemana[]): string {
    return dias.map((dia) => this.etiquetaDiaCorta(dia)).join(', ');
  }

  resumenTexto(items: { dia: DiaSemana; accion: AccionHorario }[]): string {
    return items
      .map((item) => `${this.etiquetaDia(item.dia)} (${this.etiquetaAccion(item.accion)})`)
      .join(', ');
  }

  private guardarNuevos(cursoId: number, diasMarcados: DiaSemana[]): void {
    const laboratorioId = this.laboratorioId!;
    const horaInicio = this.horaInicio;
    const horaFin = this.horaFin;

    this.resultado.set(null);
    this.guardando.set(true);

    const operaciones: Observable<OperacionResultado>[] = diasMarcados.map((dia) =>
      this.horarioGrupoService
        .crearHorario({ cursoId, laboratorioId, diaSemana: dia, horaInicio, horaFin })
        .pipe(
          map(() => ({ dia, accion: 'creado' as const, exito: true as const })),
          catchError((error: unknown) =>
            of({
              dia,
              accion: 'creado' as const,
              exito: false as const,
              mensaje: this.mensajeError(error, 'No se pudo crear el horario.'),
            }),
          ),
        ),
    );

    forkJoin(operaciones).subscribe((resultados) =>
      this.manejarResultadoOperaciones(resultados, { remarcarDiasFallidos: true }),
    );
  }

  private guardarEdicionGrupo(cursoId: number, grupo: GrupoHorario, diasMarcados: DiaSemana[]): void {
    const laboratorioId = this.laboratorioId!;
    const horaInicio = this.horaInicio;
    const horaFin = this.horaFin;

    const diasOriginales = new Set(grupo.dias);
    const diasFinales = new Set(diasMarcados);
    const cambioDatos =
      laboratorioId !== grupo.laboratorioId || horaInicio !== grupo.horaInicio || horaFin !== grupo.horaFin;

    const operaciones: Observable<OperacionResultado>[] = [];

    for (const dia of grupo.dias) {
      const id = grupo.registros[dia];
      if (diasFinales.has(dia)) {
        if (cambioDatos) {
          operaciones.push(
            this.horarioGrupoService
              .actualizarHorario(id, { cursoId, laboratorioId, diaSemana: dia, horaInicio, horaFin })
              .pipe(
                map(() => ({ dia, accion: 'actualizado' as const, exito: true as const })),
                catchError((error: unknown) =>
                  of({
                    dia,
                    accion: 'actualizado' as const,
                    exito: false as const,
                    mensaje: this.mensajeError(error, 'No se pudo actualizar el horario.'),
                  }),
                ),
              ),
          );
        }
      } else {
        operaciones.push(
          this.horarioGrupoService.desactivarHorario(id).pipe(
            map(() => ({ dia, accion: 'desactivado' as const, exito: true as const })),
            catchError((error: unknown) =>
              of({
                dia,
                accion: 'desactivado' as const,
                exito: false as const,
                mensaje: this.mensajeError(error, 'No se pudo desactivar el horario.'),
              }),
            ),
          ),
        );
      }
    }

    for (const dia of diasMarcados) {
      if (!diasOriginales.has(dia)) {
        operaciones.push(
          this.horarioGrupoService
            .crearHorario({ cursoId, laboratorioId, diaSemana: dia, horaInicio, horaFin })
            .pipe(
              map(() => ({ dia, accion: 'creado' as const, exito: true as const })),
              catchError((error: unknown) =>
                of({
                  dia,
                  accion: 'creado' as const,
                  exito: false as const,
                  mensaje: this.mensajeError(error, 'No se pudo crear el horario.'),
                }),
              ),
            ),
        );
      }
    }

    if (operaciones.length === 0) {
      this.mostrarFormulario.set(false);
      return;
    }

    this.resultado.set(null);
    this.guardando.set(true);

    forkJoin(operaciones).subscribe((resultados) =>
      this.manejarResultadoOperaciones(resultados, { remarcarDiasFallidos: false }),
    );
  }

  private manejarResultadoOperaciones(
    resultados: OperacionResultado[],
    opciones: { remarcarDiasFallidos: boolean },
  ): void {
    this.guardando.set(false);

    const exitosos = resultados
      .filter((resultado) => resultado.exito)
      .map(({ dia, accion }) => ({ dia, accion }));
    const fallidos = resultados
      .filter((resultado): resultado is OperacionResultado & { exito: false; mensaje: string } => !resultado.exito)
      .map(({ dia, accion, mensaje }) => ({ dia, accion, mensaje }));

    if (fallidos.length === 0) {
      this.resultado.set(null);
      this.mostrarFormulario.set(false);
    } else {
      this.resultado.set({ exitosos, fallidos });
      if (opciones.remarcarDiasFallidos) {
        const nuevaSeleccion = diasVacios();
        fallidos.forEach((fallo) => (nuevaSeleccion[fallo.dia] = true));
        this.diasSeleccionados = nuevaSeleccion;
      } else {
        this.mostrarFormulario.set(false);
      }
    }

    this.cargarHorarios();
  }

  private agruparHorarios(horarios: HorarioGrupo[]): GrupoHorario[] {
    const mapa = new Map<string, GrupoHorario>();

    for (const horario of horarios) {
      const horaInicio = horario.horaInicio.slice(0, 5);
      const horaFin = horario.horaFin.slice(0, 5);
      const clave = `${horario.laboratorioId}|${horaInicio}|${horaFin}`;

      let grupo = mapa.get(clave);
      if (!grupo) {
        grupo = {
          claveId: clave,
          laboratorioId: horario.laboratorioId,
          laboratorioNombre: horario.laboratorioNombre,
          horaInicio,
          horaFin,
          dias: [],
          registros: {} as Record<DiaSemana, number>,
        };
        mapa.set(clave, grupo);
      }
      grupo.dias.push(horario.diaSemana);
      grupo.registros[horario.diaSemana] = horario.id;
    }

    const grupos = [...mapa.values()];
    grupos.forEach((grupo) => grupo.dias.sort((a, b) => ORDEN_DIA[a] - ORDEN_DIA[b]));

    return grupos.sort((a, b) => {
      const porHora = a.horaInicio.localeCompare(b.horaInicio);
      if (porHora !== 0) {
        return porHora;
      }
      return ORDEN_DIA[a.dias[0]] - ORDEN_DIA[b.dias[0]];
    });
  }

  private mensajeError(error: unknown, mensajePorDefecto: string): string {
    if (error instanceof HttpErrorResponse && error.error?.message) {
      return error.error.message;
    }
    return mensajePorDefecto;
  }
}
