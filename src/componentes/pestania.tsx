"use client";

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

export type PanelPestania = {
  id: string;
  etiqueta: string;
  contenido: ReactNode;
};

type Propiedades = {
  pestanias: PanelPestania[];
  inicial?: string;
  ariaLabel?: string;
};

export function Pestania({ pestanias, inicial, ariaLabel }: Propiedades) {
  const idBase = useId();
  const [activo, setActivo] = useState<string>(inicial ?? pestanias[0]?.id ?? "");
  const refBotones = useRef<Map<string, HTMLButtonElement>>(new Map());
  if (pestanias.length === 0) return null;

  // Un id activo inexistente deja siempre una pestaña alcanzable con Tab
  const idActivo = pestanias.some((p) => p.id === activo) ? activo : pestanias[0].id;

  function seleccionar(indice: number) {
    const destino = pestanias[indice];
    setActivo(destino.id);
    refBotones.current.get(destino.id)?.focus();
  }

  // Patrón ARIA de pestañas: flechas con vuelta circular, Inicio y Fin; activación automática
  function alPulsarTecla(evento: KeyboardEvent<HTMLButtonElement>, indice: number) {
    const total = pestanias.length;
    const destinos: Record<string, number> = {
      ArrowRight: (indice + 1) % total,
      ArrowLeft: (indice - 1 + total) % total,
      Home: 0,
      End: total - 1,
    };
    const destino = destinos[evento.key];
    if (destino === undefined) return;
    evento.preventDefault();
    seleccionar(destino);
  }

  return (
    <div className="w-full">
      <div role="tablist" aria-label={ariaLabel} className="tabs tabs-box bg-base-200">
        {pestanias.map((pestania, indice) => {
          const esActivo = pestania.id === idActivo;
          return (
            <button
              key={pestania.id}
              ref={(elemento) => {
                if (elemento) refBotones.current.set(pestania.id, elemento);
                else refBotones.current.delete(pestania.id);
              }}
              type="button"
              role="tab"
              id={`${idBase}-${pestania.id}`}
              aria-selected={esActivo}
              aria-controls={`${idBase}-${pestania.id}-panel`}
              tabIndex={esActivo ? 0 : -1}
              className={["tab", esActivo ? "tab-active" : ""].filter(Boolean).join(" ")}
              onClick={() => setActivo(pestania.id)}
              onKeyDown={(evento) => alPulsarTecla(evento, indice)}
            >
              {pestania.etiqueta}
            </button>
          );
        })}
      </div>
      {pestanias.map((pestania) => {
        const esActivo = pestania.id === idActivo;
        return (
          <div
            key={pestania.id}
            role="tabpanel"
            id={`${idBase}-${pestania.id}-panel`}
            aria-labelledby={`${idBase}-${pestania.id}`}
            hidden={!esActivo}
            tabIndex={0}
            className="pt-4"
          >
            {pestania.contenido}
          </div>
        );
      })}
    </div>
  );
}
