"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FocusEvent,
  type ReactNode,
} from "react";
import { Boton } from "@/componentes/boton";
import { Icono, type NombreIcono } from "@/componentes/icono";

type Tono = "info" | "exito" | "atencion" | "critico";

type Aviso = {
  id: number;
  tono: Tono;
  mensaje: string;
};

type Contexto = {
  notificar: (mensaje: string, tono?: Tono) => void;
};

const DURACION_MS = 5000;

const ContextoAviso = createContext<Contexto | null>(null);

const ESTILO_TONO: Record<Tono, { icono: NombreIcono; clase: string }> = {
  info: { icono: "info", clase: "text-info" },
  exito: { icono: "check-circulo", clase: "text-success" },
  atencion: { icono: "alerta", clase: "text-warning" },
  critico: { icono: "error", clase: "text-error" },
};

type PropiedadesItem = { aviso: Aviso; alCerrar: (id: number) => void };

// Cada aviso gestiona su propio temporizador: se detiene con el puntero o el foco y se limpia al desmontar
function ItemAviso({ aviso, alCerrar }: PropiedadesItem) {
  const [pausado, setPausado] = useState(false);

  useEffect(() => {
    if (pausado) return;
    const temporizador = setTimeout(() => alCerrar(aviso.id), DURACION_MS);
    return () => clearTimeout(temporizador);
  }, [pausado, aviso.id, alCerrar]);

  function alSalirElFoco(evento: FocusEvent<HTMLDivElement>) {
    if (!evento.currentTarget.contains(evento.relatedTarget)) setPausado(false);
  }

  const { icono, clase } = ESTILO_TONO[aviso.tono];

  return (
    <div
      className="bg-base-100 border-linea-tarjeta shadow-flotante flex w-[22rem] max-w-full items-start gap-3 rounded-2xl border py-3 pr-2 pl-4"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onFocus={() => setPausado(true)}
      onBlur={alSalirElFoco}
    >
      <Icono nombre={icono} tamano={20} className={`mt-2 ${clase}`} />
      <span className="text-base-content flex-1 py-2 text-sm leading-snug">{aviso.mensaje}</span>
      <Boton
        variante="fantasma"
        tamano="pequeno"
        className="btn-circle"
        aria-label="Cerrar aviso"
        onClick={() => alCerrar(aviso.id)}
      >
        <Icono nombre="cerrar" tamano={16} />
      </Boton>
    </div>
  );
}

export function ProveedorAvisos({ children }: { children: ReactNode }) {
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const contador = useRef(0);

  const cerrar = useCallback((id: number) => {
    setAvisos((estado) => estado.filter((aviso) => aviso.id !== id));
  }, []);

  const notificar = useCallback((mensaje: string, tono: Tono = "info") => {
    const id = ++contador.current;
    setAvisos((estado) => [...estado, { id, mensaje, tono }]);
  }, []);

  const valor = useMemo(() => ({ notificar }), [notificar]);
  const criticos = avisos.filter((aviso) => aviso.tono === "critico");
  const otros = avisos.filter((aviso) => aviso.tono !== "critico");

  return (
    <ContextoAviso.Provider value={valor}>
      {children}
      {/* Las regiones en vivo existen siempre para que los lectores anuncien los avisos nuevos */}
      <section className="toast toast-end z-50" aria-label="Avisos de la aplicación">
        <div role="status" className="flex flex-col gap-2">
          {otros.map((aviso) => (
            <ItemAviso key={aviso.id} aviso={aviso} alCerrar={cerrar} />
          ))}
        </div>
        <div role="alert" className="flex flex-col gap-2">
          {criticos.map((aviso) => (
            <ItemAviso key={aviso.id} aviso={aviso} alCerrar={cerrar} />
          ))}
        </div>
      </section>
    </ContextoAviso.Provider>
  );
}

export function useAvisos(): Contexto {
  const contexto = useContext(ContextoAviso);
  if (!contexto) {
    throw new Error("useAvisos debe usarse dentro de ProveedorAvisos");
  }
  return contexto;
}
