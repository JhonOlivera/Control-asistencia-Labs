import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-callback',
  template: `
    <main class="callback" aria-live="polite">
      <p>Iniciando sesión...</p>
    </main>
  `,
  styles: `
    :host { display: block; min-height: 100dvh; }
    .callback { display: grid; min-height: 100dvh; place-items: center; background: #f4f5ef; color: #172b2a; font-family: "Trebuchet MS", sans-serif; font-size: 20px; }
  `,
})
export class CallbackComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.router.navigate(['/login'], { queryParams: { error: 'fallo_google' }, replaceUrl: true });
      return;
    }

    this.auth.guardarToken(token);
    // replaceUrl evita que el token quede en el historial del navegador.
    this.router.navigate(['/panel'], { replaceUrl: true });
  }
}
