import { AfterViewInit, Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';

let contadorDialogos = 0;

@Component({
  selector: 'app-confirmacion-dialog',
  template: `
    <div class="fondo" (click)="onFondoClick($event)">
      <div
        class="dialogo"
        role="alertdialog"
        aria-modal="true"
        [attr.aria-labelledby]="idTitulo"
        (keydown.escape)="cancelar.emit()"
        (keydown.tab)="onTab($event)"
        #contenedor
      >
        <h2 [id]="idTitulo">{{ titulo }}</h2>

        @if (detalles.length > 0) {
          <ul class="detalles">
            @for (linea of detalles; track linea) {
              <li>{{ linea }}</li>
            }
          </ul>
        }

        <p class="advertencia">{{ advertencia }}</p>

        <div class="acciones">
          <button
            type="button"
            class="btn btn--secundario"
            #botonCancelar
            (click)="cancelar.emit()"
          >
            Cancelar
          </button>
          <button
            type="button"
            class="btn btn--peligro"
            [disabled]="confirmando"
            (click)="confirmar.emit()"
          >
            {{ confirmando ? 'Eliminando...' : textoConfirmar }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: `
    .fondo {
      position: fixed;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--espacio-4);
      background: rgba(10, 18, 38, 0.5);
      z-index: 100;
    }
    .dialogo {
      display: grid;
      gap: var(--espacio-4);
      width: 100%;
      max-width: 420px;
      padding: var(--espacio-5);
      border-radius: var(--radio-md);
      background: var(--color-superficie);
      box-shadow: var(--sombra-md);
    }
    h2 {
      margin: 0;
      font-size: var(--texto-lg);
      color: var(--color-texto);
    }
    .detalles {
      margin: 0;
      padding: 0;
      list-style: none;
      display: grid;
      gap: var(--espacio-1);
      color: var(--color-texto);
      font-size: var(--texto-sm);
    }
    .advertencia {
      margin: 0;
      color: var(--color-error);
      font-size: var(--texto-sm);
      font-weight: 600;
    }
    .acciones {
      display: flex;
      justify-content: flex-end;
      gap: var(--espacio-3);
    }
    @media (max-width: 480px) {
      .acciones {
        flex-direction: column-reverse;
      }
      .acciones .btn {
        width: 100%;
      }
    }
  `,
})
export class ConfirmacionDialogComponent implements AfterViewInit {
  @Input() titulo = '¿Eliminar?';
  @Input() detalles: string[] = [];
  @Input() advertencia = 'Esta acción no se puede deshacer.';
  @Input() textoConfirmar = 'Eliminar';
  @Input() confirmando = false;

  @Output() confirmar = new EventEmitter<void>();
  @Output() cancelar = new EventEmitter<void>();

  @ViewChild('contenedor') private contenedor?: ElementRef<HTMLElement>;
  @ViewChild('botonCancelar') private botonCancelar?: ElementRef<HTMLButtonElement>;

  readonly idTitulo = `confirmacion-dialog-titulo-${contadorDialogos++}`;

  ngAfterViewInit(): void {
    this.botonCancelar?.nativeElement.focus();
  }

  onFondoClick(evento: MouseEvent): void {
    if (evento.target === evento.currentTarget) {
      this.cancelar.emit();
    }
  }

  onTab(evento: Event): void {
    const eventoTeclado = evento as KeyboardEvent;
    const contenedor = this.contenedor?.nativeElement;
    if (!contenedor) {
      return;
    }
    const focables = contenedor.querySelectorAll<HTMLElement>('button');
    if (focables.length === 0) {
      return;
    }
    const primero = focables[0];
    const ultimo = focables[focables.length - 1];

    if (eventoTeclado.shiftKey && document.activeElement === primero) {
      evento.preventDefault();
      ultimo.focus();
    } else if (!eventoTeclado.shiftKey && document.activeElement === ultimo) {
      evento.preventDefault();
      primero.focus();
    }
  }
}
