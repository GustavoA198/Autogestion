// Modelo de datos de la gráfica: normalización, tonos y reglas de qué vistas aplican.
import { formatearConUnidad } from "@/componentes/estadisticas/escala";
import { PALETA_SERIES } from "@/componentes/estadisticas/paleta";
import type {
  Categoria,
  ModeloGrafica,
  PuntoSimple,
  Serie,
  TipoVista,
  TonoGrafica,
} from "@/componentes/estadisticas/tipos";

type EntradaModelo = {
  datos?: PuntoSimple[];
  categorias?: Categoria[];
  series?: Serie[];
  unidad: string;
  unidadSingular?: string;
  maximo?: number;
};

// Convierte la entrada sencilla (una serie) o la de varias series al modelo interno
export function crearModelo(entrada: EntradaModelo): ModeloGrafica {
  const base = { unidad: entrada.unidad, unidadSingular: entrada.unidadSingular ?? entrada.unidad };
  if (entrada.categorias && entrada.series) {
    return {
      ...base,
      categorias: entrada.categorias,
      series: entrada.series,
      maximo: entrada.maximo,
    };
  }
  const datos = entrada.datos ?? [];
  return {
    ...base,
    maximo: entrada.maximo,
    categorias: datos.map(({ etiqueta, detalle, tono }) => ({ etiqueta, detalle, tono })),
    series: [{ nombre: entrada.unidad, valores: datos.map((d) => d.valor) }],
  };
}

export function nombreCategoria(modelo: ModeloGrafica, indice: number): string {
  const categoria = modelo.categorias[indice];
  return categoria.detalle ?? categoria.etiqueta;
}

export function formatearValor(modelo: ModeloGrafica, valor: number): string {
  return formatearConUnidad(valor, modelo.unidad, modelo.unidadSingular);
}

export function valorCategoria(modelo: ModeloGrafica, cat: number, serie: number): number {
  return modelo.series[serie]?.valores[cat] ?? 0;
}

export function esSerieUnica(modelo: ModeloGrafica): boolean {
  return modelo.series.length === 1;
}

// Texto accesible de una categoría: "Semana del 21 sep: 8 tareas"
export function textoAccesible(modelo: ModeloGrafica, cat: number): string {
  const nombre = nombreCategoria(modelo, cat);
  if (esSerieUnica(modelo))
    return `${nombre}: ${formatearValor(modelo, valorCategoria(modelo, cat, 0))}`;
  const partes = modelo.series.map(
    (serie, i) => `${serie.nombre} ${formatearValor(modelo, valorCategoria(modelo, cat, i))}`,
  );
  return `${nombre}: ${partes.join(", ")}`;
}

// Tono de una serie; sin tono propio se toma de la paleta por posición
export function tonoDeSerie(modelo: ModeloGrafica, serie: number): TonoGrafica {
  return modelo.series[serie].tono ?? PALETA_SERIES[serie % PALETA_SERIES.length];
}

// Con una sola serie cada categoría puede llevar su propio tono
export function tonoDeCategoria(modelo: ModeloGrafica, cat: number): TonoGrafica {
  return modelo.categorias[cat].tono ?? PALETA_SERIES[cat % PALETA_SERIES.length];
}

export function tonoDeElemento(modelo: ModeloGrafica, cat: number, serie: number): TonoGrafica {
  if (esSerieUnica(modelo)) return modelo.categorias[cat].tono ?? tonoDeSerie(modelo, 0);
  return tonoDeSerie(modelo, serie);
}

export function hayColorPorCategoria(modelo: ModeloGrafica): boolean {
  return esSerieUnica(modelo) && modelo.categorias.some((c) => c.tono);
}

export function maximoDatos(modelo: ModeloGrafica): number {
  return Math.max(0, ...modelo.series.flatMap((s) => s.valores));
}

export function sinDatos(modelo: ModeloGrafica): boolean {
  return modelo.categorias.length === 0 || maximoDatos(modelo) <= 0;
}

export function todosEnteros(modelo: ModeloGrafica): boolean {
  return modelo.series.every((s) => s.valores.every((v) => Number.isInteger(v)));
}

export type DisponibilidadVista = { activa: boolean; motivo?: string };

const MAXIMO_DONA = 6;

// Reglas: dona con hasta 6 categorías no temporales y sin negativos; línea solo con datos ordenados
export function disponibilidadVistas(
  modelo: ModeloGrafica,
  permitidas: TipoVista[],
  temporal: boolean,
): Record<TipoVista, DisponibilidadVista> {
  const valores = modelo.series.flatMap((s) => s.valores);
  const conValor = modelo.series[0]?.valores.filter((v) => v > 0).length ?? 0;
  const dona: DisponibilidadVista = !esSerieUnica(modelo)
    ? { activa: false, motivo: "La dona solo muestra una serie de datos" }
    : temporal
      ? { activa: false, motivo: "La dona no aplica a datos en el tiempo" }
      : modelo.categorias.length > MAXIMO_DONA
        ? { activa: false, motivo: `La dona admite hasta ${MAXIMO_DONA} categorías` }
        : valores.some((v) => v < 0)
          ? { activa: false, motivo: "La dona no admite valores negativos" }
          : conValor < 2
            ? { activa: false, motivo: "La dona necesita al menos dos categorías con valor" }
            : { activa: true };
  const linea: DisponibilidadVista =
    !temporal || modelo.categorias.length < 2
      ? { activa: false, motivo: "La línea solo aplica a datos ordenados en el tiempo" }
      : { activa: true };
  return {
    barras: { activa: permitidas.includes("barras") },
    linea: { activa: permitidas.includes("linea") && linea.activa, motivo: linea.motivo },
    dona: { activa: permitidas.includes("dona") && dona.activa, motivo: dona.motivo },
    tabla: { activa: true },
  };
}
