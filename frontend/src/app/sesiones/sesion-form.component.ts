import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, UsuarioAutenticado } from '../core/auth.service';
import { Laboratorio, LaboratorioService } from '../laboratorios/laboratorio.service';
import { Curso, CursoService } from './curso.service';
import { SesionesService } from './sesiones.service';

type CampoSesion = 'curso' | 'laboratorio' | 'fecha' | 'hora' | 'tema';

@Component({
  selector: 'app-sesion-form',
  imports: [FormsModule],
  template: `
    <section class="sesion-form">
      <h1>Nueva sesión</h1>

      @if (error(); as error) {
        <p class="mensaje-error" role="alert">{{ error }}</p>
      }

      <form class="card" (ngSubmit)="guardar()">
        <label>
          Curso
          <select
            name="cursoId"
            [(ngModel)]="cursoId"
            required
            [class.campo-invalido]="campoInvalido('curso')"
          >
            <option [ngValue]="null" disabled>Selecciona un curso</option>
            @for (curso of cursos(); track curso.id) {
              <option [ngValue]="curso.id">{{ curso.nombre }} ({{ curso.grupo }})</option>
            }
          </select>
          @if (campoInvalido('curso')) {
            <span class="texto-error-campo">Selecciona un curso.</span>
          }
        </label>

        <label>
          Laboratorio
          <select
            name="laboratorioId"
            [(ngModel)]="laboratorioId"
            required
            [class.campo-invalido]="campoInvalido('laboratorio')"
          >
            <option [ngValue]="null" disabled>Selecciona un laboratorio</option>
            @for (laboratorio of laboratorios(); track laboratorio.id) {
              <option [ngValue]="laboratorio.id">{{ laboratorio.nombre }}</option>
            }
          </select>
          @if (campoInvalido('laboratorio')) {
            <span class="texto-error-campo">Selecciona un laboratorio.</span>
          }
        </label>

        <label>
          Fecha
          <input
            type="date"
            name="fecha"
            [(ngModel)]="fecha"
            required
            [class.campo-invalido]="campoInvalido('fecha')"
          />
          @if (campoInvalido('fecha')) {
            <span class="texto-error-campo">Indica la fecha.</span>
          }
        </label>

        <label>
          Hora
          <input
            type="time"
            name="hora"
            [(ngModel)]="hora"
            required
            [class.campo-invalido]="campoInvalido('hora')"
          />
          @if (campoInvalido('hora')) {
            <span class="texto-error-campo">Indica la hora.</span>
          }
        </label>

        <label>
          Tema
          <input
            type="text"
            name="tema"
            [(ngModel)]="tema"
            required
            [class.campo-invalido]="campoInvalido('tema')"
          />
          @if (campoInvalido('tema')) {
            <span class="texto-error-campo">Indica el tema de la sesión.</span>
          }
        </label>

        <div class="acciones">
          <button type="button" class="btn btn--secundario" (click)="cancelar()">Cancelar</button>
          <button type="submit" class="btn" [disabled]="guardando()">
            {{ guardando() ? 'Guardando...' : 'Crear sesión' }}
          </button>
        </div>
      </form>
    </section>
  `,
  styles: `
    .sesion-form {
      display: grid;
      gap: var(--espacio-4);
      max-width: 480px;
    }
    h1 {
      margin: 0;
      font-size: var(--texto-xl);
      color: var(--color-texto);
    }
    form {
      display: grid;
      gap: var(--espacio-4);
    }
    label {
      display: grid;
      gap: var(--espacio-1);
      color: var(--color-texto);
      font-weight: 600;
      font-size: var(--texto-sm);
    }
    select,
    input {
      min-height: 40px;
      padding: 0 var(--espacio-3);
      border: 1px solid var(--color-borde);
      border-radius: var(--radio-sm);
      background: var(--color-superficie);
      color: var(--color-texto);
      font: inherit;
    }
    .campo-invalido {
      border-color: var(--color-error);
    }
    .texto-error-campo {
      color: var(--color-error);
      font-size: var(--texto-xs);
      font-weight: 400;
    }
    .acciones {
      display: flex;
      justify-content: flex-end;
      gap: var(--espacio-3);
      margin-top: var(--espacio-2);
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
export class SesionFormComponent implements OnInit {
  private readonly cursoService = inject(CursoService);
  private readonly laboratorioService = inject(LaboratorioService);
  private readonly sesionesService = inject(SesionesService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  cursos = signal<Curso[]>([]);
  laboratorios = signal<Laboratorio[]>([]);
  usuario = signal<UsuarioAutenticado | null>(null);
  error = signal<string | null>(null);
  guardando = signal(false);
  camposInvalidos = signal<Set<CampoSesion>>(new Set());

  cursoId: number | null = null;
  laboratorioId: number | null = null;
  fecha = '';
  hora = '';
  tema = '';

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

    this.auth.obtenerUsuario().subscribe({
      next: (usuario) => this.usuario.set(usuario),
      error: () => this.error.set('No se pudo determinar el administrador autenticado.'),
    });
  }

  campoInvalido(campo: CampoSesion): boolean {
    return this.camposInvalidos().has(campo);
  }

  guardar(): void {
    const invalidos = new Set<CampoSesion>();
    if (!this.cursoId) invalidos.add('curso');
    if (!this.laboratorioId) invalidos.add('laboratorio');
    if (!this.fecha) invalidos.add('fecha');
    if (!this.hora) invalidos.add('hora');
    if (!this.tema.trim()) invalidos.add('tema');
    this.camposInvalidos.set(invalidos);

    if (invalidos.size > 0) {
      this.error.set('Completa todos los campos.');
      return;
    }

    const administradorId = this.usuario()?.id;
    if (!administradorId) {
      this.error.set('No se pudo determinar el administrador autenticado.');
      return;
    }

    this.error.set(null);
    this.guardando.set(true);
    this.sesionesService
      .crearSesion({
        cursoId: this.cursoId!,
        laboratorioId: this.laboratorioId!,
        administradorId,
        fecha: this.fecha,
        hora: this.hora,
        tema: this.tema.trim(),
      })
      .subscribe({
        next: (sesion) => this.router.navigate(['/panel/sesiones', sesion.id]),
        error: (error: unknown) => {
          this.guardando.set(false);
          this.error.set(this.mensajeError(error));
        },
      });
  }

  cancelar(): void {
    this.router.navigate(['/panel/sesiones']);
  }

  private mensajeError(error: unknown): string {
    if (error instanceof HttpErrorResponse && error.error?.message) {
      return error.error.message;
    }
    return 'No se pudo crear la sesión.';
  }
}
