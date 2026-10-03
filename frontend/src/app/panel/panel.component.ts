import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, UsuarioAutenticado } from '../core/auth.service';

const NOMBRES_ROL: Record<UsuarioAutenticado['rol'], string> = {
  ADMINISTRADOR: 'Administrador',
  DOCENTE: 'Docente',
};

@Component({
  selector: 'app-panel',
  template: `
    <main class="panel-page">
      <section class="panel">
        <p class="eyebrow">Control de asistencia</p>
        @if (usuario(); as usuario) {
          <h1>Hola, {{ usuario.nombre }}</h1>
          <p class="rol">{{ nombreRol(usuario.rol) }}</p>
          <p class="correo">{{ usuario.correo }}</p>
        } @else if (error()) {
          <h1>No se pudo cargar tu información</h1>
        } @else {
          <p>Cargando...</p>
        }
        <button type="button" (click)="cerrarSesion()">Cerrar sesión</button>
      </section>
    </main>
  `,
  styles: `
    :host { display: block; min-height: 100dvh; color: #172b2a; font-family: "Trebuchet MS", sans-serif; }
    .panel-page { display: grid; min-height: 100dvh; place-items: center; padding: 24px; box-sizing: border-box; background: #f4f5ef; }
    .panel { display: grid; width: min(100%, 420px); gap: 8px; padding: 36px; border: 1px solid #d5dfd8; border-radius: 8px; background: #fff; box-shadow: 0 20px 55px #193c3014; }
    .eyebrow { margin: 0; color: #527c68; font-size: 12px; font-weight: 700; text-transform: uppercase; }
    h1 { margin: 0; font-size: 28px; }
    .rol { justify-self: start; margin: 4px 0 0; padding: 4px 10px; border-radius: 999px; background: #d8ebe3; color: #176b50; font-size: 14px; font-weight: 700; }
    .correo { margin: 0; color: #527c68; font-size: 14px; }
    button { min-height: 46px; margin-top: 16px; border: 1px solid #b9c9c0; border-radius: 4px; background: #fff; color: #172b2a; font: inherit; font-weight: 700; cursor: pointer; }
    button:hover { background: #f4f5ef; }
  `,
})
export class PanelComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  usuario = signal<UsuarioAutenticado | null>(null);
  error = signal(false);

  ngOnInit(): void {
    this.auth.obtenerUsuario().subscribe({
      next: (usuario) => this.usuario.set(usuario),
      error: () => this.error.set(true),
    });
  }

  nombreRol(rol: UsuarioAutenticado['rol']): string {
    return NOMBRES_ROL[rol] ?? rol;
  }

  cerrarSesion(): void {
    this.auth.cerrarSesion();
    this.router.navigate(['/login']);
  }
}
