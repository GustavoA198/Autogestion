// Leyenda con texto y marcador propio: el color nunca es el único indicador de cada serie o categoría.
import { COLOR_TONO, TRAZOS_LINEA, trazoMarcador } from "@/componentes/estadisticas/paleta";
import type { TonoGrafica } from "@/componentes/estadisticas/tipos";

export type ElementoLeyenda = {
  nombre: string;
  tono: TonoGrafica;
  // Valor o porcentaje que acompaña al nombre
  detalle?: string;
};

type Props = {
  elementos: ElementoLeyenda[];
  // En vista de línea el símbolo replica el marcador y el trazo de cada serie
  conTrazo?: boolean;
  etiqueta: string;
};

function Simbolo({
  indice,
  tono,
  conTrazo,
}: {
  indice: number;
  tono: TonoGrafica;
  conTrazo: boolean;
}) {
  const color = COLOR_TONO[tono];
  if (!conTrazo) {
    return (
      <span
        aria-hidden="true"
        className="size-3 shrink-0 rounded-sm"
        style={{ backgroundColor: color }}
      />
    );
  }
  return (
    <svg aria-hidden="true" width={28} height={12} viewBox="0 0 28 12" className="shrink-0">
      <line
        x1={0}
        x2={28}
        y1={6}
        y2={6}
        stroke={color}
        strokeWidth={2.5}
        strokeDasharray={TRAZOS_LINEA[indice % TRAZOS_LINEA.length]}
      />
      <path d={trazoMarcador(indice, 14, 6, 4)} fill={color} />
    </svg>
  );
}

export function Leyenda({ elementos, conTrazo = false, etiqueta }: Props) {
  if (elementos.length === 0) return null;
  return (
    <ul aria-label={etiqueta} className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium">
      {elementos.map((elemento, indice) => (
        <li key={elemento.nombre} className="flex min-w-0 items-center gap-2">
          <Simbolo indice={indice} tono={elemento.tono} conTrazo={conTrazo} />
          <span className="truncate" title={elemento.nombre}>
            {elemento.nombre}
          </span>
          {elemento.detalle ? (
            <span className="text-suave tabular-nums">{elemento.detalle}</span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
