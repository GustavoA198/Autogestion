"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent,
} from "react";
import { Icono, type NombreIcono } from "@/componentes/icono";
import {
  PREFERENCIAS_TEMA,
  guardarPreferenciaTema,
  leerPreferenciaTema,
  suscribirseAlTema,
  type PreferenciaTema,
} from "@/lib/tema";

const OPCIONES: Record<PreferenciaTema, { etiqueta: string; icono: NombreIcono }> = {
  claro: { etiqueta: "Claro", icono: "sol" },
  oscuro: { etiqueta: "Oscuro", icono: "luna" },
  sistema: { etiqueta: "Sistema", icono: "monitor" },
};

type Propiedades = {
  // Dónde se ancla el menú respecto al botón
  alineacion?: "izquierda" | "derecha";
};

export function InterruptorTema({ alineacion = "derecha" }: Propiedades) {
  const preferencia = useSyncExternalStore(
    suscribirseAlTema,
    leerPreferenciaTema,
    () => "sistema" as PreferenciaTema,
  );
  const [abierto, setAbierto] = useState(false);
  const idMenu = useId();
  const refContenedor = useRef<HTMLDivElement | null>(null);
  const refBoton = useRef<HTMLButtonElement | null>(null);
  const refOpciones = useRef<Array<HTMLButtonElement | null>>([]);

  // Cierra con un clic fuera del menú o con Escape devolviendo el foco al botón
  useEffect(() => {
    if (!abierto) return;
    const alPulsarFuera = (evento: PointerEvent) => {
      if (!refContenedor.current?.contains(evento.target as Node)) setAbierto(false);
    };
    document.addEventListener("pointerdown", alPulsarFuera);
    return () => document.removeEventListener("pointerdown", alPulsarFuera);
  }, [abierto]);

  useEffect(() => {
    if (!abierto) return;
    const indice = Math.max(PREFERENCIAS_TEMA.indexOf(preferencia), 0);
    refOpciones.current[indice]?.focus();
  }, [abierto, preferencia]);

  function elegir(nueva: PreferenciaTema) {
    guardarPreferenciaTema(nueva);
    setAbierto(false);
    refBoton.current?.focus();
  }

  function alPulsarTecla(evento: KeyboardEvent<HTMLDivElement>) {
    if (evento.key === "Escape") {
      evento.preventDefault();
      setAbierto(false);
      refBoton.current?.focus();
      return;
    }
    if (evento.key === "Tab") {
      setAbierto(false);
      return;
    }
    const total = PREFERENCIAS_TEMA.length;
    const actual = refOpciones.current.findIndex((opcion) => opcion === document.activeElement);
    const destinos: Record<string, number> = {
      ArrowDown: (actual + 1) % total,
      ArrowUp: (actual - 1 + total) % total,
      Home: 0,
      End: total - 1,
    };
    const destino = destinos[evento.key];
    if (destino === undefined) return;
    evento.preventDefault();
    refOpciones.current[destino]?.focus();
  }

  const actual = OPCIONES[preferencia];

  return (
    <div ref={refContenedor} className="relative" onKeyDown={alPulsarTecla}>
      <button
        ref={refBoton}
        type="button"
        className="btn btn-ghost btn-circle size-11"
        aria-label={`Tema: ${actual.etiqueta}. Cambiar tema`}
        aria-haspopup="menu"
        aria-expanded={abierto}
        aria-controls={abierto ? idMenu : undefined}
        onClick={() => setAbierto((estado) => !estado)}
      >
        <Icono nombre={actual.icono} tamano={20} />
      </button>

      {abierto ? (
        <div
          id={idMenu}
          role="menu"
          aria-label="Tema de la interfaz"
          className={`border-linea-tarjeta bg-base-100 shadow-flotante absolute top-full z-40 mt-2 w-44 rounded-2xl border p-1.5 ${alineacion === "derecha" ? "right-0" : "left-0"}`}
        >
          {PREFERENCIAS_TEMA.map((opcion, indice) => {
            const { etiqueta, icono } = OPCIONES[opcion];
            const seleccionada = opcion === preferencia;
            return (
              <button
                key={opcion}
                ref={(elemento) => {
                  refOpciones.current[indice] = elemento;
                }}
                type="button"
                role="menuitemradio"
                aria-checked={seleccionada}
                tabIndex={-1}
                onClick={() => elegir(opcion)}
                className={`flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-full px-3 text-sm transition-colors duration-150 ${seleccionada ? "bg-primary/15 text-primary font-bold" : "text-base-content hover:bg-hover font-medium"}`}
              >
                <Icono nombre={icono} tamano={18} />
                <span className="flex-1 text-left">{etiqueta}</span>
                {seleccionada ? <Icono nombre="check" tamano={16} /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
