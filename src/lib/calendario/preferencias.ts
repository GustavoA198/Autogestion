// Última vista elegida en el calendario; el localStorage puede fallar y nunca debe romper la pantalla.
import { esVista, type Vista } from "./rango";

export const CLAVE_VISTA = "autogestion-calendario-vista";
export const EVENTO_VISTA = "autogestion:calendario-vista";

// Respaldo para que el cambio de vista funcione en la visita aunque el almacenamiento esté bloqueado
let vistaEnMemoria: Vista | null = null;

export function leerVistaGuardada(): Vista | null {
  try {
    const valor = localStorage.getItem(CLAVE_VISTA);
    if (esVista(valor)) return valor;
  } catch {
    // Se usa el respaldo en memoria
  }
  return vistaEnMemoria;
}

export function guardarVista(vista: Vista): void {
  vistaEnMemoria = vista;
  try {
    localStorage.setItem(CLAVE_VISTA, vista);
  } catch {
    // La vista queda solo en memoria durante esta visita
  }
  window.dispatchEvent(new Event(EVENTO_VISTA));
}

export function suscribirseALaVista(alCambiar: () => void): () => void {
  window.addEventListener(EVENTO_VISTA, alCambiar);
  window.addEventListener("storage", alCambiar);
  return () => {
    window.removeEventListener(EVENTO_VISTA, alCambiar);
    window.removeEventListener("storage", alCambiar);
  };
}

// Tipos de elemento visibles en el calendario: siempre hay al menos uno activo
export type CapasVisibles = { reuniones: boolean; tareas: boolean };

export const CLAVE_CAPAS = "autogestion-calendario-capas";
export const EVENTO_CAPAS = "autogestion:calendario-capas";

// Objetos estables: useSyncExternalStore exige la misma referencia mientras el valor no cambie
export const CAPAS_AMBAS: CapasVisibles = { reuniones: true, tareas: true };
const CAPAS_SOLO_REUNIONES: CapasVisibles = { reuniones: true, tareas: false };
const CAPAS_SOLO_TAREAS: CapasVisibles = { reuniones: false, tareas: true };

function capasDesdeCodigo(codigo: string | null): CapasVisibles | null {
  if (codigo === "reuniones") return CAPAS_SOLO_REUNIONES;
  if (codigo === "tareas") return CAPAS_SOLO_TAREAS;
  if (codigo === "ambas") return CAPAS_AMBAS;
  return null;
}

function codigoDeCapas(capas: CapasVisibles): string {
  if (capas.reuniones && capas.tareas) return "ambas";
  return capas.reuniones ? "reuniones" : "tareas";
}

let capasEnMemoria: CapasVisibles | null = null;

export function leerCapasGuardadas(): CapasVisibles {
  try {
    const guardadas = capasDesdeCodigo(localStorage.getItem(CLAVE_CAPAS));
    if (guardadas) return guardadas;
  } catch {
    // Se usa el respaldo en memoria
  }
  return capasEnMemoria ?? CAPAS_AMBAS;
}

export function guardarCapas(capas: CapasVisibles): void {
  capasEnMemoria = capasDesdeCodigo(codigoDeCapas(capas));
  try {
    localStorage.setItem(CLAVE_CAPAS, codigoDeCapas(capas));
  } catch {
    // Las capas quedan solo en memoria durante esta visita
  }
  window.dispatchEvent(new Event(EVENTO_CAPAS));
}

export function suscribirseALasCapas(alCambiar: () => void): () => void {
  window.addEventListener(EVENTO_CAPAS, alCambiar);
  window.addEventListener("storage", alCambiar);
  return () => {
    window.removeEventListener(EVENTO_CAPAS, alCambiar);
    window.removeEventListener("storage", alCambiar);
  };
}
