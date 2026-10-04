import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, UsuarioAutenticado } from '../core/auth.service';
import { Curso, CursoService } from './curso.service';
import { SesionesService } from './sesiones.service';

/**
 * TODO(laboratorios): quitar esta constante cuando exista GET /api/laboratorios.
 * Apunta al laboratorio de prueba que crea DataSeeder ("Laboratorio de Sistemas").
 */
const LABORATORIO_TEMPORAL = { id: 1, nombre: 'Laboratorio de Sistemas (temporal)' };

@Component({
  selector: 'app-sesion-form',
  imports: [FormsModule],
  template: `
    <section class="sesion-form">
      <h1>Nueva sesión</h1>

      @if (error(); as error) {
        <p class="error">{{ error }}</p>
      }

      <form (ngSubmit)="guardar()">
        <label>
          Curso
          <select name="cursoId" [(ngModel)]="cursoId" required>
            <option [ngValue]="null" disabled>Selecciona un curso</option>
            @for (curso of cursos(); track curso.id) {
              <option [ngValue]="curso.id">{{ curso.nombre }} ({{ curso.grupo }})</option>
            }
          </select>
        </label>

        <label>
          Laboratorio
          <select name="laboratorioId" [(ngModel)]="laboratorioId" required disabled>
            <option [ngValue]="laboratorioTemporal.id">{{ laboratorioTemporal.nombre }}</option>
          </select>
        </label>

        <label>
          Fecha
          <input type="date" name="fecha" [(ngModel)]="fecha" required />
        </label>

        <label>
          Hora
          <input type="time" name="hora" [(ngModel)]="hora" required />
        </label>

        <label>
          Tema
          <input type="text" name="tema" [(ngModel)]="tema" required />
        </label>

        <div class="acciones">
          <button type="button" (click)="cancelar()">Cancelar</button>
          <button type="submit" [disabled]="guardando()">
            {{ guardando() ? 'Guardando...' : 'Crear sesión' }}
          </button>
        </div>
      </form>
    </section>
  `,
  styles: `
    .sesion-form {
      display: grid;
      gap: 16px;
      max-width: 480px;
    }
    h1 {
      margin: 0;
      font-size: 24px;
      color: var(--color-texto);
    }
    .error {
      padding: 10px 14px;
      border-radius: 6px;
      background: #fde8e8;
      color: #9b2c2c;
    }
    form {
      display: grid;
      gap: 14px;
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
    select,
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
  `,
})
export class SesionFormComponent implements OnInit {
  private readonly cursoService = inject(CursoService);
  private readonly sesionesService = inject(SesionesService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly laboratorioTemporal = LABORATORIO_TEMPORAL;

  cursos = signal<Curso[]>([]);
  usuario = signal<UsuarioAutenticado | null>(null);
  error = signal<string | null>(null);
  guardando = signal(false);

  cursoId: number | null = null;
  laboratorioId = LABORATORIO_TEMPORAL.id;
  fecha = '';
  hora = '';
  tema = '';

  ngOnInit(): void {
    this.cursoService.listarCursos().subscribe({
      next: (cursos) => this.cursos.set(cursos),
      error: () => this.error.set('No se pudieron cargar los cursos.'),
    });

    this.auth.obtenerUsuario().subscribe({
      next: (usuario) => this.usuario.set(usuario),
      error: () => this.error.set('No se pudo determinar el administrador autenticado.'),
    });
  }

  guardar(): void {
    if (!this.cursoId || !this.fecha || !this.hora || !this.tema.trim()) {
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
        cursoId: this.cursoId,
        laboratorioId: this.laboratorioId,
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
