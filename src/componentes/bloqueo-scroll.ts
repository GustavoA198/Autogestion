"use client";

import { useEffect } from "react";

// Contador global: varios overlays apilados comparten un solo bloqueo del scroll de la página
let bloqueos = 0;
let estiloPrevio: { overflow: string; paddingRight: string } | null = null;

function bloquear() {
  if (bloqueos++ > 0) return;
  const raiz = document.documentElement;
  estiloPrevio = { overflow: raiz.style.overflow, paddingRight: raiz.style.paddingRight };
  // El ancho de la barra se compensa con relleno para que el contenido no salte al ocultarla
  const anchoBarra = window.innerWidth - raiz.clientWidth;
  if (anchoBarra > 0) {
    const relleno = parseFloat(getComputedStyle(raiz).paddingRight) || 0;
    raiz.style.paddingRight = `${relleno + anchoBarra}px`;
  }
  raiz.style.overflow = "hidden";
}

function liberar() {
  if (bloqueos === 0 || --bloqueos > 0) return;
  const raiz = document.documentElement;
  raiz.style.overflow = estiloPrevio?.overflow ?? "";
  raiz.style.paddingRight = estiloPrevio?.paddingRight ?? "";
  estiloPrevio = null;
}

// Bloquea el scroll del documento mientras un overlay está abierto
export function useBloqueoScroll(activo: boolean) {
  useEffect(() => {
    if (!activo) return;
    bloquear();
    return liberar;
  }, [activo]);
}
