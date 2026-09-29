"use client";

import { useEffect, useRef, useState } from "react";

// Ancho en píxeles del elemento observado; 0 hasta medirlo, así servidor y primer render coinciden
export function useAncho<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [ancho, setAncho] = useState(0);

  useEffect(() => {
    const elemento = ref.current;
    if (!elemento) return;
    const medir = () => setAncho(Math.floor(elemento.getBoundingClientRect().width));
    const observador = new ResizeObserver(medir);
    observador.observe(elemento);
    return () => observador.disconnect();
  }, []);

  return [ref, ancho] as const;
}
