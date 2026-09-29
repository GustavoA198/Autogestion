// Rangos visibles por vista, navegación entre periodos y validación de la consulta al servidor.
import {
  compararDias,
  inicioDeSemana,
  inicioDelDia,
  primerDiaDelMes,
  sumarDias,
  sumarMeses,
  type DiaCivil,
} from "./fechas";

export type Vista = "agenda" | "dia" | "semana" | "mes";

export const VISTAS: readonly Vista[] = ["agenda", "dia", "semana", "mes"];

export const DIAS_AGENDA = 30;
export const DIAS_EXTENSION_ATRAS = 14;
export const DIAS_EXTENSION_ADELANTE = 30;
export const SEMANAS_MES = 6;
export const MAX_DIAS_CONSULTA = 400;

export function esVista(valor: unknown): valor is Vista {
  return typeof valor === "string" && (VISTAS as readonly string[]).includes(valor);
}

// Días extra que la agenda carga al pulsar "Ver anteriores" o "Ver más adelante"
export type ExtensionAgenda = { atras: number; adelante: number };

export const SIN_EXTENSION: ExtensionAgenda = { atras: 0, adelante: 0 };

// Rango de días civiles; hasta es exclusivo
export type RangoDias = { desde: DiaCivil; hasta: DiaCivil };

export function rangoDeVista(
  vista: Vista,
  ancla: DiaCivil,
  extension: ExtensionAgenda = SIN_EXTENSION,
): RangoDias {
  switch (vista) {
    case "dia":
      return { desde: ancla, hasta: sumarDias(ancla, 1) };
    case "semana": {
      const lunes = inicioDeSemana(ancla);
      return { desde: lunes, hasta: sumarDias(lunes, 7) };
    }
    case "mes": {
      const desde = inicioDeSemana(primerDiaDelMes(ancla));
      return { desde, hasta: sumarDias(desde, SEMANAS_MES * 7) };
    }
    case "agenda":
      return {
        desde: sumarDias(ancla, -extension.atras),
        hasta: sumarDias(ancla, DIAS_AGENDA + extension.adelante),
      };
  }
}

export function diasDelRango(rango: RangoDias): DiaCivil[] {
  const dias: DiaCivil[] = [];
  for (
    let actual = rango.desde;
    compararDias(actual, rango.hasta) < 0;
    actual = sumarDias(actual, 1)
  ) {
    dias.push(actual);
  }
  return dias;
}

// Nueva fecha ancla al pulsar anterior (-1) o siguiente (1) en cada vista
export function navegar(vista: Vista, ancla: DiaCivil, sentido: -1 | 1): DiaCivil {
  switch (vista) {
    case "dia":
      return sumarDias(ancla, sentido);
    case "semana":
      return sumarDias(ancla, 7 * sentido);
    case "mes":
      return sumarMeses(ancla, sentido);
    case "agenda":
      return sumarDias(ancla, DIAS_AGENDA * sentido);
  }
}

// Instantes de la consulta: el rango visible más un margen de días a cada lado para eventos en los bordes
export function rangoConsulta(
  rango: RangoDias,
  zona: string,
  margenDias = 1,
): { desde: Date; hasta: Date } {
  return {
    desde: inicioDelDia(sumarDias(rango.desde, -margenDias), zona),
    hasta: inicioDelDia(sumarDias(rango.hasta, margenDias), zona),
  };
}

// Valida las fechas ISO que llegan al servidor; devuelve null si son inválidas o el rango es excesivo
export function validarRangoConsulta(
  desde: unknown,
  hasta: unknown,
  maxDias = MAX_DIAS_CONSULTA,
): { desde: Date; hasta: Date } | null {
  if (typeof desde !== "string" || typeof hasta !== "string") return null;
  const inicio = new Date(desde);
  const fin = new Date(hasta);
  if (Number.isNaN(inicio.getTime()) || Number.isNaN(fin.getTime())) return null;
  if (fin.getTime() <= inicio.getTime()) return null;
  if (fin.getTime() - inicio.getTime() > maxDias * 86_400_000) return null;
  return { desde: inicio, hasta: fin };
}
