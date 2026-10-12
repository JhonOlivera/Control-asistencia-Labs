import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, UsuarioAutenticado } from '../core/auth.service';
import { Laboratorio, LaboratorioService } from '../laboratorios/laboratorio.service';
import { Curso, CursoService } from './curso.service';
import { SesionesService } from './sesiones.service';

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
          <select name="laboratorioId" [(ngModel)]="laboratorioId" required>
            <option [ngValue]="null" disabled>Selecciona un laboratorio</option>
            @for (laboratorio of laboratorios(); track laboratorio.id) {
              <option [ngValue]="laboratorio.id">{{ laboratorio.nombre }}</option>
            }
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
      background: var(--color-error-suave);
      color: var(--color-error);
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
      color: var(--color-sobre-primario);
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
  private readonly laboratorioService = inject(LaboratorioService);
  private readonly sesionesService = inject(SesionesService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  cursos = signal<Curso[]>([]);
  laboratorios = signal<Laboratorio[]>([]);
  usuario = signal<UsuarioAutenticado | null>(null);
  error = signal<string | null>(null);
  guardando = signal(false);

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

  guardar(): void {
    if (!this.cursoId || !this.laboratorioId || !this.fecha || !this.hora || !this.tema.trim()) {
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
