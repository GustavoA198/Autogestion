"use client";

import { useRef, useState } from "react";
import { Icono } from "@/componentes/icono";
import { BarraLateralNav } from "@/componentes/shell/barra-lateral-nav";
import type { EnlaceSeccion } from "@/componentes/shell/barra-lateral";
import { Marca } from "@/componentes/shell/marca";

export function MenuMovil({ secciones }: { secciones: EnlaceSeccion[] }) {
  const refDialogo = useRef<HTMLDialogElement | null>(null);
  const [abierto, setAbierto] = useState(false);

  function abrir() {
    refDialogo.current?.showModal();
    setAbierto(true);
  }

  function cerrar() {
    refDialogo.current?.close();
  }

  return (
    <>
      <button
        type="button"
        className="btn btn-ghost btn-square lg:hidden"
        aria-label="Abrir navegación"
        aria-haspopup="dialog"
        aria-expanded={abierto}
        onClick={abrir}
      >
        <Icono nombre="menu" tamano={20} />
      </button>

      <dialog
        ref={refDialogo}
        aria-label="Menú de navegación"
        onClose={() => setAbierto(false)}
        onClick={(evento) => {
          if (evento.target === refDialogo.current) cerrar();
        }}
        className="bg-base-200 text-base-content border-base-300 backdrop:bg-base-100/80 mr-auto ml-0 h-dvh max-h-none w-72 max-w-[85vw] border-r p-0 lg:hidden"
      >
        <div className="border-base-300 flex items-center justify-between gap-3 border-b px-5 py-5">
          <Marca />
          <button
            type="button"
            className="btn btn-ghost btn-square btn-sm"
            aria-label="Cerrar navegación"
            onClick={cerrar}
          >
            <Icono nombre="cerrar" tamano={18} />
          </button>
        </div>
        <BarraLateralNav secciones={secciones} alNavegar={cerrar} />
      </dialog>
    </>
  );
}
