"use client";

import { useState, type ReactNode } from "react";
import { Boton } from "@/componentes/boton";
import { Icono } from "@/componentes/icono";
import { Modal } from "@/componentes/modal";
import { Lienzo } from "@/componentes/estadisticas/grafica-lienzo";
import { crearModelo, disponibilidadVistas } from "@/componentes/estadisticas/modelo";
import { SelectorVista } from "@/componentes/estadisticas/selector-vista";
import {
  TODAS_LAS_VISTAS,
  type Categoria,
  type Orientacion,
  type PuntoSimple,
  type Serie,
  type TipoVista,
} from "@/componentes/estadisticas/tipos";

type Props = {
  titulo: string;
  // Frase que explica qué muestra la gráfica; también es la descripción accesible
  descripcion: string;
  // Unidad en plural ("tareas") y, si cambia, en singular ("tarea"); "%" se pega al número
  unidad: string;
  unidadSingular?: string;
  // Una serie sencilla: cada punto es una categoría con su valor
  datos?: PuntoSimple[];
  // Varias series: los valores de cada serie van alineados con las categorías
  categorias?: Categoria[];
  series?: Serie[];
  // Datos ordenados en el tiempo: habilita la línea y descarta la dona
  temporal?: boolean;
  vistas?: TipoVista[];
  vistaInicial?: TipoVista;
  orientacion?: Orientacion;
  maximo?: number;
  etiquetaCategoria?: string;
  mensajeVacio?: string;
  // Contenido opcional al pie, como un enlace de ayuda
  pie?: ReactNode;
};

export function GraficaInteractiva({
  titulo,
  descripcion,
  unidad,
  unidadSingular,
  datos,
  categorias,
  series,
  temporal = false,
  vistas = TODAS_LAS_VISTAS,
  vistaInicial = "barras",
  orientacion = "vertical",
  maximo,
  etiquetaCategoria = "Categoría",
  mensajeVacio = "Sin datos en este periodo.",
  pie,
}: Props) {
  const modelo = crearModelo({ datos, categorias, series, unidad, unidadSingular, maximo });
  const disponibilidad = disponibilidadVistas(modelo, vistas, temporal);
  const [elegida, setElegida] = useState<TipoVista>(vistaInicial);
  const [ampliada, setAmpliada] = useState(false);
  // Si la vista elegida deja de aplicar (datos nuevos) se vuelve a barras o a la tabla
  const actual = disponibilidad[elegida].activa
    ? elegida
    : disponibilidad.barras.activa
      ? "barras"
      : "tabla";
  const opciones = TODAS_LAS_VISTAS.filter((v) => v === "tabla" || vistas.includes(v));

  const cuerpo = (grande: boolean) => (
    <Lienzo
      modelo={modelo}
      tipo={actual}
      grande={grande}
      titulo={titulo}
      descripcion={descripcion}
      temporal={temporal}
      orientacion={orientacion}
      etiquetaCategoria={etiquetaCategoria}
      mensajeVacio={mensajeVacio}
    />
  );
  const selector = (
    <SelectorVista
      actual={actual}
      vistas={opciones}
      disponibilidad={disponibilidad}
      alElegir={setElegida}
    />
  );

  return (
    <article className="tarjeta flex min-w-0 flex-col gap-4 p-4 sm:p-6">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-lg font-bold tracking-tight">{titulo}</h3>
          <p className="text-suave mt-1 text-sm">{descripcion}</p>
        </div>
        <Boton
          variante="fantasma"
          tamano="pequeno"
          className="btn-square -mt-1 -mr-2"
          aria-label={`Ampliar la gráfica ${titulo}`}
          title="Ampliar"
          onClick={() => setAmpliada(true)}
        >
          <Icono nombre="ampliar" tamano={18} />
        </Boton>
      </header>
      {selector}
      {cuerpo(false)}
      {pie ? <div className="text-sm">{pie}</div> : null}
      <Modal
        abierto={ampliada}
        alCerrar={() => setAmpliada(false)}
        titulo={titulo}
        descripcion={descripcion}
        ancho="grande"
      >
        {ampliada ? (
          <div className="flex flex-col gap-4">
            {selector}
            {cuerpo(true)}
          </div>
        ) : null}
      </Modal>
    </article>
  );
}
