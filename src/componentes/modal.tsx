"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { AreaConScroll } from "@/componentes/area-con-scroll";
import { Boton } from "@/componentes/boton";
import { useDialogoModal } from "@/componentes/dialogo-modal";
import { Icono } from "@/componentes/icono";

type Propiedades = {
  abierto: boolean;
  alCerrar: () => void;
  titulo: string;
  descripcion?: string;
  rol?: "dialog" | "alertdialog";
  // El tono destructivo antepone un icono de alerta en caja roja al título
  tono?: "normal" | "destructivo";
  // "amplio" da más espacio a contenidos largos; "grande" a contenidos anchos como las gráficas
  ancho?: "normal" | "amplio" | "grande";
  children?: ReactNode;
  pie?: ReactNode;
  // Los formularios componen su propio cuerpo con scroll y pie fijo, así que no se envuelve en un área con scroll
  conScroll?: boolean;
  // Hoja inferior a ancho completo en móvil, como los modales de formulario
  hoja?: boolean;
};

const ANCHOS = { normal: "max-w-lg", amplio: "max-w-2xl", grande: "max-w-5xl" } as const;

// Componente controlado: Escape y el fondo solo piden cerrar con alCerrar y decide el padre
export function Modal({
  abierto,
  alCerrar,
  titulo,
  descripcion,
  rol = "dialog",
  tono = "normal",
  ancho = "normal",
  children,
  pie,
  conScroll = true,
  hoja = false,
}: Propiedades) {
  const refDialogo = useRef<HTMLDialogElement | null>(null);
  const refAbierto = useRef(abierto);
  const refAlCerrar = useRef(alCerrar);
  const idTitulo = useId();
  const idDescripcion = useId();

  useEffect(() => {
    refAbierto.current = abierto;
    refAlCerrar.current = alCerrar;
  });

  useEffect(() => {
    const dialogo = refDialogo.current;
    if (!dialogo) return;

    if (abierto && !dialogo.open) {
      dialogo.showModal();
      // El botón seguro (data-foco-inicial) recibe el foco en vez del primer control
      dialogo.querySelector<HTMLElement>("[data-foco-inicial]")?.focus();
    } else if (!abierto && dialogo.open) {
      dialogo.close();
    }
  }, [abierto]);

  const { alPulsarFondo, alHacerClicFondo } = useDialogoModal(refDialogo, {
    abierto,
    alSolicitarCierre: alCerrar,
  });

  useEffect(() => {
    const dialogo = refDialogo.current;
    if (!dialogo) return;

    // Cierre nativo no iniciado por el padre (por ejemplo un formulario method=dialog)
    const alCerrarNativo = () => {
      if (refAbierto.current) refAlCerrar.current();
    };
    dialogo.addEventListener("close", alCerrarNativo);
    return () => dialogo.removeEventListener("close", alCerrarNativo);
  }, []);

  return (
    <dialog
      ref={refDialogo}
      className="modal-fondo"
      data-hoja={hoja ? "" : undefined}
      role={rol === "alertdialog" ? "alertdialog" : undefined}
      aria-labelledby={idTitulo}
      aria-describedby={descripcion ? idDescripcion : undefined}
      onPointerDown={alPulsarFondo}
      onClick={alHacerClicFondo}
    >
      <div className={`modal-panel ${ANCHOS[ancho]}`}>
        <header className="modal-cabecera">
          {tono === "destructivo" ? (
            <span className="bg-error/15 text-error grid size-12 shrink-0 place-items-center rounded-2xl">
              <Icono nombre="alerta" tamano={24} />
            </span>
          ) : null}
          <div className={`min-w-0 flex-1 ${tono === "destructivo" ? "pt-1" : ""}`}>
            <h2 id={idTitulo} className="text-xl leading-7 font-extrabold tracking-tight">
              {titulo}
            </h2>
            {descripcion ? (
              <p id={idDescripcion} className="text-suave mt-1.5 text-sm">
                {descripcion}
              </p>
            ) : null}
          </div>
          <Boton
            variante="fantasma"
            className="btn-circle -mt-1.5 -mr-2 size-11 shrink-0"
            aria-label="Cerrar"
            onClick={alCerrar}
          >
            <Icono nombre="cerrar" tamano={18} />
          </Boton>
        </header>
        {children && conScroll ? (
          <AreaConScroll
            etiqueta={titulo}
            className="flex-1"
            claseCuerpo="px-5 pb-5 sm:px-7 sm:pb-6"
          >
            {children}
          </AreaConScroll>
        ) : null}
        {children && !conScroll ? (
          <div className="flex min-h-0 flex-1 flex-col">{children}</div>
        ) : null}
        {pie ? <footer className="modal-pie">{pie}</footer> : null}
      </div>
    </dialog>
  );
}
