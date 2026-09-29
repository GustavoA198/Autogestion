"use client";

import { useState, type KeyboardEvent, type ReactNode } from "react";
import { GloboInformacion } from "@/componentes/estadisticas/globo-informacion";
import { formatearNumero } from "@/componentes/estadisticas/escala";
import { Icono } from "@/componentes/icono";
import { Leyenda, type ElementoLeyenda } from "@/componentes/estadisticas/leyenda";
import {
  esSerieUnica,
  formatearValor,
  hayColorPorCategoria,
  nombreCategoria,
  sinDatos,
  textoAccesible,
  tonoDeCategoria,
  tonoDeSerie,
  valorCategoria,
} from "@/componentes/estadisticas/modelo";
import type {
  FabricaPunto,
  ModeloGrafica,
  Orientacion,
  PuntoActivo,
  TipoVista,
} from "@/componentes/estadisticas/tipos";
import { useAncho } from "@/componentes/estadisticas/use-ancho";
import { altoBarrasHorizontal, VistaBarras } from "@/componentes/estadisticas/vista-barras";
import { VistaDona } from "@/componentes/estadisticas/vista-dona";
import { VistaLinea } from "@/componentes/estadisticas/vista-linea";
import { VistaTabla } from "@/componentes/estadisticas/vista-tabla";

type Props = {
  modelo: ModeloGrafica;
  tipo: TipoVista;
  grande: boolean;
  titulo: string;
  descripcion: string;
  temporal: boolean;
  orientacion: Orientacion;
  etiquetaCategoria: string;
  mensajeVacio: string;
};

const TECLAS = ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Home", "End"];

function Vacio({ mensaje }: { mensaje: string }) {
  return (
    <div
      role="status"
      className="border-linea-fuerte text-suave flex min-h-32 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed p-6 text-center text-sm"
    >
      <Icono nombre="grafica" tamano={22} />
      <p>{mensaje}</p>
    </div>
  );
}

// Con una sola categoría no hay nada que comparar: se muestra el dato en grande
function DatoUnico({ modelo }: { modelo: ModeloGrafica }) {
  return (
    <div className="flex min-h-32 flex-col items-center justify-center gap-1 py-4 text-center">
      <p className="text-suave text-sm">{nombreCategoria(modelo, 0)}</p>
      {modelo.series.map((serie, s) => (
        <p key={serie.nombre + s} className="text-2xl font-bold tabular-nums">
          {esSerieUnica(modelo) ? "" : `${serie.nombre}: `}
          {formatearValor(modelo, valorCategoria(modelo, 0, s))}
        </p>
      ))}
      <p className="text-suave max-w-xs text-xs">
        Solo hay un dato, por eso no hay nada que comparar.
      </p>
    </div>
  );
}

function elementosLeyenda(
  modelo: ModeloGrafica,
  tipo: TipoVista,
  horizontal: boolean,
): ElementoLeyenda[] {
  if (!esSerieUnica(modelo)) {
    return modelo.series.map((serie, s) => ({
      nombre: serie.nombre,
      tono: tonoDeSerie(modelo, s),
    }));
  }
  // Las barras horizontales ya rotulan cada categoría; la leyenda solo hace falta con color por categoría
  if (tipo !== "dona" && (horizontal || !hayColorPorCategoria(modelo))) return [];
  const total = modelo.series[0].valores.reduce((suma, v) => suma + Math.max(0, v), 0);
  return modelo.categorias.map((_, cat) => {
    const valor = valorCategoria(modelo, cat, 0);
    const porcentaje = total > 0 ? ` (${Math.round((Math.max(0, valor) / total) * 100)} %)` : "";
    return {
      nombre: nombreCategoria(modelo, cat),
      tono: tonoDeCategoria(modelo, cat),
      detalle: `${formatearNumero(valor)}${porcentaje}`,
    };
  });
}

export function Lienzo({
  modelo,
  tipo,
  grande,
  titulo,
  descripcion,
  temporal,
  orientacion,
  etiquetaCategoria,
  mensajeVacio,
}: Props) {
  const [refAncho, ancho] = useAncho<HTMLDivElement>();
  const [activo, setActivo] = useState<PuntoActivo | null>(null);
  const [foco, setFoco] = useState(0);

  // El contenedor medido existe siempre para que el ancho se conozca al cambiar de vista
  const envolver = (contenido: ReactNode) => (
    <div ref={refAncho} className="w-full">
      {contenido}
    </div>
  );

  if (sinDatos(modelo)) return envolver(<Vacio mensaje={mensajeVacio} />);
  if (tipo === "tabla") {
    return envolver(
      <VistaTabla
        modelo={modelo}
        titulo={titulo}
        etiquetaCategoria={etiquetaCategoria}
        conProporcion={!temporal}
      />,
    );
  }
  if (modelo.categorias.length === 1) return envolver(<DatoUnico modelo={modelo} />);

  const esDona = tipo === "dona";
  const horizontal = tipo === "barras" && orientacion === "horizontal";
  const lado = Math.max(Math.min(ancho || 220, grande ? 300 : 220), 140);
  const alto = esDona
    ? lado
    : horizontal
      ? altoBarrasHorizontal(modelo.categorias.length, grande, ancho > 0 && ancho < 480)
      : grande
        ? 340
        : 220;
  const anchoSvg = esDona ? lado : ancho;
  const enfocables = modelo.categorias
    .map((_, cat) => cat)
    .filter((cat) => !esDona || valorCategoria(modelo, cat, 0) > 0);
  const focoEfectivo = enfocables.includes(foco) ? foco : enfocables[0];

  const punto: FabricaPunto = (cat, x, y) => ({
    role: "img",
    tabIndex: cat === focoEfectivo ? 0 : -1,
    "aria-label": textoAccesible(modelo, cat),
    className: "grafica-punto",
    "data-cat": cat,
    "data-activo": activo?.cat === cat,
    onMouseEnter: () => setActivo({ cat, x, y }),
    onMouseLeave: () => setActivo(null),
    onFocus: () => {
      setFoco(cat);
      setActivo({ cat, x, y });
    },
    onBlur: () => setActivo(null),
    onClick: () => setActivo({ cat, x, y }),
  });

  // Flechas, Inicio y Fin recorren los puntos; solo uno está en el orden de tabulación
  function alTeclado(evento: KeyboardEvent<SVGSVGElement>) {
    if (!TECLAS.includes(evento.key)) return;
    const items = Array.from(evento.currentTarget.querySelectorAll<SVGGElement>("[data-cat]"));
    if (items.length === 0) return;
    const actual = items.findIndex((el) => el === document.activeElement);
    const destino =
      evento.key === "Home"
        ? 0
        : evento.key === "End"
          ? items.length - 1
          : evento.key === "ArrowRight" || evento.key === "ArrowDown"
            ? Math.min(items.length - 1, actual + 1)
            : Math.max(0, actual - 1);
    evento.preventDefault();
    items[destino].focus();
  }

  const propiedades = { modelo, ancho: anchoSvg, alto, punto };

  return envolver(
    <>
      <div style={{ minHeight: alto }}>
        {ancho > 0 ? (
          <div className="relative mx-auto" style={{ width: anchoSvg, height: alto }}>
            <svg
              key={`${tipo}-${orientacion}`}
              width={anchoSvg}
              height={alto}
              viewBox={`0 0 ${anchoSvg} ${alto}`}
              role="group"
              aria-label={`${titulo}. ${descripcion} Recorre los datos con las flechas del teclado.`}
              className="grafica-entrada block overflow-visible"
              onKeyDown={alTeclado}
            >
              {esDona ? <VistaDona {...propiedades} /> : null}
              {tipo === "linea" ? <VistaLinea {...propiedades} /> : null}
              {tipo === "barras" ? (
                <VistaBarras {...propiedades} orientacion={orientacion} />
              ) : null}
            </svg>
            <GloboInformacion modelo={modelo} activo={activo} ancho={anchoSvg} />
          </div>
        ) : null}
      </div>
      <Leyenda
        elementos={elementosLeyenda(modelo, tipo, horizontal)}
        conTrazo={tipo === "linea"}
        etiqueta="Leyenda de la gráfica"
      />
    </>,
  );
}
