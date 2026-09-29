// Vista de dona en SVG propio: segmentos separados por un hueco, con el total al centro.
import { formatearNumero } from "@/componentes/estadisticas/escala";
import { tonoDeCategoria, valorCategoria } from "@/componentes/estadisticas/modelo";
import { COLOR_TONO } from "@/componentes/estadisticas/paleta";
import type { PropsVista } from "@/componentes/estadisticas/tipos";

const HUECO = 0.02;

// Coordenadas de un punto sobre una circunferencia; el ángulo 0 apunta hacia arriba
function coordenada(cx: number, cy: number, radio: number, angulo: number): [number, number] {
  return [cx + radio * Math.sin(angulo), cy - radio * Math.cos(angulo)];
}

// Sector de anillo entre dos ángulos
function sector(
  cx: number,
  cy: number,
  exterior: number,
  interior: number,
  a0: number,
  a1: number,
) {
  const [x0, y0] = coordenada(cx, cy, exterior, a0);
  const [x1, y1] = coordenada(cx, cy, exterior, a1);
  const [x2, y2] = coordenada(cx, cy, interior, a1);
  const [x3, y3] = coordenada(cx, cy, interior, a0);
  const grande = a1 - a0 > Math.PI ? 1 : 0;
  return `M${x0} ${y0}A${exterior} ${exterior} 0 ${grande} 1 ${x1} ${y1}L${x2} ${y2}A${interior} ${interior} 0 ${grande} 0 ${x3} ${y3}z`;
}

export function VistaDona({ modelo, ancho, alto, punto: fabrica }: PropsVista) {
  const centro = ancho / 2;
  const cy = alto / 2;
  const exterior = Math.min(ancho, alto) / 2 - 4;
  const interior = exterior * 0.62;
  const valores = modelo.categorias.map((_, cat) => Math.max(0, valorCategoria(modelo, cat, 0)));
  const total = valores.reduce((suma, v) => suma + v, 0);
  const conValor = valores.filter((v) => v > 0).length;
  // Fracción acumulada antes de cada segmento, para ubicar su ángulo de inicio
  const previos = valores.map(
    (_, cat) => valores.slice(0, cat).reduce((suma, v) => suma + v, 0) / (total || 1),
  );

  return (
    <>
      {modelo.categorias.map((_, cat) => {
        const valor = valores[cat];
        if (valor <= 0) return null;
        const inicio = previos[cat] * 2 * Math.PI;
        const fin = (previos[cat] + valor / total) * 2 * Math.PI;
        const hueco = conValor > 1 ? Math.min(HUECO, (fin - inicio) / 4) : 0;
        const d = sector(centro, cy, exterior, interior, inicio + hueco, fin - hueco);
        const [ax, ay] = coordenada(centro, cy, (exterior + interior) / 2, (inicio + fin) / 2);
        return (
          <g key={cat} {...fabrica(cat, ax, ay)}>
            <path className="grafica-marca" d={d} fill={COLOR_TONO[tonoDeCategoria(modelo, cat)]} />
            <path className="grafica-anillo" d={d} strokeLinejoin="round" />
          </g>
        );
      })}
      <text
        x={centro}
        y={cy + 2}
        textAnchor="middle"
        fontSize={26}
        fontWeight={700}
        className="fill-base-content tabular-nums"
      >
        {formatearNumero(total)}
      </text>
      <text x={centro} y={cy + 22} textAnchor="middle" fontSize={12} className="fill-suave">
        {total === 1 ? modelo.unidadSingular : modelo.unidad}
      </text>
    </>
  );
}
