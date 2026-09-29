import type { ReactNode } from "react";
import { Boton } from "@/componentes/boton";
import { BotonEnlace } from "@/componentes/enlace";
import { Icono } from "@/componentes/icono";

type Propiedades = {
  etiqueta: string;
  hayFiltros: boolean;
  rutaLimpiar: string;
  children: ReactNode;
};

// Filtros de un listado: formulario GET con campos en rejilla y acciones a la derecha
export function BarraFiltros({ etiqueta, hayFiltros, rutaLimpiar, children }: Propiedades) {
  return (
    <form
      method="get"
      role="search"
      aria-label={etiqueta}
      className="tarjeta flex flex-col gap-4 p-4 sm:p-6 lg:flex-row lg:items-end"
    >
      <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
      <div className="flex flex-wrap gap-2">
        <Boton type="submit" variante="secundario">
          <Icono nombre="busqueda" tamano={16} />
          Filtrar
        </Boton>
        {hayFiltros ? (
          <BotonEnlace href={rutaLimpiar} variante="fantasma">
            Limpiar
          </BotonEnlace>
        ) : null}
      </div>
    </form>
  );
}
