// Vista de barras (verticales u horizontales) dibujada en SVG propio, con ejes y etiquetas de valor.
import {
  anchoTexto,
  crearEje,
  formatearNumero,
  pasoEtiquetas,
  recortarTexto,
} from "@/componentes/estadisticas/escala";
import {
  maximoDatos,
  tonoDeElemento,
  todosEnteros,
  valorCategoria,
} from "@/componentes/estadisticas/modelo";
import { COLOR_TONO } from "@/componentes/estadisticas/paleta";
import type { Orientacion, PropsVista } from "@/componentes/estadisticas/tipos";

const TAMANO_TEXTO = 11;
const MARGEN = { arriba: 22, derecha: 10, abajo: 26 };
const CLASE_TEXTO = "fill-suave tabular-nums";

// Alto del área de dibujo de las barras horizontales según la cantidad de filas
export function altoBarrasHorizontal(filas: number, grande: boolean, tactil = false): number {
  return 8 + filas * (tactil ? 44 : grande ? 40 : 34) + 24;
}

type PropsBarras = PropsVista & { orientacion: Orientacion };

export function VistaBarras({ orientacion, ...props }: PropsBarras) {
  return orientacion === "horizontal" ? (
    <BarrasHorizontales {...props} />
  ) : (
    <BarrasVerticales {...props} />
  );
}

function BarrasVerticales({ modelo, ancho, alto, punto }: PropsVista) {
  const eje = crearEje(maximoDatos(modelo), todosEnteros(modelo), modelo.maximo);
  const izquierda = Math.max(...eje.marcas.map((m) => anchoTexto(formatearNumero(m)))) + 14;
  const anchoUtil = Math.max(ancho - izquierda - MARGEN.derecha, 1);
  const altoUtil = Math.max(alto - MARGEN.arriba - MARGEN.abajo, 1);
  const y = (valor: number) => MARGEN.arriba + altoUtil - (valor / eje.tope) * altoUtil;
  const base = MARGEN.arriba + altoUtil;
  const total = modelo.categorias.length;
  const banda = anchoUtil / total;
  const nSeries = modelo.series.length;
  const anchoGrupo = Math.min(banda * 0.74, nSeries * 46);
  const anchoBarra = Math.max((anchoGrupo - (nSeries - 1) * 2) / nSeries, 2);
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
      {modelo.categorias.map((categoria, cat) => {
        const centro = izquierda + banda * (cat + 0.5);
        const maximoCat = Math.max(...modelo.series.map((_, s) => valorCategoria(modelo, cat, s)));
        return (
          <g key={cat} {...punto(cat, centro, y(maximoCat))}>
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
            {modelo.series.map((_, s) => {
              const valor = valorCategoria(modelo, cat, s);
              const x = centro - anchoGrupo / 2 + s * (anchoBarra + 2);
              const altoBarra = valor > 0 ? Math.max(base - y(valor), 2) : 0;
              const texto = formatearNumero(valor);
              return (
                <g key={s}>
                  <rect
                    className="grafica-barra-v grafica-marca"
                    x={x}
                    y={base - altoBarra}
                    width={anchoBarra}
                    height={altoBarra}
                    rx={3}
                    fill={COLOR_TONO[tonoDeElemento(modelo, cat, s)]}
                  />
                  {anchoBarra + 2 >= anchoTexto(texto) && total <= 16 ? (
                    <text
                      x={x + anchoBarra / 2}
                      y={base - altoBarra - 5}
                      textAnchor="middle"
                      fontSize={TAMANO_TEXTO}
                      fontWeight={600}
                      className="fill-base-content tabular-nums"
                    >
                      {texto}
                    </text>
                  ) : null}
                </g>
              );
            })}
            {cat % paso === 0 ? (
              <text
                x={centro}
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

function BarrasHorizontales({ modelo, ancho, alto, punto }: PropsVista) {
  const eje = crearEje(maximoDatos(modelo), todosEnteros(modelo), modelo.maximo);
  const etiquetaMasLarga = Math.max(...modelo.categorias.map((c) => c.etiqueta.length));
  const izquierda = Math.min(
    Math.max(anchoTexto("x".repeat(etiquetaMasLarga)) + 12, 70),
    ancho * 0.4,
  );
  const derecha = 46;
  const anchoUtil = Math.max(ancho - izquierda - derecha, 1);
  const filas = modelo.categorias.length;
  const altoFila = (alto - 8 - 24) / filas;
  const nSeries = modelo.series.length;
  const altoBarra = Math.min(20, (altoFila * 0.62) / nSeries);
  const x = (valor: number) => izquierda + (valor / eje.tope) * anchoUtil;

  return (
    <>
      {eje.marcas.map((marca) => (
        <g key={marca}>
          <line
            x1={x(marca)}
            x2={x(marca)}
            y1={4}
            y2={alto - 22}
            stroke={marca === 0 ? "var(--linea-fuerte)" : "var(--color-base-300)"}
            strokeWidth={1}
          />
          <text
            x={x(marca)}
            y={alto - 6}
            textAnchor="middle"
            fontSize={TAMANO_TEXTO}
            className={CLASE_TEXTO}
          >
            {formatearNumero(marca)}
          </text>
        </g>
      ))}
      {modelo.categorias.map((categoria, cat) => {
        const arriba = 8 + altoFila * cat;
        const centroY = arriba + altoFila / 2;
        const maximoCat = Math.max(...modelo.series.map((_, s) => valorCategoria(modelo, cat, s)));
        return (
          <g key={cat} {...punto(cat, x(maximoCat), centroY)}>
            <rect x={0} y={arriba} width={ancho} height={altoFila} fill="transparent" />
            <rect
              className="grafica-fondo-activo"
              x={0}
              y={arriba}
              width={ancho}
              height={altoFila}
              rx={4}
            />
            <text
              x={izquierda - 8}
              y={centroY + 4}
              textAnchor="end"
              fontSize={12}
              className="fill-base-content"
            >
              {recortarTexto(categoria.etiqueta, izquierda - 12, 12)}
            </text>
            {modelo.series.map((_, s) => {
              const valor = valorCategoria(modelo, cat, s);
              const yBarra =
                centroY - (nSeries * altoBarra + (nSeries - 1) * 2) / 2 + s * (altoBarra + 2);
              const anchoBarra = valor > 0 ? Math.max(x(valor) - izquierda, 2) : 0;
              return (
                <g key={s}>
                  <rect
                    className="grafica-barra-h grafica-marca"
                    x={izquierda}
                    y={yBarra}
                    width={anchoBarra}
                    height={altoBarra}
                    rx={3}
                    fill={COLOR_TONO[tonoDeElemento(modelo, cat, s)]}
                  />
                  <text
                    x={izquierda + anchoBarra + 6}
                    y={yBarra + altoBarra / 2 + 4}
                    fontSize={TAMANO_TEXTO}
                    fontWeight={600}
                    className="fill-base-content tabular-nums"
                  >
                    {formatearNumero(valor)}
                  </text>
                </g>
              );
            })}
            <rect
              className="grafica-anillo"
              x={1}
              y={arriba + 1}
              width={ancho - 2}
              height={altoFila - 2}
              rx={4}
            />
          </g>
        );
      })}
    </>
  );
}
