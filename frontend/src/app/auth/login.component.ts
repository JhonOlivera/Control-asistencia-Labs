import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  template: `
    <main class="login-page">
      <form class="login-form" (ngSubmit)="submit()">
        <p class="eyebrow">Control de asistencia</p>
        <h1>Iniciar sesión</h1>

        <label for="role">Rol</label>
        <select id="role" name="role" [(ngModel)]="role" required>
          <option value="Administrador">Administrador</option>
          <option value="Docente">Docente</option>
        </select>

        <label for="email">Correo</label>
        <input id="email" name="email" type="email" [(ngModel)]="email" autocomplete="username" required />

        <label for="password">Contraseña</label>
        <input
          id="password"
          name="password"
          type="password"
          [(ngModel)]="password"
          autocomplete="current-password"
          required
        />

        <button type="submit">Continuar</button>
      </form>
    </main>
  `,
  styles: `
    :host { display: block; min-height: 100dvh; color: #172b2a; font-family: "Trebuchet MS", sans-serif; }
    .login-page { display: grid; min-height: 100dvh; place-items: center; padding: 24px; box-sizing: border-box; background: radial-gradient(ellipse at 85% 12%, #d8ebe3 0, transparent 34%), #f4f5ef; }
    .login-form { display: grid; width: min(100%, 390px); gap: 12px; padding: 36px; border: 1px solid #d5dfd8; border-radius: 8px; background: #fff; box-shadow: 0 20px 55px #193c3014; }
    .eyebrow { margin: 0; color: #527c68; font-size: 12px; font-weight: 700; text-transform: uppercase; }
    h1 { margin: 0 0 12px; font-size: 30px; }
    label { margin-top: 6px; font-size: 14px; font-weight: 700; }
    input, select { box-sizing: border-box; width: 100%; min-height: 44px; padding: 10px 12px; border: 1px solid #b9c9c0; border-radius: 4px; background: #fff; color: inherit; font: inherit; }
    input:focus, select:focus { outline: 2px solid #378263; outline-offset: 1px; }
    button { min-height: 46px; margin-top: 12px; border: 0; border-radius: 4px; background: #176b50; color: white; font: inherit; font-weight: 700; cursor: pointer; }
    button:hover { background: #10563f; }
    @media (max-width: 480px) { .login-form { padding: 26px 22px; } }
  `,
})
export class LoginComponent {
  email = '';
  password = '';
  role = 'Administrador';

  submit(): void {
    console.log({ email: this.email, password: this.password, role: this.role });
  }
}