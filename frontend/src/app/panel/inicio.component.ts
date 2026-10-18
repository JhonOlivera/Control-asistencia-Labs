import { Component, OnInit, inject, signal } from '@angular/core';
import { AuthService, UsuarioAutenticado } from '../core/auth.service';

@Component({
  selector: 'app-inicio',
  template: `
    <section class="inicio">
      @if (usuario(); as usuario) {
        <h1>Hola, {{ usuario.nombre }}</h1>
        <p>Bienvenido al panel de control de asistencia.</p>
      } @else if (error()) {
        <p class="mensaje-error" role="alert">No se pudo cargar tu información.</p>
      } @else {
        <p class="cargando">Cargando...</p>
      }
    </section>
  `,
  styles: `
    .inicio {
      display: grid;
      gap: var(--espacio-2);
    }
    h1 {
      margin: 0;
      font-size: var(--texto-xl);
      color: var(--color-texto);
    }
    p {
      margin: 0;
      color: var(--color-texto-suave);
    }
  `,
})
export class InicioComponent implements OnInit {
  private readonly auth = inject(AuthService);

  usuario = signal<UsuarioAutenticado | null>(null);
  error = signal(false);

  ngOnInit(): void {
    this.auth.obtenerUsuario().subscribe({
      next: (usuario) => this.usuario.set(usuario),
      error: () => this.error.set(true),
    });
  }
}
