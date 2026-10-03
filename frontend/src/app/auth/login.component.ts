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
    :host { display: block; min-height: 100dvh; color: #172b2a; font-family: "Trebuchet MS", sans-serif; }
    .login-page { display: grid; min-height: 100dvh; place-items: center; padding: 24px; box-sizing: border-box; background: radial-gradient(ellipse at 85% 12%, #d8ebe3 0, transparent 34%), #f4f5ef; }
    .login-form { display: grid; width: min(100%, 390px); gap: 12px; padding: 36px; border: 1px solid #d5dfd8; border-radius: 8px; background: #fff; box-shadow: 0 20px 55px #193c3014; }
    .eyebrow { margin: 0; color: #527c68; font-size: 12px; font-weight: 700; text-transform: uppercase; }
    h1 { margin: 0; font-size: 30px; }
    .ayuda { margin: 0 0 8px; color: #527c68; font-size: 14px; }
    .error { margin: 0; padding: 12px; border: 1px solid #e3b8b2; border-radius: 4px; background: #fbeeec; color: #9b392f; font-size: 14px; }
    .google { display: grid; place-items: center; min-height: 46px; margin-top: 8px; border-radius: 4px; background: #176b50; color: white; font-weight: 700; text-decoration: none; }
    .google:hover { background: #10563f; }
    .google:focus-visible { outline: 2px solid #378263; outline-offset: 2px; }
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
