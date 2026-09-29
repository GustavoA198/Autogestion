"use client";

import { useSyncExternalStore } from "react";
import { zonaDelNavegador } from "@/lib/calendario/fechas";
import {
  CAPAS_AMBAS,
  leerCapasGuardadas,
  leerVistaGuardada,
  suscribirseALasCapas,
  suscribirseALaVista,
  type CapasVisibles,
} from "@/lib/calendario/preferencias";
import type { Vista } from "@/lib/calendario/rango";

const MS_MINUTO = 60_000;
const PUNTO_CORTE_ESCRITORIO = "(min-width: 48rem)";

function sinSuscripcion(): () => void {
  return () => {};
}

// Zona horaria del navegador; en el servidor es null para que la hidratación coincida
export function useZonaNavegador(): string | null {
  return useSyncExternalStore(sinSuscripcion, zonaDelNavegador, () => null);
}

function suscribirseAlReloj(alCambiar: () => void): () => void {
  const intervalo = setInterval(alCambiar, 20_000);
  const alVolver = () => {
    if (document.visibilityState === "visible") alCambiar();
  };
  document.addEventListener("visibilitychange", alVolver);
  window.addEventListener("focus", alCambiar);
  return () => {
    clearInterval(intervalo);
    document.removeEventListener("visibilitychange", alVolver);
    window.removeEventListener("focus", alCambiar);
  };
}

function minutoActual(): number {
  return Math.floor(Date.now() / MS_MINUTO) * MS_MINUTO;
}

// Instante actual redondeado al minuto; cambia una vez por minuto y es null en el servidor
export function useAhora(): number | null {
  return useSyncExternalStore(suscribirseAlReloj, minutoActual, () => null);
}

function suscribirseAlAncho(alCambiar: () => void): () => void {
  const consulta = window.matchMedia(PUNTO_CORTE_ESCRITORIO);
  consulta.addEventListener("change", alCambiar);
  return () => consulta.removeEventListener("change", alCambiar);
}

function esAnchoEscritorio(): boolean {
  return window.matchMedia(PUNTO_CORTE_ESCRITORIO).matches;
}

// Verdadero desde 768 px; null hasta conocer el ancho real en el navegador
export function useEsEscritorio(): boolean | null {
  return useSyncExternalStore(suscribirseAlAncho, esAnchoEscritorio, () => null);
}

// Tipos de elemento visibles (reuniones y/o tareas); ambos activos por defecto y en el servidor
export function useCapasGuardadas(): CapasVisibles {
  return useSyncExternalStore(suscribirseALasCapas, leerCapasGuardadas, () => CAPAS_AMBAS);
}

// Última vista guardada por el usuario; null si no hay ninguna o aún no se conoce
export function useVistaGuardada(): Vista | null {
  return useSyncExternalStore(suscribirseALaVista, leerVistaGuardada, () => null);
}
