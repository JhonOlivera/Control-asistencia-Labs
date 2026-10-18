import { Component } from '@angular/core';

@Component({
  selector: 'app-en-construccion',
  template: `
    <section class="estado-vacio en-construccion">
      <h1>Estudiantes</h1>
      <p>Esta sección está en construcción. Muy pronto podrás gestionar aquí los estudiantes registrados.</p>
    </section>
  `,
  styles: `
    .en-construccion {
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
    }
  `,
})
export class EnConstruccionComponent {}
