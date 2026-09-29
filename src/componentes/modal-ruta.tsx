"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AreaConScroll } from "@/componentes/area-con-scroll";
import { Boton } from "@/componentes/boton";
import { Confirmacion } from "@/componentes/confirmacion";
import { useDialogoModal } from "@/componentes/dialogo-modal";
import { Icono } from "@/componentes/icono";

// Aviso global tras guardar: las vistas que piden sus datos desde el cliente (calendario) se recargan
export const EVENTO_DATOS_GUARDADOS = "autogestion:datos-guardados";

type OpcionesCierre = {
  // Vuelve a pedir al servidor la vista de fondo, por ejemplo tras guardar
  actualizar?: boolean;
};

export type ContextoModalRuta = {
  // Cierra pidiendo confirmación si el formulario tiene cambios sin guardar
  solicitarCierre: () => void;
  // Cierra sin preguntar (tras guardar con éxito)
  cerrar: (opciones?: OpcionesCierre) => void;
};

// Se exporta para que otros modales de formulario (por estado) compartan el mismo contrato con sus campos
export const ContextoModal = createContext<ContextoModalRuta | null>(null);

// Devuelve el control del modal de ruta, o null cuando el formulario se muestra como página completa
export function useModalRuta(): ContextoModalRuta | null {
  return useContext(ContextoModal);
}

type Propiedades = {
  titulo: string;
  descripcion?: string;
  // "normal" para formularios estándar; "amplio" para los que necesitan más ancho
  ancho?: "normal" | "amplio";
  // Envuelve el contenido en un área con scroll propio; los formularios con pie fijo la componen ellos mismos
  conScroll?: boolean;
  children: ReactNode;
};

const ANCHOS = { normal: "max-w-2xl", amplio: "max-w-4xl" } as const;

// Forma mínima del evento de la Navigation API, que aún no está en los tipos del DOM
type EventoNavegacion = Event & { navigationType: string; cancelable: boolean };
type NavegacionApi = {
  addEventListener: (tipo: "navigate", oyente: (evento: EventoNavegacion) => void) => void;
  removeEventListener: (tipo: "navigate", oyente: (evento: EventoNavegacion) => void) => void;
};

// Serializa los campos del formulario para detectar cambios sin depender de eventos
export function firmaFormulario(contenedor: HTMLElement | null): string {
  const formulario = contenedor?.querySelector("form");
  if (!formulario) return "";
  const pares = Array.from(new FormData(formulario).entries())
    .filter(([nombre]) => !nombre.startsWith("$ACTION"))
    .map(([nombre, valor]) => [nombre, typeof valor === "string" ? valor : valor.name]);
  return JSON.stringify(pares);
}

// Diálogo accesible para rutas interceptadas: la URL cambia, Atrás lo cierra y el formulario se ve sobre la vista actual
export function ModalRuta({
  titulo,
  descripcion,
  ancho = "normal",
  conScroll = false,
  children,
}: Propiedades) {
  const router = useRouter();
  const refDialogo = useRef<HTMLDialogElement | null>(null);
  const refTitulo = useRef<HTMLHeadingElement | null>(null);
  const refFirmaInicial = useRef<string | null>(null);
  const refCerrando = useRef(false);
  const [confirmando, setConfirmando] = useState(false);
  const idTitulo = useId();
  const idDescripcion = useId();

  const cerrar = useCallback(
    (opciones?: OpcionesCierre) => {
      if (refCerrando.current) return;
      refCerrando.current = true;
      router.back();
      if (opciones?.actualizar) {
        router.refresh();
        window.dispatchEvent(new Event(EVENTO_DATOS_GUARDADOS));
      }
    },
    [router],
  );

  const estaSucio = useCallback(
    () =>
      refFirmaInicial.current !== null &&
      firmaFormulario(refDialogo.current) !== refFirmaInicial.current,
    [],
  );

  const solicitarCierre = useCallback(() => {
    if (estaSucio()) setConfirmando(true);
    else cerrar();
  }, [cerrar, estaSucio]);

  // Atrás/Adelante del navegador con cambios sin guardar: se cancela el recorrido y se pide confirmación
  useEffect(() => {
    const navegacion = (window as unknown as { navigation?: NavegacionApi }).navigation;
    const alNavegar = (evento: EventoNavegacion) => {
      if (evento.navigationType !== "traverse" || !evento.cancelable) return;
      if (refCerrando.current || !estaSucio()) return;
      evento.preventDefault();
      setConfirmando(true);
    };
    // Recarga o cierre de pestaña con el formulario sucio
    const alDescargar = (evento: BeforeUnloadEvent) => {
      if (refCerrando.current || !estaSucio()) return;
      evento.preventDefault();
    };
    navegacion?.addEventListener("navigate", alNavegar);
    window.addEventListener("beforeunload", alDescargar);
    return () => {
      navegacion?.removeEventListener("navigate", alNavegar);
      window.removeEventListener("beforeunload", alDescargar);
    };
  }, [estaSucio]);

  const { alPulsarFondo, alHacerClicFondo } = useDialogoModal(refDialogo, {
    abierto: true,
    alSolicitarCierre: solicitarCierre,
  });

  // Abre el diálogo nativo, fija el estado limpio, enfoca el primer campo y devuelve el foco al cerrar
  useEffect(() => {
    const dialogo = refDialogo.current;
    if (!dialogo) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (!dialogo.open) dialogo.showModal();
    refFirmaInicial.current = firmaFormulario(dialogo);

    // En táctil el título recibe el foco para no abrir el teclado sin que se pida
    const tactil = window.matchMedia("(pointer: coarse)").matches;
    const campo = tactil
      ? null
      : dialogo.querySelector<HTMLElement>(
          '[data-foco-inicial], input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled])',
        );
    (campo ?? refTitulo.current)?.focus({ preventScroll: true });

    return () => {
      // Los secretos escritos no deben sobrevivir al modal en el DOM
      dialogo.querySelectorAll<HTMLInputElement>('input[type="password"]').forEach((campo) => {
        campo.value = "";
      });
      if (dialogo.open) dialogo.close();
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    };
  }, []);

  const contexto = useMemo(() => ({ solicitarCierre, cerrar }), [solicitarCierre, cerrar]);

  return (
    <ContextoModal.Provider value={contexto}>
      <dialog
        ref={refDialogo}
        className="modal-fondo"
        data-hoja=""
        aria-labelledby={idTitulo}
        aria-describedby={descripcion ? idDescripcion : undefined}
        onPointerDown={alPulsarFondo}
        onClick={alHacerClicFondo}
      >
        <div className={`modal-panel ${ANCHOS[ancho]}`}>
          <header className="modal-cabecera">
            <div className="min-w-0 flex-1">
              <h2
                ref={refTitulo}
                id={idTitulo}
                tabIndex={-1}
                className="text-xl leading-7 font-extrabold tracking-tight outline-none"
              >
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
              onClick={solicitarCierre}
            >
              <Icono nombre="cerrar" tamano={18} />
            </Boton>
          </header>
          {conScroll ? (
            <AreaConScroll
              etiqueta={titulo}
              className="flex-1"
              claseCuerpo="px-5 pb-5 sm:px-7 sm:pb-6"
            >
              {children}
            </AreaConScroll>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col">{children}</div>
          )}
        </div>
      </dialog>
      <Confirmacion
        abierto={confirmando}
        alCancelar={() => setConfirmando(false)}
        alConfirmar={() => {
          setConfirmando(false);
          cerrar();
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

// Pie fijo del modal para las acciones (Cancelar / Guardar); va fuera del área con scroll
export function PieModal({ children }: { children: ReactNode }) {
  return <footer className="modal-pie">{children}</footer>;
}
