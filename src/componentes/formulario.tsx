"use client";

import { useEffect, type ReactNode, type RefObject } from "react";
import { AreaConScroll } from "@/componentes/area-con-scroll";
import { Boton } from "@/componentes/boton";
import { BotonEnlace } from "@/componentes/enlace";
import { Icono } from "@/componentes/icono";
import { PieModal, useModalRuta } from "@/componentes/modal-ruta";

// Agrupa campos relacionados con título y ayuda opcional; dentro de un modal es plana, sin tarjeta propia
export function SeccionFormulario({
  titulo,
  descripcion,
  children,
}: {
  titulo: string;
  descripcion?: string;
  children: ReactNode;
}) {
  const enModal = useModalRuta() !== null;
  return (
    <fieldset
      className={enModal ? "seccion-plana space-y-4" : "tarjeta min-w-0 space-y-5 p-4 sm:p-6"}
    >
      <legend className="sr-only">{titulo}</legend>
      <div aria-hidden="true">
        <p className={enModal ? "text-base font-bold" : "text-lg font-bold tracking-tight"}>
          {titulo}
        </p>
        {descripcion ? <p className="text-suave mt-1 text-sm">{descripcion}</p> : null}
      </div>
      {children}
    </fieldset>
  );
}

// Rejilla de dos columnas desde tablet para campos cortos
export function FilaCampos({ children }: { children: ReactNode }) {
  return <div className="grid gap-5 sm:grid-cols-2">{children}</div>;
}

// Botones de envío y cancelación; en un modal Cancelar cierra (con confirmación si hay cambios) y en página enlaza
export function AccionesFormulario({
  textoEnviar,
  pendiente,
  rutaCancelar,
  textoPendiente,
}: {
  textoEnviar: string;
  pendiente: boolean;
  rutaCancelar: string;
  textoPendiente?: string;
}) {
  const modal = useModalRuta();
  return (
    <div
      className={
        modal
          ? "flex w-full flex-row justify-end gap-2"
          : "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"
      }
    >
      {modal ? (
        <Boton variante="fantasma" onClick={modal.solicitarCierre} disabled={pendiente}>
          Cancelar
        </Boton>
      ) : (
        <BotonEnlace href={rutaCancelar} variante="fantasma">
          Cancelar
        </BotonEnlace>
      )}
      <Boton type="submit" cargando={pendiente}>
        {pendiente && textoPendiente ? textoPendiente : textoEnviar}
      </Boton>
    </div>
  );
}

type PropiedadesMarco = {
  formulario: RefObject<HTMLFormElement | null>;
  accion: (datos: FormData) => void;
  // Montado dentro de ModalRuta: cuerpo desplazable, pie fijo y cierre al guardar
  enModal: boolean;
  // Guardado correcto en modal: cierra y actualiza la vista de fondo
  ok?: boolean;
  pendiente: boolean;
  textoEnviar: string;
  rutaCancelar: string;
  children: ReactNode;
};

// Carcasa común de los formularios de crear/editar: marco de página o cuerpo con scroll y pie fijo en modal
export function MarcoFormulario({
  formulario,
  accion,
  enModal,
  ok = false,
  pendiente,
  textoEnviar,
  rutaCancelar,
  children,
}: PropiedadesMarco) {
  const modal = useModalRuta();
  useEffect(() => {
    if (ok) modal?.cerrar({ actualizar: true });
  }, [ok, modal]);

  if (enModal) {
    return (
      <form ref={formulario} action={accion} className="flex min-h-0 flex-1 flex-col" noValidate>
        <AreaConScroll
          etiqueta="Campos del formulario"
          className="flex-1"
          claseCuerpo="px-5 pb-5 sm:px-7 sm:pb-6"
        >
          <input type="hidden" name="modal" value="1" />
          {children}
        </AreaConScroll>
        <PieModal>
          <AccionesFormulario
            textoEnviar={textoEnviar}
            pendiente={pendiente || ok}
            rutaCancelar={rutaCancelar}
          />
        </PieModal>
      </form>
    );
  }

  return (
    <form ref={formulario} action={accion} className="max-w-2xl space-y-5" noValidate>
      {children}
      <AccionesFormulario
        textoEnviar={textoEnviar}
        pendiente={pendiente}
        rutaCancelar={rutaCancelar}
      />
    </form>
  );
}

// Resumen de errores al inicio del formulario; el foco lo recibe el primer campo inválido
export function ResumenErrores({ cantidad }: { cantidad: number }) {
  const enModal = useModalRuta() !== null;
  if (cantidad === 0) return null;
  return (
    <div
      role="alert"
      className={`border-error/30 bg-error/7 text-error flex items-start gap-2 rounded-2xl border px-4 py-3 text-sm ${enModal ? "mb-5" : ""}`}
    >
      <Icono nombre="error" tamano={18} className="mt-0.5 shrink-0" />
      <p>
        {cantidad === 1
          ? "Hay un campo por corregir. Revisa el mensaje junto al campo marcado."
          : `Hay ${cantidad} campos por corregir. Revisa los mensajes junto a los campos marcados.`}
      </p>
    </div>
  );
}

// Lleva el foco al primer campo inválido cuando llega un resultado con errores
export function useFocoPrimerError(
  formulario: RefObject<HTMLFormElement | null>,
  errores: object | undefined,
) {
  useEffect(() => {
    if (!errores || Object.keys(errores).length === 0) return;
    const campo = formulario.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
    campo?.focus();
  }, [errores, formulario]);
}
