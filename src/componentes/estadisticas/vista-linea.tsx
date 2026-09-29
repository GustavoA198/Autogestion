// Vista de línea en SVG propio: un trazo por serie con marcador y estilo de línea propios, sin depender del color.
import {
  anchoTexto,
  crearEje,
  formatearNumero,
  pasoEtiquetas,
  recortarTexto,
} from "@/componentes/estadisticas/escala";
import {
  esSerieUnica,
  maximoDatos,
  tonoDeSerie,
  todosEnteros,
  valorCategoria,
} from "@/componentes/estadisticas/modelo";
import { COLOR_TONO, TRAZOS_LINEA, trazoMarcador } from "@/componentes/estadisticas/paleta";
import type { PropsVista } from "@/componentes/estadisticas/tipos";

const TAMANO_TEXTO = 11;
const MARGEN = { arriba: 24, derecha: 14, abajo: 26 };
const CLASE_TEXTO = "fill-suave tabular-nums";

export function VistaLinea({ modelo, ancho, alto, punto }: PropsVista) {
  const eje = crearEje(maximoDatos(modelo), todosEnteros(modelo), modelo.maximo);
  const izquierda = Math.max(...eje.marcas.map((m) => anchoTexto(formatearNumero(m)))) + 14;
  const anchoUtil = Math.max(ancho - izquierda - MARGEN.derecha, 1);
  const altoUtil = Math.max(alto - MARGEN.arriba - MARGEN.abajo, 1);
  const base = MARGEN.arriba + altoUtil;
  const y = (valor: number) => base - (valor / eje.tope) * altoUtil;
  const total = modelo.categorias.length;
  const banda = anchoUtil / total;
  const x = (cat: number) => izquierda + banda * (cat + 0.5);
  const unica = esSerieUnica(modelo);
  const etiquetaMasLarga = Math.max(...modelo.categorias.map((c) => c.etiqueta.length));
  const paso = pasoEtiquetas(banda, etiquetaMasLarga * TAMANO_TEXTO * 0.6);

  return (
    <>
      {eje.marcas.map((marca) => (
        <g key={marca}>
          <line
            x1={izquierda}
            x2={ancho - MARGEN.derecha}
            y1={y(marca)}
            y2={y(marca)}
            stroke={marca === 0 ? "var(--linea-fuerte)" : "var(--color-base-300)"}
            strokeWidth={1}
          />
          <text
            x={izquierda - 8}
            y={y(marca) + 4}
            textAnchor="end"
            fontSize={TAMANO_TEXTO}
            className={CLASE_TEXTO}
          >
            {formatearNumero(marca)}
          </text>
        </g>
      ))}
      {modelo.series.map((serie, s) => {
        const color = COLOR_TONO[tonoDeSerie(modelo, s)];
        const trazo = serie.valores
          .map((v, cat) => `${cat === 0 ? "M" : "L"}${x(cat)} ${y(v)}`)
          .join("");
        return (
          <g key={s} className="grafica-marca">
            {unica ? (
              <path
                d={`${trazo}L${x(total - 1)} ${base}L${x(0)} ${base}z`}
                fill={color}
                fillOpacity={0.14}
              />
            ) : null}
            <path
              d={trazo}
              fill="none"
              stroke={color}
              strokeWidth={2.5}
              strokeLinejoin="round"
              strokeLinecap="round"
              strokeDasharray={TRAZOS_LINEA[s % TRAZOS_LINEA.length]}
            />
          </g>
        );
      })}
      {modelo.categorias.map((categoria, cat) => {
        const maximoCat = Math.max(...modelo.series.map((_, s) => valorCategoria(modelo, cat, s)));
        const texto = formatearNumero(valorCategoria(modelo, cat, 0));
        return (
          <g key={cat} {...punto(cat, x(cat), y(maximoCat))}>
            <rect
              x={izquierda + banda * cat}
              y={MARGEN.arriba}
              width={banda}
              height={altoUtil}
              fill="transparent"
            />
            <rect
              className="grafica-fondo-activo"
              x={izquierda + banda * cat}
              y={MARGEN.arriba}
              width={banda}
              height={altoUtil}
              rx={4}
            />
            {modelo.series.map((_, s) => (
              <path
                key={s}
                className="grafica-marca"
                d={trazoMarcador(s, x(cat), y(valorCategoria(modelo, cat, s)), 4.5)}
                fill={COLOR_TONO[tonoDeSerie(modelo, s)]}
                stroke="var(--color-base-100)"
                strokeWidth={1.5}
              />
            ))}
            {unica && banda >= anchoTexto(texto) + 4 && total <= 16 ? (
              <text
                x={x(cat)}
                y={y(valorCategoria(modelo, cat, 0)) - 10}
                textAnchor="middle"
                fontSize={TAMANO_TEXTO}
                fontWeight={600}
                className="fill-base-content tabular-nums"
              >
                {texto}
              </text>
            ) : null}
            {cat % paso === 0 ? (
              <text
                x={x(cat)}
                y={alto - 8}
                textAnchor="middle"
                fontSize={TAMANO_TEXTO}
                className={CLASE_TEXTO}
              >
                {recortarTexto(categoria.etiqueta, banda * paso - 4)}
              </text>
            ) : null}
            <rect
              className="grafica-anillo"
              x={izquierda + banda * cat + 1}
              y={MARGEN.arriba}
              width={banda - 2}
              height={altoUtil}
              rx={4}
            />
          </g>
        );
      })}
    </>
  );
}
