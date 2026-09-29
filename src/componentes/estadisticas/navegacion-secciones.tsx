"use client";

import { useEffect, useRef, useState } from "react";
import { Icono } from "@/componentes/icono";

type Seccion = { id: string; etiqueta: string };

// Barra de anclas fija bajo la cabecera; marca la sección visible con aria-current
export function NavegacionSecciones({ secciones }: { secciones: Seccion[] }) {
  const [visible, setVisible] = useState(secciones[0]?.id ?? "");

  const referencia = useRef<HTMLElement>(null);
  const refLista = useRef<HTMLUListElement>(null);
  // Indica si hay pestañas ocultas a cada lado para mostrar una flecha en ese borde
  const [bordes, setBordes] = useState({ izquierda: false, derecha: false });

  useEffect(() => {
    const lista = refLista.current;
    if (!lista) return;
    const actualizar = () =>
      setBordes({
        izquierda: lista.scrollLeft > 4,
        derecha: lista.scrollLeft + lista.clientWidth < lista.scrollWidth - 4,
      });
    actualizar();
    lista.addEventListener("scroll", actualizar, { passive: true });
    const medidor = new ResizeObserver(actualizar);
    medidor.observe(lista);
    return () => {
      lista.removeEventListener("scroll", actualizar);
      medidor.disconnect();
    };
  }, [secciones]);

  useEffect(() => {
    const observador = new IntersectionObserver(
      (entradas) => {
        const primera = entradas.find((e) => e.isIntersecting);
        if (primera) setVisible(primera.target.id);
      },
      { rootMargin: "-140px 0px -60% 0px" },
    );
    const observados = new Set<Element>();
    // Las secciones llegan por streaming y se reemplazan al cambiar el periodo: se re-observan en cada cambio del DOM
    const sincronizar = () => {
      const actuales = new Set<Element>();
      for (const { id } of secciones) {
        const elemento = document.getElementById(id);
        if (elemento) actuales.add(elemento);
      }
      for (const elemento of observados) {
        if (actuales.has(elemento)) continue;
        observador.unobserve(elemento);
        observados.delete(elemento);
      }
      for (const elemento of actuales) {
        if (observados.has(elemento)) continue;
        observador.observe(elemento);
        observados.add(elemento);
      }
    };
    sincronizar();
    const mutaciones = new MutationObserver(sincronizar);
    mutaciones.observe(referencia.current?.parentElement ?? document.body, {
      childList: true,
      subtree: true,
    });
    return () => {
      mutaciones.disconnect();
      observador.disconnect();
    };
  }, [secciones]);

  return (
    <nav
      ref={referencia}
      aria-label="Secciones de estadísticas"
      className="bg-base-200 border-linea-tarjeta sticky top-16 z-20 -mx-4 mb-6 border-b px-4 md:-mx-8 md:px-8"
    >
      <div className="relative">
        {bordes.izquierda ? (
          <span
            aria-hidden="true"
            className="bg-base-200 border-linea-tarjeta pointer-events-none absolute inset-y-0 left-0 z-10 flex w-8 items-center justify-start border-r"
          >
            <Icono nombre="chevron-izquierda" tamano={18} className="text-suave" />
          </span>
        ) : null}
        {bordes.derecha ? (
          <span
            aria-hidden="true"
            className="bg-base-200 border-linea-tarjeta pointer-events-none absolute inset-y-0 right-0 z-10 flex w-8 items-center justify-end border-l"
          >
            <Icono nombre="chevron-derecha" tamano={18} className="text-suave" />
          </span>
        ) : null}
        <ul ref={refLista} className="flex [scrollbar-width:none] gap-1 overflow-x-auto">
          {secciones.map(({ id, etiqueta }) => {
            const activa = id === visible;
            return (
              <li key={id} className="shrink-0">
                <a
                  href={`#${id}`}
                  aria-current={activa ? "location" : undefined}
                  className={[
                    "foco-interior -mb-px flex min-h-11 items-center border-b-2 px-4 text-sm whitespace-nowrap transition-colors duration-150",
                    activa
                      ? "border-primary text-primary font-bold"
                      : "text-suave hover:text-base-content hover:border-base-content/25 border-transparent font-medium",
                  ].join(" ")}
                  onClick={() => setVisible(id)}
                >
                  {etiqueta}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
