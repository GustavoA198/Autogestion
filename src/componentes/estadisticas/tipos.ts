// Tipos compartidos por la gráfica interactiva y sus vistas.
import type { SVGProps } from "react";

export type TipoVista = "barras" | "linea" | "dona" | "tabla";

export const TODAS_LAS_VISTAS: TipoVista[] = ["barras", "linea", "dona", "tabla"];

export const ETIQUETA_VISTA: Record<TipoVista, string> = {
  barras: "Barras",
  linea: "Línea",
  dona: "Dona",
  tabla: "Tabla",
};

// Tonos tomados de los colores del tema; "neutro" es un gris para categorías cerradas o sin dato
export type TonoGrafica =
  | "primary"
  | "violeta"
  | "rosa"
  | "accent"
  | "warning"
  | "success"
  | "secondary"
  | "error"
  | "info"
  | "amarillo"
  | "neutro";

export type Categoria = { etiqueta: string; detalle?: string; tono?: TonoGrafica };

// Los valores van alineados por posición con las categorías
export type Serie = { nombre: string; valores: number[]; tono?: TonoGrafica };

export type PuntoSimple = { etiqueta: string; valor: number; detalle?: string; tono?: TonoGrafica };

export type ModeloGrafica = {
  categorias: Categoria[];
  series: Serie[];
  unidad: string;
  unidadSingular: string;
  // Tope fijo del eje (por ejemplo 100 para porcentajes)
  maximo?: number;
};

export type Orientacion = "vertical" | "horizontal";

// Punto activo bajo el puntero o el foco, con su ancla en píxeles para el globo de información
export type PuntoActivo = { cat: number; x: number; y: number };

export type PropsPunto = SVGProps<SVGGElement> & { "data-cat": number; "data-activo": boolean };

// Función que entrega a cada vista las propiedades interactivas de un punto enfocable
export type FabricaPunto = (cat: number, x: number, y: number) => PropsPunto;

export type PropsVista = {
  modelo: ModeloGrafica;
  ancho: number;
  alto: number;
  punto: FabricaPunto;
};
