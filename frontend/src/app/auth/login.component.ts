import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';
import { googleLoginUrl } from '../core/environment';

const MENSAJES_ERROR: Record<string, string> = {
  no_autorizado:
    'Tu correo no está registrado como Administrador o Docente. Pide al encargado del laboratorio que te registre.',
  fallo_google: 'No se pudo iniciar sesión con Google. Intenta de nuevo.',
};

@Component({
  selector: 'app-login',
  template: `
    <main class="login-page">
      <section class="card login-form">
        <h1>Ingresar al sistema</h1>
        <p class="subtitulo">Control de Asistencia · Laboratorios Unibagué</p>

        @if (mensajeError(); as mensaje) {
          <p class="mensaje-error" role="alert">{{ mensaje }}</p>
        }

        <a class="btn btn--secundario btn-google" [href]="googleLoginUrl">
          <svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"
            />
            <path
              fill="#34A853"
              d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"
            />
            <path
              fill="#FBBC05"
              d="M11.69 28.18A13.9 13.9 0 0 1 10.9 24c0-1.45.25-2.86.69-4.18v-5.7H4.34A21.93 21.93 0 0 0 2 24c0 3.55.85 6.91 2.34 9.88l7.35-5.7z"
            />
            <path
              fill="#EA4335"
              d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"
            />
          </svg>
          <span>Continuar con Google</span>
        </a>

        <div class="divisor"><span>o con tu correo institucional</span></div>

        <form class="formulario-proximamente">
          <label>
            Correo institucional
            <input type="email" disabled placeholder="nombre@estudiantesunibague.edu.co" />
          </label>
          <label>
            Contraseña
            <input type="password" disabled placeholder="••••••••" />
          </label>
          <button type="button" class="btn" disabled>Iniciar sesión</button>
        </form>

        <p class="nota">Próximamente: acceso con correo y contraseña. Por ahora, ingresa con Google.</p>
      </section>
    </main>
  `,
  styles: `
    :host {
      display: block;
      min-height: 100dvh;
    }
    .login-page {
      display: grid;
      min-height: 100dvh;
      place-items: center;
      padding: var(--espacio-5);
      box-sizing: border-box;
      background: var(--color-fondo);
    }
    .login-form {
      display: grid;
      width: min(100%, 420px);
      box-sizing: border-box;
      gap: var(--espacio-3);
      padding: var(--espacio-6);
      box-shadow: var(--sombra-md);
    }
    h1 {
      margin: 0;
      font-size: var(--texto-2xl);
      color: var(--color-texto);
    }
    .subtitulo {
      margin: 0 0 var(--espacio-2);
      color: var(--color-texto-suave);
      font-size: var(--texto-sm);
    }
    .login-form .btn {
      width: 100%;
      min-height: 46px;
    }
    .btn-google {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--espacio-2);
    }
    .btn-google svg {
      flex-shrink: 0;
    }
    .divisor {
      display: flex;
      align-items: center;
      gap: var(--espacio-3);
      margin: var(--espacio-2) 0;
      color: var(--color-texto-suave);
      font-size: var(--texto-xs);
    }
    .divisor::before,
    .divisor::after {
      content: '';
      flex: 1;
      height: 1px;
      background: var(--color-borde);
    }
    .formulario-proximamente {
      display: grid;
      gap: var(--espacio-3);
    }
    .formulario-proximamente label {
      display: grid;
      gap: var(--espacio-1);
      color: var(--color-texto);
      font-weight: 600;
      font-size: var(--texto-sm);
    }
    .formulario-proximamente input {
      min-height: 40px;
      width: 100%;
      box-sizing: border-box;
      padding: 0 var(--espacio-3);
      border: 1px solid var(--color-borde);
      border-radius: var(--radio-sm);
      background: var(--color-superficie);
      color: var(--color-texto);
      font: inherit;
    }
    .formulario-proximamente input:disabled {
      background: var(--color-fondo);
      color: var(--color-texto-suave);
      cursor: not-allowed;
    }
    .nota {
      margin: 0;
      color: var(--color-texto-suave);
      font-size: var(--texto-xs);
      text-align: center;
    }
    @media (max-width: 480px) {
      .login-form {
        padding: var(--espacio-4);
      }
    }
  `,
})
export class LoginComponent {
  private readonly route = inject(ActivatedRoute);

  readonly googleLoginUrl = googleLoginUrl;

  private readonly error = toSignal(this.route.queryParamMap.pipe(map((params) => params.get('error'))));
  readonly mensajeError = computed(() => {
    const error = this.error();
    return error ? (MENSAJES_ERROR[error] ?? MENSAJES_ERROR['fallo_google']) : null;
  });
}
