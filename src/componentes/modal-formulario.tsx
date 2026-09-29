"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Confirmacion } from "@/componentes/confirmacion";
import { Modal } from "@/componentes/modal";
import { ContextoModal, firmaFormulario } from "@/componentes/modal-ruta";

type Propiedades = {
  abierto: boolean;
  alCerrar: () => void;
  titulo: string;
  descripcion?: string;
  children: ReactNode;
};

// Modal de formulario controlado por estado (sin URL): misma carcasa que ModalRuta, con confirmación si hay cambios
export function ModalFormulario({ abierto, alCerrar, titulo, descripcion, children }: Propiedades) {
  const refCuerpo = useRef<HTMLDivElement>(null);
  const refFirmaInicial = useRef<string | null>(null);
  const [confirmando, setConfirmando] = useState(false);

  // Al abrir se fija el estado limpio y se enfoca el primer campo (en táctil no, para no abrir el teclado)
  useEffect(() => {
    const cuerpo = refCuerpo.current;
    if (abierto) {
      refFirmaInicial.current = firmaFormulario(cuerpo);
      if (window.matchMedia("(pointer: coarse)").matches) return;
      cuerpo
        ?.querySelector<HTMLElement>(
          'input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled])',
        )
        ?.focus({ preventScroll: true });
    }
    return () => {
      // Vacía los secretos escritos al cerrar o desmontar para que no queden en el DOM del diálogo
      cuerpo
        ?.querySelectorAll<HTMLInputElement>('input[type="password"]')
        .forEach((campo) => {
          campo.value = "";
          campo.dispatchEvent(new Event("input", { bubbles: true }));
          campo.dispatchEvent(new Event("change", { bubbles: true }));
        });
      refFirmaInicial.current = null;
    };
  }, [abierto]);

  const solicitarCierre = useCallback(() => {
    const sucio =
      refFirmaInicial.current !== null &&
      firmaFormulario(refCuerpo.current) !== refFirmaInicial.current;
    if (sucio) setConfirmando(true);
    else alCerrar();
  }, [alCerrar]);

  const contexto = useMemo(
    () => ({ solicitarCierre, cerrar: () => alCerrar() }),
    [solicitarCierre, alCerrar],
  );

  return (
    <ContextoModal.Provider value={contexto}>
      <Modal
        abierto={abierto}
        alCerrar={solicitarCierre}
        titulo={titulo}
        descripcion={descripcion}
        ancho="amplio"
        conScroll={false}
        hoja
      >
        <div ref={refCuerpo} className="flex min-h-0 flex-1 flex-col">
          {children}
        </div>
      </Modal>
      <Confirmacion
        abierto={confirmando}
        alCancelar={() => setConfirmando(false)}
        alConfirmar={() => {
          setConfirmando(false);
          alCerrar();
        }}
        titulo="¿Descartar los cambios?"
        mensaje="Si sales ahora se perderá lo que escribiste."
        textoConfirmar="Descartar"
        textoCancelar="Seguir editando"
        destructivo
      />
    </ContextoModal.Provider>
  );
}
