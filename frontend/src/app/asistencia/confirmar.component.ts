import { HttpClient } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { apiUrl } from '../core/environment';

@Component({
  selector: 'app-confirmar',
  template: `
    <main class="confirmation" aria-live="polite">
      @if (status === 'loading') {
        <p class="message">Verificando asistencia...</p>
      } @else if (status === 'success') {
        <h1 class="message success">Asistencia registrada</h1>
      } @else {
        <h1 class="message failure">No se pudo registrar, el enlace puede haber expirado</h1>
      }
    </main>
  `,
  styles: `
    :host { display: block; min-height: 100dvh; }
    .confirmation { display: grid; min-height: 100dvh; box-sizing: border-box; place-items: center; padding: 24px; background: #f4f5ef; font-family: "Trebuchet MS", sans-serif; text-align: center; }
    .message { max-width: 760px; margin: 0; font-size: clamp(30px, 7vw, 56px); line-height: 1.12; }
    .success { color: #176b50; }
    .failure { color: #9b392f; }
  `,
})
export class ConfirmarComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly http = inject(HttpClient);

  status: 'loading' | 'success' | 'error' = 'loading';

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const token = params.get('token');
      if (!token) {
        this.status = 'error';
        return;
      }

      this.status = 'loading';
      this.http
        .get(`${apiUrl}/asistencia/marcar?token=${encodeURIComponent(token)}`)
        .subscribe({
          next: () => (this.status = 'success'),
          error: () => (this.status = 'error'),
        });
    });
  }
}