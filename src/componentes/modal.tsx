"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { Boton } from "@/componentes/boton";
import { Icono } from "@/componentes/icono";

type Propiedades = {
  abierto: boolean;
  alCerrar: () => void;
  titulo: string;
  descripcion?: string;
  rol?: "dialog" | "alertdialog";
  children?: ReactNode;
  pie?: ReactNode;
};

// Componente controlado: Escape y el fondo solo piden cerrar con alCerrar y decide el padre
export function Modal({
  abierto,
  alCerrar,
  titulo,
  descripcion,
  rol = "dialog",
  children,
  pie,
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

  useEffect(() => {
    const dialogo = refDialogo.current;
    if (!dialogo) return;

    // Escape: se cancela el cierre nativo y la decisión pasa al padre
    const alCancelar = (evento: Event) => {
      evento.preventDefault();
      refAlCerrar.current();
    };
    // Cierre nativo no iniciado por el padre (por ejemplo un formulario method=dialog)
    const alCerrarNativo = () => {
      if (refAbierto.current) refAlCerrar.current();
    };
    dialogo.addEventListener("cancel", alCancelar);
    dialogo.addEventListener("close", alCerrarNativo);
    return () => {
      dialogo.removeEventListener("cancel", alCancelar);
      dialogo.removeEventListener("close", alCerrarNativo);
    };
  }, []);

  return (
    <dialog
      ref={refDialogo}
      className="modal"
      role={rol === "alertdialog" ? "alertdialog" : undefined}
      aria-labelledby={idTitulo}
      aria-describedby={descripcion ? idDescripcion : undefined}
      onClick={(evento) => {
        if (evento.target === refDialogo.current) alCerrar();
      }}
    >
      <div className="modal-box bg-base-200 border-base-300 border">
        <header className="flex items-start justify-between gap-4">
          <h2 id={idTitulo} className="text-lg font-semibold">
            {titulo}
          </h2>
          <Boton
            variante="fantasma"
            tamano="pequeno"
            className="btn-square"
            aria-label="Cerrar"
            onClick={alCerrar}
          >
            <Icono nombre="cerrar" tamano={16} />
          </Boton>
        </header>
        {descripcion ? (
          <p id={idDescripcion} className="mt-1 text-sm opacity-70">
            {descripcion}
          </p>
        ) : null}
        {children ? <div className="mt-4">{children}</div> : null}
        {pie ? <footer className="modal-action">{pie}</footer> : null}
      </div>
    </dialog>
  );
}
