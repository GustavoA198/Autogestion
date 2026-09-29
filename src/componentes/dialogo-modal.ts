"use client";

import { useEffect, useRef, type MouseEvent, type PointerEvent, type RefObject } from "react";
import { useBloqueoScroll } from "@/componentes/bloqueo-scroll";

const SELECTOR_ENFOCABLE = [
  "a[href]",
  "button:not([disabled])",
  'input:not([disabled]):not([type="hidden"])',
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

// Controles con foco dentro del diálogo, en orden del documento y solo los visibles
export function elementosEnfocables(contenedor: HTMLElement): HTMLElement[] {
  return Array.from(contenedor.querySelectorAll<HTMLElement>(SELECTOR_ENFOCABLE)).filter(
    (elemento) => elemento.getClientRects().length > 0,
  );
}

type Opciones = {
  abierto: boolean;
  // Escape y clic en el fondo solo piden cerrar: decide quien usa el hook
  alSolicitarCierre: () => void;
};

// Comportamiento común de los diálogos modales: Escape, clic en el fondo, foco cíclico y scroll bloqueado
export function useDialogoModal(
  refDialogo: RefObject<HTMLDialogElement | null>,
  { abierto, alSolicitarCierre }: Opciones,
) {
  const refSolicitar = useRef(alSolicitarCierre);
  // Dónde empezó el clic: arrastrar desde un campo hasta el fondo no debe cerrar el diálogo
  const refOrigen = useRef<EventTarget | null>(null);

  useEffect(() => {
    refSolicitar.current = alSolicitarCierre;
  });

  useBloqueoScroll(abierto);

  useEffect(() => {
    const dialogo = refDialogo.current;
    if (!dialogo) return;

    const alCancelar = (evento: Event) => {
      evento.preventDefault();
      refSolicitar.current();
    };

    // El diálogo nativo deja salir el Tab hacia el navegador: aquí el foco circula dentro
    const alPulsarTecla = (evento: KeyboardEvent) => {
      if (evento.key !== "Tab") return;
      const items = elementosEnfocables(dialogo);
      if (items.length === 0) {
        evento.preventDefault();
        return;
      }
      const primero = items[0];
      const ultimo = items[items.length - 1];
      const activo = document.activeElement;
      if (evento.shiftKey && (activo === primero || activo === dialogo || !dialogo.contains(activo))) {
        evento.preventDefault();
        ultimo.focus();
      } else if (!evento.shiftKey && (activo === ultimo || !dialogo.contains(activo))) {
        evento.preventDefault();
        primero.focus();
      }
    };

    dialogo.addEventListener("cancel", alCancelar);
    dialogo.addEventListener("keydown", alPulsarTecla);
    return () => {
      dialogo.removeEventListener("cancel", alCancelar);
      dialogo.removeEventListener("keydown", alPulsarTecla);
    };
  }, [refDialogo]);

  return {
    alPulsarFondo: (evento: PointerEvent<HTMLDialogElement>) => {
      refOrigen.current = evento.target;
    },
    alHacerClicFondo: (evento: MouseEvent<HTMLDialogElement>) => {
      const origen = refOrigen.current;
      refOrigen.current = null;
      // Sin registro de origen (clic sintético) cuenta el destino del clic
      const desdeFondo = origen === null ? true : origen === refDialogo.current;
      if (desdeFondo && evento.target === refDialogo.current) refSolicitar.current();
    },
  };
}
