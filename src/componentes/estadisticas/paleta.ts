// Paleta de la gráfica: oliva/lima para la serie principal, tonos separados del semáforo, marcadores y trazos.
import type { TonoGrafica } from "@/componentes/estadisticas/tipos";

// Seis tonos que se distinguen entre sí también en escala de grises
export const PALETA_SERIES: TonoGrafica[] = [
  "primary",
  "accent",
  "violeta",
  "rosa",
  "secondary",
  "info",
];

export const COLOR_TONO: Record<TonoGrafica, string> = {
  primary: "var(--verde-texto)",
  violeta: "var(--serie-violeta)",
  rosa: "var(--serie-rosa)",
  accent: "var(--color-accent)",
  warning: "var(--color-warning)",
  success: "var(--color-success)",
  secondary: "var(--color-secondary)",
  error: "var(--color-error)",
  info: "var(--color-info)",
  amarillo: "var(--semaforo-amarillo)",
  neutro: "color-mix(in oklab, var(--color-base-content) 45%, var(--color-base-100))",
};

// Trazo de la línea por serie: continua, discontinua, punteada y mixta
export const TRAZOS_LINEA: (string | undefined)[] = [
  undefined,
  "8 5",
  "2 5",
  "10 4 2 4",
  "5 5",
  "1 6",
];

// Contorno de un marcador centrado en (x, y) con radio r; la forma cambia por serie
export function trazoMarcador(indice: number, x: number, y: number, r: number): string {
  switch (indice % 6) {
    case 0:
      return `M${x - r} ${y}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0z`;
    case 1:
      return `M${x - r} ${y - r}h${2 * r}v${2 * r}h${-2 * r}z`;
    case 2:
      return `M${x} ${y - r * 1.15}L${x + r * 1.1} ${y + r * 0.85}H${x - r * 1.1}z`;
    case 3:
      return `M${x} ${y - r * 1.25}L${x + r * 1.25} ${y}L${x} ${y + r * 1.25}L${x - r * 1.25} ${y}z`;
    case 4:
      return `M${x - r * 1.1} ${y - r * 0.85}H${x + r * 1.1}L${x} ${y + r * 1.15}z`;
    default: {
      const a = r * 0.45;
      const b = r * 1.2;
      return `M${x - a} ${y - b}h${2 * a}v${b - a}h${b - a}v${2 * a}h${-(b - a)}v${b - a}h${-2 * a}v${-(b - a)}h${-(b - a)}v${-2 * a}h${b - a}z`;
    }
  }
}
