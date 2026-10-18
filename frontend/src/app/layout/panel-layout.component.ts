import {
  Component,
  ElementRef,
  HostListener,
  OnInit,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService, UsuarioAutenticado } from '../core/auth.service';
import { ThemeService } from '../core/theme.service';

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
      @if (menuAbierto()) {
        <div class="fondo-oscuro" (click)="cerrarMenu()" aria-hidden="true"></div>
      }
      <aside id="menu-lateral" class="menu" [class.abierto]="menuAbierto()">
        <p class="menu-titulo">Control de asistencia</p>
        <nav>
          @for (item of items; track item.ruta) {
            <a
              [routerLink]="item.ruta"
              routerLinkActive="activo"
              [routerLinkActiveOptions]="{ exact: item.ruta === '/panel' }"
              (click)="cerrarMenu()"
            >
              {{ item.etiqueta }}
            </a>
          }
        </nav>
      </aside>
      <div class="contenido">
        <header class="encabezado">
          <div class="encabezado-izquierda">
            <button
              #botonMenu
              type="button"
              class="boton-menu"
              (click)="alternarMenu()"
              [attr.aria-expanded]="menuAbierto()"
              aria-controls="menu-lateral"
              aria-label="Abrir menú"
            >
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true">
                <line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                <line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                <line x1="3" y1="18" x2="21" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
              </svg>
            </button>
            @if (usuario(); as usuario) {
              <div class="usuario">
                <span class="nombre">{{ usuario.nombre }}</span>
                <span class="rol">{{ nombreRol(usuario.rol) }}</span>
              </div>
            }
          </div>
          <div class="acciones">
            <button
              type="button"
              class="boton-tema"
              (click)="themeService.alternarTema()"
              [attr.aria-label]="textoTema()"
              [attr.title]="textoTema()"
            >
              @if (themeService.tema() === 'dark') {
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
                  <circle cx="12" cy="12" r="4.5" stroke="currentColor" stroke-width="2" />
                  <line x1="12" y1="2" x2="12" y2="4.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                  <line x1="12" y1="19.5" x2="12" y2="22" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                  <line x1="2" y1="12" x2="4.5" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                  <line x1="19.5" y1="12" x2="22" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                  <line x1="4.9" y1="4.9" x2="6.6" y2="6.6" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                  <line x1="17.4" y1="17.4" x2="19.1" y2="19.1" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                  <line x1="4.9" y1="19.1" x2="6.6" y2="17.4" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                  <line x1="17.4" y1="6.6" x2="19.1" y2="4.9" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                </svg>
              } @else {
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
                  <path
                    d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              }
            </button>
            <button type="button" class="cerrar-sesion" (click)="cerrarSesion()" aria-label="Cerrar sesión">
              <span class="texto-largo">Cerrar sesión</span>
              <span class="texto-corto" aria-hidden="true">Salir</span>
            </button>
          </div>
        </header>
        <main class="area-trabajo">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
      min-height: 100dvh;
    }
    .panel-layout {
      display: grid;
      grid-template-columns: 220px 1fr;
      min-height: 100dvh;
      background: var(--color-fondo);
    }
    .fondo-oscuro {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 40;
    }
    .menu {
      display: flex;
      flex-direction: column;
      gap: var(--espacio-4);
      padding: var(--espacio-5) var(--espacio-4);
      background: var(--color-menu-fondo);
    }
    .menu-titulo {
      margin: 0 0 var(--espacio-2);
      color: var(--color-menu-texto);
      font-size: var(--texto-lg);
      font-weight: 600;
    }
    nav {
      display: grid;
      gap: var(--espacio-1);
    }
    nav a {
      position: relative;
      padding: var(--espacio-3) var(--espacio-4);
      border-radius: var(--radio-sm);
      color: var(--color-menu-texto-suave);
      text-decoration: none;
      font-weight: 600;
      font-size: var(--texto-sm);
    }
    nav a:hover {
      background: var(--color-menu-activo);
      color: var(--color-menu-texto);
    }
    nav a:focus-visible {
      outline: 2px solid var(--color-menu-texto);
      outline-offset: 2px;
    }
    nav a.activo {
      background: var(--color-menu-activo);
      color: var(--color-menu-texto);
    }
    nav a.activo::before {
      content: '';
      position: absolute;
      inset: 0 auto 0 0;
      width: 3px;
      border-radius: 0 var(--radio-sm) var(--radio-sm) 0;
      background: var(--color-primario);
    }
    .contenido {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
    .encabezado {
      position: sticky;
      top: 0;
      z-index: 10;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--espacio-3);
      padding: var(--espacio-3) var(--espacio-5);
      border-bottom: 1px solid var(--color-borde);
      background: var(--color-superficie);
    }
    .encabezado-izquierda {
      display: flex;
      align-items: center;
      gap: var(--espacio-3);
      min-width: 0;
    }
    .boton-menu {
      display: none;
      align-items: center;
      justify-content: center;
      min-width: 40px;
      min-height: 40px;
      padding: 0;
      border: 1px solid var(--color-borde);
      border-radius: var(--radio-sm);
      background: var(--color-superficie);
      color: var(--color-texto);
      cursor: pointer;
      flex-shrink: 0;
    }
    .boton-menu:hover {
      background: var(--color-fondo);
    }
    .usuario {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
    .usuario .nombre {
      font-weight: 700;
      font-size: var(--texto-base);
      color: var(--color-texto);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .usuario .rol {
      font-size: var(--texto-xs);
      color: var(--color-texto-suave);
    }
    .acciones {
      display: flex;
      align-items: center;
      gap: var(--espacio-2);
      flex-shrink: 0;
    }
    .boton-tema {
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 40px;
      min-height: 40px;
      padding: 0;
      border: 1px solid var(--color-borde);
      border-radius: var(--radio-sm);
      background: var(--color-superficie);
      color: var(--color-texto);
      cursor: pointer;
    }
    .boton-tema:hover {
      background: var(--color-fondo);
    }
    .cerrar-sesion {
      min-height: 40px;
      padding: 0 var(--espacio-4);
      border: 1px solid var(--color-borde);
      border-radius: var(--radio-sm);
      background: var(--color-superficie);
      color: var(--color-texto);
      font: inherit;
      font-weight: 700;
      cursor: pointer;
    }
    .cerrar-sesion:hover {
      background: var(--color-fondo);
    }
    .texto-corto {
      display: none;
    }
    .area-trabajo {
      flex: 1;
      width: 100%;
      max-width: 1100px;
      margin-inline: auto;
      padding: var(--espacio-6) var(--espacio-5);
      box-sizing: border-box;
    }

    @media (max-width: 767px) {
      .panel-layout {
        grid-template-columns: 1fr;
      }
      .boton-menu {
        display: flex;
      }
      .menu {
        position: fixed;
        inset: 0 auto 0 0;
        width: min(82vw, 300px);
        z-index: 50;
        transform: translateX(-100%);
        transition: transform 0.25s ease;
        overflow-y: auto;
      }
      .menu.abierto {
        transform: translateX(0);
      }
      .usuario {
        max-width: 40vw;
      }
      .cerrar-sesion {
        padding: 0 var(--espacio-3);
      }
      .texto-largo {
        display: none;
      }
      .texto-corto {
        display: inline;
      }
      .area-trabajo {
        padding: var(--espacio-4);
      }
    }
  `,
})
export class PanelLayoutComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly themeService = inject(ThemeService);

  private readonly botonMenuRef = viewChild<ElementRef<HTMLButtonElement>>('botonMenu');

  readonly items = ITEMS_MENU;
  usuario = signal<UsuarioAutenticado | null>(null);
  menuAbierto = signal(false);

  readonly textoTema = computed(() =>
    this.themeService.tema() === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro',
  );

  ngOnInit(): void {
    this.auth.obtenerUsuario().subscribe({
      next: (usuario) => this.usuario.set(usuario),
      error: () => this.usuario.set(null),
    });
  }

  nombreRol(rol: UsuarioAutenticado['rol']): string {
    return NOMBRES_ROL[rol] ?? rol;
  }

  alternarMenu(): void {
    this.menuAbierto.set(!this.menuAbierto());
  }

  cerrarMenu(): void {
    if (!this.menuAbierto()) {
      return;
    }
    this.menuAbierto.set(false);
    this.botonMenuRef()?.nativeElement.focus();
  }

  @HostListener('document:keydown.escape')
  alPresionarEscape(): void {
    this.cerrarMenu();
  }

  cerrarSesion(): void {
    this.auth.cerrarSesion();
    this.router.navigate(['/login']);
  }
}
