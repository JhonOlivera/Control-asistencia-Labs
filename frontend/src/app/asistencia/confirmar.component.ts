import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { timeout } from 'rxjs';
import { apiUrl } from '../core/environment';

type EstadoAsistencia = 'PRESENTE' | 'TARDE' | 'AUSENTE' | 'JUSTIFICADO';

interface AsistenciaResponseDto {
  nombreEstudiante: string;
  laboratorio: string;
  estadoRegistrado: EstadoAsistencia;
  horaRegistro: string;
  mensaje: string;
}

const MENSAJE_ERROR_GENERICO =
  'No se pudo registrar la asistencia. Verifica tu conexión e intenta de nuevo.';

@Component({
  selector: 'app-confirmar',
  template: `
    <main class="confirmacion" aria-live="polite">
      @if (status() === 'loading') {
        <p class="mensaje-carga">Registrando asistencia...</p>
      } @else if (status() === 'success' && resultado()) {
        <section class="tarjeta">
          <h1 class="titulo exito">Asistencia registrada</h1>
          <p class="estudiante">{{ resultado()!.nombreEstudiante }}</p>
          <span class="badge" [class.tarde]="resultado()!.estadoRegistrado === 'TARDE'">
            {{ resultado()!.estadoRegistrado }}
          </span>
          <dl class="detalle">
            <div class="fila">
              <dt>Laboratorio</dt>
              <dd>{{ resultado()!.laboratorio }}</dd>
            </div>
            <div class="fila">
              <dt>Hora</dt>
              <dd>{{ horaFormateada() }}</dd>
            </div>
          </dl>
        </section>
      } @else {
        <section class="tarjeta">
          <h1 class="titulo falla">No se pudo registrar</h1>
          <p class="mensaje-error">{{ mensajeError() }}</p>
        </section>
      }
    </main>
  `,
  styles: `
    :host { display: block; min-height: 100dvh; }
    .confirmacion {
      display: grid;
      min-height: 100dvh;
      box-sizing: border-box;
      place-items: center;
      padding: 24px 16px;
      background: var(--color-fondo);
      font-family: "Trebuchet MS", sans-serif;
      text-align: center;
      color: var(--color-texto);
    }
    .mensaje-carga {
      font-size: clamp(20px, 5vw, 28px);
      color: var(--color-texto-suave);
      margin: 0;
    }
    .tarjeta {
      width: 100%;
      max-width: 420px;
      box-sizing: border-box;
      background: var(--color-superficie);
      border: 1px solid var(--color-borde);
      border-radius: 16px;
      padding: 32px 24px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
    }
    .titulo {
      margin: 0 0 8px;
      font-size: clamp(24px, 6vw, 32px);
      line-height: 1.15;
    }
    .titulo.exito { color: var(--color-primario); }
    .titulo.falla { color: var(--color-error); }
    .estudiante {
      margin: 0 0 16px;
      font-size: clamp(16px, 4vw, 19px);
      color: var(--color-texto);
    }
    .badge {
      display: inline-block;
      padding: 6px 16px;
      border-radius: 999px;
      font-weight: bold;
      font-size: 14px;
      letter-spacing: 0.04em;
      background: var(--color-primario-suave);
      color: var(--color-primario);
    }
    .badge.tarde {
      background: var(--color-advertencia-suave);
      color: var(--color-advertencia);
    }
    .detalle {
      margin: 24px 0 0;
      text-align: left;
    }
    .fila {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      padding: 10px 0;
      border-top: 1px solid var(--color-borde);
      font-size: clamp(14px, 3.5vw, 16px);
    }
    .fila dt { color: var(--color-texto-suave); margin: 0; }
    .fila dd { margin: 0; font-weight: bold; text-align: right; }
    .mensaje-error {
      margin: 0;
      font-size: clamp(15px, 4vw, 17px);
      color: var(--color-texto);
    }
  `,
})
export class ConfirmarComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly http = inject(HttpClient);

  status = signal<'loading' | 'success' | 'error'>('loading');
  resultado = signal<AsistenciaResponseDto | null>(null);
  mensajeError = signal<string>(MENSAJE_ERROR_GENERICO);

  horaFormateada(): string {
    const dto = this.resultado();
    if (!dto) {
      return '';
    }
    const fecha = new Date(dto.horaRegistro);
    if (Number.isNaN(fecha.getTime())) {
      return '';
    }
    return fecha.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  }

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const token = params.get('token');
      if (!token) {
        this.status.set('error');
        this.mensajeError.set('El enlace no incluye un token de asistencia válido.');
        return;
      }

      this.status.set('loading');
      this.http
        .get<AsistenciaResponseDto>(`${apiUrl}/asistencia/marcar?token=${encodeURIComponent(token)}`)
        .pipe(timeout(10_000))
        .subscribe({
          next: (respuesta) => {
            this.resultado.set(respuesta);
            this.status.set('success');
          },
          error: (error: unknown) => {
            this.mensajeError.set(this.extraerMensajeError(error));
            this.status.set('error');
          },
        });
    });
  }

  private extraerMensajeError(error: unknown): string {
    if (error instanceof HttpErrorResponse && typeof error.error?.message === 'string') {
      return error.error.message;
    }
    return MENSAJE_ERROR_GENERICO;
  }
}
