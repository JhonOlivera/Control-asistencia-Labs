import { Component } from '@angular/core';

@Component({
  selector: 'app-en-construccion',
  template: `
    <section class="en-construccion">
      <h1>En construcción</h1>
      <p>Esta sección estará disponible próximamente.</p>
    </section>
  `,
  styles: `
    .en-construccion { display: grid; gap: 8px; place-items: start; }
    h1 { margin: 0; font-size: 26px; color: var(--color-texto); }
    p { margin: 0; color: var(--color-texto-suave); }
  `,
})
export class EnConstruccionComponent {}
