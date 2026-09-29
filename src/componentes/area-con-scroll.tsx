"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Icono } from "@/componentes/icono";

type Propiedades = {
  // Nombre accesible de la región cuando hay contenido oculto (para lector de pantalla y teclado)
  etiqueta: string;
  className?: string;
  // Clases del contenedor interno que se desplaza (relleno del cuerpo)
  claseCuerpo?: string;
  children: ReactNode;
};

const MARGEN = 2;
const MIN_PULGAR = 28;
const RETARDO_DESPLAZANDO = 900;

// Zona con scroll propio: sin barra nativa, con riel, líneas de borde y pista "Desplázate"
export function AreaConScroll({ etiqueta, className, claseCuerpo, children }: Propiedades) {
  const refCuerpo = useRef<HTMLDivElement>(null);
  const refContenido = useRef<HTMLDivElement>(null);
  const refPulgar = useRef<HTMLSpanElement>(null);
  const refTemporizador = useRef<number | null>(null);
  const [desborde, setDesborde] = useState(false);
  const [hayArriba, setHayArriba] = useState(false);
  const [hayAbajo, setHayAbajo] = useState(false);
  const [desplazando, setDesplazando] = useState(false);

  // Recalcula banderas y coloca el pulgar proporcional al recorrido
  const medir = useCallback(() => {
    const cuerpo = refCuerpo.current;
    if (!cuerpo) return;
    const { scrollTop, scrollHeight, clientHeight } = cuerpo;
    const rebasa = scrollHeight - clientHeight > MARGEN;
    setDesborde(rebasa);
    setHayArriba(rebasa && scrollTop > MARGEN);
    setHayAbajo(rebasa && scrollTop + clientHeight < scrollHeight - MARGEN);

    const pulgar = refPulgar.current;
    if (!pulgar || !rebasa) return;
    const alto = Math.max(MIN_PULGAR, (clientHeight * clientHeight) / scrollHeight);
    const recorrido = clientHeight - alto;
    const avance = scrollTop / (scrollHeight - clientHeight);
    pulgar.style.height = `${alto}px`;
    pulgar.style.transform = `translateY(${Math.max(0, Math.min(recorrido, avance * recorrido))}px)`;
  }, []);

  useEffect(() => {
    const cuerpo = refCuerpo.current;
    const contenido = refContenido.current;
    if (!cuerpo || !contenido) return;
    medir();
    // Entornos sin ResizeObserver (pruebas) solo miden al montar y al desplazar
    if (typeof ResizeObserver === "undefined") return;
    const observador = new ResizeObserver(medir);
    observador.observe(cuerpo);
    observador.observe(contenido);
    return () => observador.disconnect();
  }, [medir]);

  useEffect(
    () => () => {
      if (refTemporizador.current !== null) window.clearTimeout(refTemporizador.current);
    },
    [],
  );

  function alDesplazar() {
    medir();
    setDesplazando(true);
    if (refTemporizador.current !== null) window.clearTimeout(refTemporizador.current);
    refTemporizador.current = window.setTimeout(
      () => setDesplazando(false),
      RETARDO_DESPLAZANDO,
    );
  }

  return (
    <div
      className={`area-scroll ${className ?? ""}`}
      data-desborde={desborde ? "" : undefined}
      data-arriba={hayArriba ? "" : undefined}
      data-abajo={hayAbajo ? "" : undefined}
      data-desplazando={desplazando ? "" : undefined}
    >
      <div
        ref={refCuerpo}
        className="area-scroll-cuerpo"
        onScroll={alDesplazar}
        tabIndex={desborde ? 0 : undefined}
        role={desborde ? "region" : undefined}
        aria-label={desborde ? etiqueta : undefined}
      >
        <div ref={refContenido} className={claseCuerpo}>
          {children}
        </div>
      </div>
      <span className="area-scroll-linea area-scroll-linea-arriba" aria-hidden="true" />
      <span className="area-scroll-linea area-scroll-linea-abajo" aria-hidden="true" />
      <span className="area-scroll-riel" aria-hidden="true">
        <span ref={refPulgar} className="area-scroll-pulgar" />
      </span>
      <span className="area-scroll-pista" aria-hidden="true">
        Desplázate
        <Icono nombre="chevron-abajo" tamano={14} />
      </span>
    </div>
  );
}
