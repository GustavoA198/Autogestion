// Globo con el detalle del punto activo; es decorativo porque cada punto ya tiene su texto accesible.
"use client";

import { useLayoutEffect, useRef } from "react";
import {
  nombreCategoria,
  formatearValor,
  tonoDeElemento,
  valorCategoria,
} from "@/componentes/estadisticas/modelo";
import { COLOR_TONO } from "@/componentes/estadisticas/paleta";
import type { ModeloGrafica, PuntoActivo } from "@/componentes/estadisticas/tipos";

type Props = { modelo: ModeloGrafica; activo: PuntoActivo | null; ancho: number };

export function GloboInformacion({ modelo, activo, ancho }: Props) {
  const globo = useRef<HTMLDivElement>(null);

  // Con el ancho real del globo se evita que sobresalga del área de la gráfica y lo recorte el scroll del modal
  useLayoutEffect(() => {
    const elemento = globo.current;
    if (!elemento || !activo) return;
    const mitad = elemento.offsetWidth / 2;
    elemento.style.left = `${Math.min(Math.max(activo.x, mitad), Math.max(ancho - mitad, mitad))}px`;
  });

  if (!activo || activo.cat >= modelo.categorias.length) return null;
  const debajo = activo.y < 72;
  const izquierda = Math.min(Math.max(activo.x, 70), Math.max(ancho - 70, 70));

  return (
    <div
      ref={globo}
      aria-hidden="true"
      className="bg-neutral text-neutral-content border-linea-fuerte shadow-flotante pointer-events-none absolute z-10 w-max max-w-[15rem] rounded-xl border px-3 py-2 text-xs"
      style={{
        left: izquierda,
        top: activo.y,
        transform: debajo ? "translate(-50%, 10px)" : "translate(-50%, calc(-100% - 10px))",
      }}
    >
      <p className="font-bold">{nombreCategoria(modelo, activo.cat)}</p>
      <ul className="mt-1 space-y-0.5">
        {modelo.series.map((serie, s) => (
          <li key={serie.nombre + s} className="flex items-center gap-2 tabular-nums">
            <span
              className="size-2.5 shrink-0 rounded-sm"
              style={{ backgroundColor: COLOR_TONO[tonoDeElemento(modelo, activo.cat, s)] }}
            />
            {modelo.series.length > 1 ? <span>{serie.nombre}:</span> : null}
            <span>{formatearValor(modelo, valorCategoria(modelo, activo.cat, s))}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
