"use client";

import { Boton } from "@/componentes/boton";
import { Entrada } from "@/componentes/entrada";
import { Icono } from "@/componentes/icono";

export type FilaEnlace = { clave: number; etiqueta: string; url: string };

export function siguienteClave(filas: { clave: number }[]): number {
  return filas.reduce((maximo, fila) => Math.max(maximo, fila.clave), 0) + 1;
}

type PropiedadesEnlaces = {
  filas: FilaEnlace[];
  alCambiar: (filas: FilaEnlace[]) => void;
  errores?: Record<number, { etiqueta?: string; url?: string }>;
  // Textos y nombres de campo propios de cada formulario
  textoEtiqueta?: string;
  textoDireccion?: string;
  nombreEtiqueta?: string;
  nombreUrl?: string;
  maxEtiqueta: number;
  maxUrl: number;
  textoVacio?: string;
};

// Filas de enlaces (etiqueta y dirección) que se envían como campos repetidos
export function EditorEnlaces({
  filas,
  alCambiar,
  errores,
  textoEtiqueta = "Etiqueta",
  textoDireccion = "Dirección",
  nombreEtiqueta = "enlaceEtiqueta",
  nombreUrl = "enlaceUrl",
  maxEtiqueta,
  maxUrl,
  textoVacio = "Sin enlaces. Agrega documentos, tickets o cualquier referencia útil.",
}: PropiedadesEnlaces) {
  function editar(clave: number, cambio: Partial<FilaEnlace>) {
    alCambiar(filas.map((f) => (f.clave === clave ? { ...f, ...cambio } : f)));
  }

  return (
    <div className="space-y-4">
      {filas.length === 0 ? <p className="text-suave text-sm">{textoVacio}</p> : null}
      {filas.map((fila, indice) => (
        <div
          key={fila.clave}
          className="grid items-start gap-x-3 gap-y-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)_auto]"
        >
          <Entrada
            etiqueta={textoEtiqueta}
            name={nombreEtiqueta}
            autoComplete="off"
            maxLength={maxEtiqueta}
            value={fila.etiqueta}
            onChange={(e) => editar(fila.clave, { etiqueta: e.target.value })}
            invalido={Boolean(errores?.[indice]?.etiqueta)}
            mensaje={errores?.[indice]?.etiqueta}
          />
          <Entrada
            etiqueta={textoDireccion}
            name={nombreUrl}
            type="url"
            inputMode="url"
            autoComplete="off"
            maxLength={maxUrl}
            value={fila.url}
            onChange={(e) => editar(fila.clave, { url: e.target.value })}
            invalido={Boolean(errores?.[indice]?.url)}
            mensaje={errores?.[indice]?.url}
          />
          <Boton
            variante="fantasma"
            tamano="pequeno"
            className="text-error justify-self-end sm:mt-[1.75rem]"
            onClick={() => alCambiar(filas.filter((f) => f.clave !== fila.clave))}
            aria-label={`Quitar el enlace ${indice + 1}`}
          >
            <Icono nombre="papelera" tamano={16} />
            Quitar
          </Boton>
        </div>
      ))}
      <Boton
        variante="secundario"
        tamano="pequeno"
        onClick={() =>
          alCambiar([...filas, { clave: siguienteClave(filas), etiqueta: "", url: "" }])
        }
      >
        <Icono nombre="mas" tamano={16} />
        Agregar enlace
      </Boton>
    </div>
  );
}
