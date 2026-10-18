import { Injectable, signal } from '@angular/core';

export type Tema = 'light' | 'dark';

const CLAVE_ALMACENAMIENTO = 'tema';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly tema = signal<Tema>(this.resolverTemaInicial());

  alternarTema(): void {
    this.aplicarTema(this.tema() === 'dark' ? 'light' : 'dark');
  }

  private aplicarTema(tema: Tema): void {
    document.documentElement.setAttribute('data-theme', tema);
    try {
      localStorage.setItem(CLAVE_ALMACENAMIENTO, tema);
    } catch {
      // Almacenamiento no disponible (p. ej. modo privado); el tema solo dura la sesión.
    }
    this.tema.set(tema);
  }

  private resolverTemaInicial(): Tema {
    const atributoActual = document.documentElement.getAttribute('data-theme');
    if (atributoActual === 'dark' || atributoActual === 'light') {
      return atributoActual;
    }

    return this.leerTemaGuardado() ?? 'light';
  }

  private leerTemaGuardado(): Tema | null {
    try {
      const valor = localStorage.getItem(CLAVE_ALMACENAMIENTO);
      return valor === 'dark' || valor === 'light' ? valor : null;
    } catch {
      return null;
    }
  }
}
