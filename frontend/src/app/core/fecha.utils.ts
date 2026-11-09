const PATRON_FECHA_HORA =
  /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?/;

function construirFechaUtc(valor: string): Date | null {
  const coincidencia = valor.match(PATRON_FECHA_HORA);
  if (!coincidencia) {
    return null;
  }
  const [, anio, mes, dia, hora = '0', minuto = '0', segundo = '0'] = coincidencia;
  const fecha = new Date(
    Date.UTC(Number(anio), Number(mes) - 1, Number(dia), Number(hora), Number(minuto), Number(segundo)),
  );
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

function diaMes(fecha: Date, conAnio: boolean): string {
  const opciones: Intl.DateTimeFormatOptions = conAnio
    ? { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }
    : { day: 'numeric', month: 'short', timeZone: 'UTC' };
  const partes = new Intl.DateTimeFormat('es-CO', opciones).formatToParts(fecha);
  const dia = partes.find((p) => p.type === 'day')?.value ?? '';
  const mes = partes.find((p) => p.type === 'month')?.value ?? '';
  const anio = partes.find((p) => p.type === 'year')?.value;
  return anio ? `${dia} ${mes} ${anio}` : `${dia} ${mes}`;
}

function horaCorta(fecha: Date): string {
  return new Intl.DateTimeFormat('es-CO', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'UTC',
  }).format(fecha);
}

/** "9 nov, 10:09 a. m." a partir de un timestamp tipo "2026-11-09T10:09:47.508171". */
export function formatearFechaHoraCorta(iso: string | null): string {
  if (!iso) {
    return '—';
  }
  const fecha = construirFechaUtc(iso);
  if (!fecha) {
    return '—';
  }
  return `${diaMes(fecha, false)}, ${horaCorta(fecha)}`;
}

/** "9 nov 2026, 10:05 a. m." a partir de fecha "2026-11-09" y hora "10:05:00" sueltas. */
export function formatearEncabezadoFechaHora(fecha: string, hora: string): string {
  const combinada = construirFechaUtc(`${fecha}T${hora}`);
  if (!combinada) {
    return `${fecha} ${hora}`;
  }
  return `${diaMes(combinada, true)}, ${horaCorta(combinada)}`;
}

/** "9 nov 2026" a partir de "2026-11-09". */
export function formatearFechaCorta(fecha: string): string {
  const construida = construirFechaUtc(fecha);
  return construida ? diaMes(construida, true) : fecha;
}

/** "10:05 a. m." a partir de "10:05:00". */
export function formatearHoraCorta(hora: string): string {
  const construida = construirFechaUtc(`1970-01-01T${hora}`);
  return construida ? horaCorta(construida) : hora;
}
