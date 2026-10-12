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
      <section class="login-form">
        <p class="eyebrow">Control de asistencia</p>
        <h1>Iniciar sesión</h1>
        <p class="ayuda">Acceso para administradores y docentes.</p>

        @if (mensajeError(); as mensaje) {
          <p class="error" role="alert">{{ mensaje }}</p>
        }

        <a class="google" [href]="googleLoginUrl">Continuar con Google</a>
      </section>
    </main>
  `,
  styles: `
    :host { display: block; min-height: 100dvh; color: var(--color-texto); font-family: "Trebuchet MS", sans-serif; }
    .login-page { display: grid; min-height: 100dvh; place-items: center; padding: 24px; box-sizing: border-box; background: radial-gradient(ellipse at 85% 12%, var(--color-primario-suave) 0, transparent 34%), var(--color-fondo); }
    .login-form { display: grid; width: min(100%, 390px); gap: 12px; padding: 36px; border: 1px solid var(--color-borde); border-radius: 8px; background: var(--color-superficie); box-shadow: 0 20px 55px rgba(0, 0, 0, 0.08); }
    .eyebrow { margin: 0; color: var(--color-texto-suave); font-size: 12px; font-weight: 700; text-transform: uppercase; }
    h1 { margin: 0; font-size: 30px; }
    .ayuda { margin: 0 0 8px; color: var(--color-texto-suave); font-size: 14px; }
    .error { margin: 0; padding: 12px; border: 1px solid var(--color-error); border-radius: 4px; background: var(--color-error-suave); color: var(--color-error); font-size: 14px; }
    .google { display: grid; place-items: center; min-height: 46px; margin-top: 8px; border-radius: 4px; background: var(--color-primario); color: var(--color-sobre-primario); font-weight: 700; text-decoration: none; }
    .google:hover { filter: brightness(0.9); }
    .google:focus-visible { outline: 2px solid var(--color-primario); outline-offset: 2px; }
    @media (max-width: 480px) { .login-form { padding: 26px 22px; } }
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
