import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService, UsuarioAutenticado } from '../core/auth.service';

const NOMBRES_ROL: Record<UsuarioAutenticado['rol'], string> = {
  ADMINISTRADOR: 'Administrador',
  DOCENTE: 'Docente',
};

interface ItemMenu {
  etiqueta: string;
  ruta: string;
}

const ITEMS_MENU: ItemMenu[] = [
  { etiqueta: 'Inicio', ruta: '/panel' },
  { etiqueta: 'Sesiones', ruta: '/panel/sesiones' },
  { etiqueta: 'Laboratorios', ruta: '/panel/laboratorios' },
  { etiqueta: 'Estudiantes', ruta: '/panel/estudiantes' },
  { etiqueta: 'Dashboard', ruta: '/panel/dashboard' },
];

@Component({
  selector: 'app-panel-layout',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="panel-layout">
      <aside class="menu">
        <p class="menu-titulo">Control de asistencia</p>
        <nav>
          @for (item of items; track item.ruta) {
            <a [routerLink]="item.ruta" routerLinkActive="activo" [routerLinkActiveOptions]="{ exact: item.ruta === '/panel' }">
              {{ item.etiqueta }}
            </a>
          }
        </nav>
      </aside>
      <div class="contenido">
        <header class="encabezado">
          @if (usuario(); as usuario) {
            <div class="usuario">
              <span class="nombre">{{ usuario.nombre }}</span>
              <span class="rol">{{ nombreRol(usuario.rol) }}</span>
            </div>
          }
          <button type="button" (click)="cerrarSesion()">Cerrar sesión</button>
        </header>
        <main class="area-trabajo">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  styles: `
    :host { display: block; min-height: 100dvh; font-family: "Trebuchet MS", sans-serif; }
    .panel-layout { display: grid; grid-template-columns: 220px 1fr; min-height: 100dvh; background: var(--color-fondo); }
    .menu { display: flex; flex-direction: column; gap: 16px; padding: 24px 16px; background: var(--color-superficie); border-right: 1px solid var(--color-borde); }
    .menu-titulo { margin: 0 0 8px; color: var(--color-primario); font-size: 13px; font-weight: 700; text-transform: uppercase; }
    nav { display: grid; gap: 4px; }
    nav a { padding: 10px 12px; border-radius: 6px; color: var(--color-texto); text-decoration: none; font-weight: 600; }
    nav a:hover { background: var(--color-fondo); }
    nav a.activo { background: var(--color-primario-suave); color: var(--color-primario); }
    .contenido { display: flex; flex-direction: column; min-width: 0; }
    .encabezado { display: flex; align-items: center; justify-content: space-between; padding: 16px 24px; border-bottom: 1px solid var(--color-borde); background: var(--color-superficie); }
    .usuario { display: flex; flex-direction: column; }
    .usuario .nombre { font-weight: 700; color: var(--color-texto); }
    .usuario .rol { font-size: 12px; color: var(--color-texto-suave); }
    .encabezado button { min-height: 40px; padding: 0 16px; border: 1px solid var(--color-borde); border-radius: 4px; background: var(--color-superficie); color: var(--color-texto); font: inherit; font-weight: 700; cursor: pointer; }
    .encabezado button:hover { background: var(--color-fondo); }
    .area-trabajo { flex: 1; padding: 24px; box-sizing: border-box; }
  `,
})
export class PanelLayoutComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly items = ITEMS_MENU;
  usuario = signal<UsuarioAutenticado | null>(null);

  ngOnInit(): void {
    this.auth.obtenerUsuario().subscribe({
      next: (usuario) => this.usuario.set(usuario),
      error: () => this.usuario.set(null),
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
