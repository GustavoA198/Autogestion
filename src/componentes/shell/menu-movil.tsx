"use client";

import { useEffect, useRef, useState } from "react";
import { useBloqueoScroll } from "@/componentes/bloqueo-scroll";
import { Icono } from "@/componentes/icono";
import { BarraLateralNav } from "@/componentes/shell/barra-lateral-nav";
import type { GrupoSecciones } from "@/componentes/shell/barra-lateral";
import { Marca } from "@/componentes/shell/marca";

export function MenuMovil({ grupos }: { grupos: GrupoSecciones[] }) {
  const refDialogo = useRef<HTMLDialogElement | null>(null);
  const [abierto, setAbierto] = useState(false);

  useBloqueoScroll(abierto);

  function abrir() {
    refDialogo.current?.showModal();
    setAbierto(true);
  }

  function cerrar() {
    refDialogo.current?.close();
  }

  // Al pasar a una pantalla con barra lateral fija el cajón deja de tener sentido
  useEffect(() => {
    const consulta = window.matchMedia("(min-width: 48rem)");
    const alCambiar = () => {
      if (consulta.matches) refDialogo.current?.close();
    };
    consulta.addEventListener("change", alCambiar);
    return () => consulta.removeEventListener("change", alCambiar);
  }, []);

  return (
    <>
      <button
        type="button"
        className="btn btn-ghost btn-square size-11 md:hidden"
        aria-label="Abrir navegación"
        aria-haspopup="dialog"
        aria-expanded={abierto}
        onClick={abrir}
      >
        <Icono nombre="menu" tamano={22} />
      </button>

      <dialog
        ref={refDialogo}
        aria-label="Menú de navegación"
        onClose={() => setAbierto(false)}
        onClick={(evento) => {
          if (evento.target === refDialogo.current) cerrar();
        }}
        className="cajon-movil bg-sidebar text-base-content border-linea-tarjeta shadow-modal mr-auto ml-0 h-dvh max-h-none w-80 max-w-[88vw] flex-col border-r p-0 open:flex md:hidden"
      >
        <div className="border-linea-tarjeta flex h-16 shrink-0 items-center justify-between gap-3 border-b px-5">
          <Marca />
          <button
            type="button"
            className="btn btn-ghost btn-square size-11"
            aria-label="Cerrar navegación"
            onClick={cerrar}
          >
            <Icono nombre="cerrar" tamano={20} />
          </button>
        </div>
        <BarraLateralNav grupos={grupos} variante="cajon" alNavegar={cerrar} />
      </dialog>
    </>
  );
}
