"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { Icono, type NombreIcono } from "@/componentes/icono";

export type OpcionMenu = {
  etiqueta: string;
  icono: NombreIcono;
  // Con href la opción es un enlace; sin él es un botón que ejecuta alSeleccionar
  href?: string;
  alSeleccionar?: () => void;
  // Acción destructiva: color de error y separador previo
  destructivo?: boolean;
};

type Propiedades = {
  // Nombre accesible del botón que abre el menú, por ejemplo: Acciones de "Título"
  etiqueta: string;
  opciones: OpcionMenu[];
  className?: string;
};

const MARGEN_VIEWPORT = 8;
const HUECO_BOTON = 4;

// Menú de acciones de una tarjeta: botón de tres puntos y panel en la capa superior (Popover API) con teclado completo
export function MenuAcciones({ etiqueta, opciones, className }: Propiedades) {
  const [abierto, setAbierto] = useState(false);
  const idPanel = useId();
  const refBoton = useRef<HTMLButtonElement>(null);
  const refPanel = useRef<HTMLDivElement>(null);
  // Qué opción enfocar al terminar de abrir
  const refFoco = useRef<"primera" | "ultima">("primera");

  const elementos = useCallback(
    () =>
      Array.from(refPanel.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []),
    [],
  );

  const cerrar = useCallback((devolverFoco: boolean) => {
    const panel = refPanel.current;
    try {
      if (panel?.matches(":popover-open")) panel.hidePopover();
    } catch {
      // Navegador sin Popover API: el estado controla la visibilidad
    }
    setAbierto(false);
    if (devolverFoco) refBoton.current?.focus();
  }, []);

  function abrir(foco: "primera" | "ultima") {
    refFoco.current = foco;
    try {
      refPanel.current?.showPopover?.();
    } catch {
      // Ya estaba abierto o el navegador no lo admite
    }
    setAbierto(true);
  }

  // Coloca el panel bajo el botón, alineado a su borde derecho, e invierte si no cabe; luego enfoca la opción
  useLayoutEffect(() => {
    const panel = refPanel.current;
    const boton = refBoton.current;
    if (!abierto || !panel || !boton) return;

    const anclaje = boton.getBoundingClientRect();
    const medida = panel.getBoundingClientRect();
    const ancho = document.documentElement.clientWidth;
    const alto = window.innerHeight;

    let arriba = anclaje.bottom + HUECO_BOTON;
    const cabeAbajo = arriba + medida.height <= alto - MARGEN_VIEWPORT;
    const cabeArriba = anclaje.top - HUECO_BOTON - medida.height >= MARGEN_VIEWPORT;
    if (!cabeAbajo && cabeArriba) arriba = anclaje.top - HUECO_BOTON - medida.height;
    arriba = Math.max(
      MARGEN_VIEWPORT,
      Math.min(arriba, alto - medida.height - MARGEN_VIEWPORT),
    );

    const izquierda = Math.max(
      MARGEN_VIEWPORT,
      Math.min(anclaje.right - medida.width, ancho - medida.width - MARGEN_VIEWPORT),
    );

    panel.style.top = `${arriba}px`;
    panel.style.left = `${izquierda}px`;

    const items = elementos();
    const destino = refFoco.current === "ultima" ? items[items.length - 1] : items[0];
    destino?.focus({ preventScroll: true });
  }, [abierto, elementos]);

  // Cierre por clic fuera, scroll, cambio de tamaño y sincronía con el cierre nativo del popover
  useEffect(() => {
    if (!abierto) return;
    const panel = refPanel.current;

    const alPulsar = (evento: PointerEvent) => {
      const destino = evento.target as Node;
      if (panel?.contains(destino) || refBoton.current?.contains(destino)) return;
      cerrar(false);
    };
    const alDesplazar = (evento: Event) => {
      if (panel?.contains(evento.target as Node)) return;
      cerrar(false);
    };
    const alRedimensionar = () => cerrar(false);

    document.addEventListener("pointerdown", alPulsar, true);
    window.addEventListener("scroll", alDesplazar, { capture: true, passive: true });
    window.addEventListener("resize", alRedimensionar);
    return () => {
      document.removeEventListener("pointerdown", alPulsar, true);
      window.removeEventListener("scroll", alDesplazar, true);
      window.removeEventListener("resize", alRedimensionar);
    };
  }, [abierto, cerrar]);

  function alPulsarBoton(evento: KeyboardEvent<HTMLButtonElement>) {
    if (evento.key === "ArrowDown" || evento.key === "ArrowUp") {
      evento.preventDefault();
      if (!abierto) abrir(evento.key === "ArrowUp" ? "ultima" : "primera");
    }
  }

  function alPulsarPanel(evento: KeyboardEvent<HTMLDivElement>) {
    const items = elementos();
    const actual = items.indexOf(document.activeElement as HTMLElement);

    switch (evento.key) {
      case "ArrowDown":
        evento.preventDefault();
        items[(actual + 1) % items.length]?.focus();
        break;
      case "ArrowUp":
        evento.preventDefault();
        items[(actual - 1 + items.length) % items.length]?.focus();
        break;
      case "Home":
        evento.preventDefault();
        items[0]?.focus();
        break;
      case "End":
        evento.preventDefault();
        items[items.length - 1]?.focus();
        break;
      case "Escape":
        evento.preventDefault();
        evento.stopPropagation();
        cerrar(true);
        break;
      case "Tab":
        // El foco vuelve al botón y el Tab continúa desde ahí
        cerrar(true);
        break;
      case " ":
        // Los enlaces no responden a la barra espaciadora por defecto
        if (document.activeElement instanceof HTMLAnchorElement) {
          evento.preventDefault();
          document.activeElement.click();
        }
        break;
    }
  }

  return (
    <>
      <button
        ref={refBoton}
        type="button"
        className={`menu-acciones-boton group relative z-10 grid size-11 shrink-0 cursor-pointer place-items-center rounded-full ${className ?? ""}`}
        aria-label={etiqueta}
        aria-haspopup="menu"
        aria-expanded={abierto}
        aria-controls={idPanel}
        onClick={() => (abierto ? cerrar(true) : abrir("primera"))}
        onKeyDown={alPulsarBoton}
      >
        <span
          className={`text-suave group-hover:bg-hover group-hover:text-base-content grid size-8 place-items-center rounded-full transition-colors duration-150 ${abierto ? "bg-hover text-base-content" : ""}`}
        >
          <Icono nombre="kebab" tamano={18} />
        </span>
      </button>
      <div
        ref={refPanel}
        id={idPanel}
        role="menu"
        aria-label={etiqueta}
        popover="manual"
        data-abierto={abierto ? "" : undefined}
        className="menu-acciones-panel"
        onKeyDown={alPulsarPanel}
      >
        {opciones.map((opcion, indice) => {
          const clases = `menu-acciones-item ${opcion.destructivo ? "menu-acciones-item-destructivo" : ""}`;
          const contenido = (
            <>
              <Icono nombre={opcion.icono} tamano={16} />
              {opcion.etiqueta}
            </>
          );
          return (
            <div key={opcion.etiqueta} role="none">
              {opcion.destructivo && indice > 0 ? (
                <div role="separator" className="bg-base-300 mx-2 my-1 h-px" />
              ) : null}
              {opcion.href ? (
                <Link
                  href={opcion.href}
                  role="menuitem"
                  tabIndex={-1}
                  className={clases}
                  onClick={() => cerrar(true)}
                >
                  {contenido}
                </Link>
              ) : (
                <button
                  type="button"
                  role="menuitem"
                  tabIndex={-1}
                  className={clases}
                  onClick={() => {
                    cerrar(true);
                    opcion.alSeleccionar?.();
                  }}
                >
                  {contenido}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
