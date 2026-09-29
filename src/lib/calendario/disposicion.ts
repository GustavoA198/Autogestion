// Reparto de reuniones por día local, posición en la cuadrícula horaria y solapamientos en columnas.
import {
  claveDia,
  compararDias,
  inicioDelDia,
  minutosDelDia,
  sumarDias,
  type DiaCivil,
} from "./fechas";
import { diasDeDiaCompleto } from "./formato";

export const MINUTOS_DIA = 1440;
export const MINUTOS_MINIMOS_VISUALES = 30;

export type ReunionTiempo = { inicio: Date | string; fin: Date | string; diaCompleto: boolean };

// Tramo de una reunión con hora dentro de un día; si cruza medianoche genera un tramo por día
export type TramoDia<T> = {
  reunion: T;
  dia: DiaCivil;
  inicioMin: number;
  finMin: number;
  continuaAntes: boolean;
  continuaDespues: boolean;
};

export type ReunionesDelDia<T> = {
  dia: DiaCivil;
  clave: string;
  todoElDia: T[];
  conHora: TramoDia<T>[];
};

export type TramoColocado<T> = TramoDia<T> & {
  columna: number;
  columnas: number;
  ocupa: number;
  visualFin: number;
};

// Reparte las reuniones entre los días indicados usando la zona horaria; el orden de entrada se conserva
export function reunionesPorDia<T extends ReunionTiempo>(
  reuniones: readonly T[],
  dias: readonly DiaCivil[],
  zona: string,
): ReunionesDelDia<T>[] {
  const tiempos = reuniones.map((reunion) => ({
    reunion,
    inicio: new Date(reunion.inicio).getTime(),
    fin: new Date(reunion.fin).getTime(),
    diasCompletos: reunion.diaCompleto ? diasDeDiaCompleto(reunion) : null,
  }));

  return dias.map((dia) => {
    const inicioDia = inicioDelDia(dia, zona).getTime();
    const finDia = inicioDelDia(sumarDias(dia, 1), zona).getTime();
    const resultado: ReunionesDelDia<T> = { dia, clave: claveDia(dia), todoElDia: [], conHora: [] };

    for (const t of tiempos) {
      if (t.diasCompletos) {
        const { desde, hasta } = t.diasCompletos;
        if (compararDias(dia, desde) >= 0 && compararDias(dia, hasta) < 0) {
          resultado.todoElDia.push(t.reunion);
        }
        continue;
      }
      const fin = Math.max(t.fin, t.inicio);
      const tocaElDia =
        t.inicio < finDia && (fin > inicioDia || (fin === t.inicio && t.inicio >= inicioDia));
      if (!tocaElDia) continue;

      const inicioMin = t.inicio <= inicioDia ? 0 : minutosDelDia(t.inicio, zona);
      const finMin = fin >= finDia ? MINUTOS_DIA : minutosDelDia(fin, zona);
      resultado.conHora.push({
        reunion: t.reunion,
        dia,
        inicioMin,
        finMin: Math.max(finMin, inicioMin),
        continuaAntes: t.inicio < inicioDia,
        continuaDespues: fin > finDia,
      });
    }
    return resultado;
  });
}

function finVisual(tramo: { inicioMin: number; finMin: number }): number {
  const conMinimo = Math.max(tramo.finMin, tramo.inicioMin + MINUTOS_MINIMOS_VISUALES);
  return Math.min(conMinimo, MINUTOS_DIA);
}

// Coloca los tramos de un mismo día en columnas: los que se pisan comparten ancho y los libres se expanden
export function disponerColumnas<T>(tramos: readonly TramoDia<T>[]): TramoColocado<T>[] {
  const ordenados = tramos
    .map((tramo, indice) => ({ tramo, indice, visualFin: finVisual(tramo) }))
    .sort(
      (a, b) =>
        a.tramo.inicioMin - b.tramo.inicioMin ||
        b.visualFin - b.tramo.inicioMin - (a.visualFin - a.tramo.inicioMin) ||
        a.indice - b.indice,
    );

  const colocados: TramoColocado<T>[] = [];
  let grupo: { tramo: TramoDia<T>; visualFin: number; columna: number }[] = [];
  let finesColumna: number[] = [];
  let finGrupo = -1;

  const cerrarGrupo = () => {
    const columnas = finesColumna.length;
    for (const actual of grupo) {
      let ocupa = 1;
      for (let c = actual.columna + 1; c < columnas; c++) {
        const chocaConColumna = grupo.some(
          (otro) =>
            otro.columna === c &&
            otro.tramo.inicioMin < actual.visualFin &&
            otro.visualFin > actual.tramo.inicioMin,
        );
        if (chocaConColumna) break;
        ocupa++;
      }
      colocados.push({
        ...actual.tramo,
        columna: actual.columna,
        columnas,
        ocupa,
        visualFin: actual.visualFin,
      });
    }
    grupo = [];
    finesColumna = [];
    finGrupo = -1;
  };

  for (const { tramo, visualFin } of ordenados) {
    if (grupo.length > 0 && tramo.inicioMin >= finGrupo) cerrarGrupo();
    let columna = finesColumna.findIndex((fin) => fin <= tramo.inicioMin);
    if (columna === -1) columna = finesColumna.length;
    finesColumna[columna] = visualFin;
    grupo.push({ tramo, visualFin, columna });
    finGrupo = Math.max(finGrupo, visualFin);
  }
  cerrarGrupo();
  return colocados;
}

// Posición vertical y alto como porcentaje del día completo
export function posicionEnDia(tramo: { inicioMin: number; visualFin: number }): {
  arriba: number;
  alto: number;
} {
  return {
    arriba: (tramo.inicioMin / MINUTOS_DIA) * 100,
    alto: ((tramo.visualFin - tramo.inicioMin) / MINUTOS_DIA) * 100,
  };
}

// Posición horizontal como porcentaje del ancho de la columna del día
export function posicionHorizontal(tramo: { columna: number; columnas: number; ocupa: number }): {
  izquierda: number;
  ancho: number;
} {
  return {
    izquierda: (tramo.columna / tramo.columnas) * 100,
    ancho: (tramo.ocupa / tramo.columnas) * 100,
  };
}

// Todas las reuniones de un día como lista única: primero las de día completo y luego por hora
export function listaDelDia<T>(
  dia: ReunionesDelDia<T>,
): { reunion: T; tramo: TramoDia<T> | null }[] {
  const conHora = [...dia.conHora].sort((a, b) => a.inicioMin - b.inicioMin || a.finMin - b.finMin);
  return [
    ...dia.todoElDia.map((reunion) => ({ reunion, tramo: null })),
    ...conHora.map((tramo) => ({ reunion: tramo.reunion, tramo })),
  ];
}

const HORA_INICIO_JORNADA = 7;
const HORAS_VISIBLES_MINIMAS = 10;
const MAX_HORAS_ANTES_DE_AHORA = 6;

type OpcionesDesplazamiento = {
  incluyeHoy: boolean;
  minutosAhora: number;
  // Inicio más temprano (en minutos) entre las reuniones con hora del rango; null si no hay
  primerInicioMin: number | null;
  // Con hoy, sube hasta la primera reunión aunque quede a más de MAX_HORAS_ANTES_DE_AHORA de la hora actual
  mostrarPrimeraReunion?: boolean;
};

// Hora (con decimales) que queda en el borde superior al abrir la cuadrícula
export function horaInicialDeDesplazamiento(opciones: OpcionesDesplazamiento): number {
  const { incluyeHoy, minutosAhora, primerInicioMin, mostrarPrimeraReunion = false } = opciones;
  const maxima = 24 - HORAS_VISIBLES_MINIMAS;
  const primera = primerInicioMin === null ? null : primerInicioMin / 60 - 0.5;
  const limitar = (hora: number) => Math.min(Math.max(hora, 0), maxima);

  if (!incluyeHoy) return limitar(primera ?? HORA_INICIO_JORNADA - 0.5);

  // Hoy manda la hora actual; se retrocede hasta la primera reunión sin perder de vista el ahora
  const ahora = minutosAhora / 60 - 1.5;
  const objetivo = primera === null ? ahora : Math.min(ahora, primera);
  if (mostrarPrimeraReunion) return limitar(objetivo);
  return limitar(Math.max(objetivo, ahora - MAX_HORAS_ANTES_DE_AHORA));
}
