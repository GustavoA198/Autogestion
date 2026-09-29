"use client";

import Link from "next/link";
import { Icono } from "@/componentes/icono";
import { guardarCapas, type CapasVisibles } from "@/lib/calendario/preferencias";
import { CLASES_SEMAFORO, type NivelSemaforo } from "@/lib/tareas/semaforo";

type Propiedades = {
  capas: CapasVisibles;
  // Cantidad de cada tipo en el rango visible; null mientras carga
  totalReuniones: number | null;
  totalTareas: number | null;
  // Tareas sin fecha en Pendientes; con cero no se muestra la nota
  pendientes: number;
};

const LEYENDA: { nivel: NivelSemaforo; texto: string }[] = [
  { nivel: "rojo", texto: "Vence hoy o vencida" },
  { nivel: "naranja", texto: "1 a 5 días" },
  { nivel: "amarillo", texto: "6 a 10 días" },
  { nivel: "verde", texto: "Más de 10 días" },
  { nivel: "gris", texto: "Cerrada" },
];

function Interruptor({
  activo,
  unico,
  etiqueta,
  cantidad,
  icono,
  alAlternar,
}: {
  activo: boolean;
  // Si es el único activo no se puede apagar: siempre queda algo visible
  unico: boolean;
  etiqueta: string;
  cantidad: number | null;
  icono: "calendario" | "bandera";
  alAlternar: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={activo}
      aria-disabled={unico || undefined}
      title={unico ? "Debe quedar al menos un tipo visible" : undefined}
      onClick={() => {
        if (!unico) alAlternar();
      }}
      className={`foco-interior inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-full px-4 text-sm transition-colors duration-150 max-md:min-h-11 [@media(pointer:coarse)]:min-h-11 ${
        activo
          ? "bg-primary text-primary-content font-bold"
          : "text-suave hover:text-base-content font-medium"
      }`}
    >
      {/* Apagado se ve también sin color: ojo tachado, texto tachado y aria-pressed */}
      <Icono nombre={activo ? icono : "ojo-cerrado"} tamano={16} />
      <span className={activo ? "" : "line-through decoration-2"}>{etiqueta}</span>
      {cantidad !== null ? (
        <span
          className={`min-w-5 rounded-full px-1.5 text-xs tabular-nums ${
            activo ? "bg-primary-content/15" : "bg-base-300/60"
          }`}
        >
          {cantidad}
        </span>
      ) : null}
    </button>
  );
}

function ItemsLeyenda() {
  return (
    <>
      {LEYENDA.map(({ nivel, texto }) => (
        <li key={nivel} className="flex items-center gap-2 text-xs">
          <span
            className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${CLASES_SEMAFORO[nivel].barra}`}
            aria-hidden="true"
          />
          <span className="text-suave">{texto}</span>
        </li>
      ))}
    </>
  );
}

// Interruptores Reuniones/Tareas y leyenda del semáforo, colapsable en móvil
export function FiltrosCapas({ capas, totalReuniones, totalTareas, pendientes }: Propiedades) {
  const soloUna = capas.reuniones !== capas.tareas;
  return (
    <div className="tarjeta flex flex-wrap items-center gap-x-4 gap-y-2 p-3 sm:p-4">
      <div
        role="group"
        aria-label="Tipos de elemento visibles"
        className="border-linea-tarjeta bg-hundida inline-flex rounded-full border p-1"
      >
        <Interruptor
          activo={capas.reuniones}
          unico={soloUna && capas.reuniones}
          etiqueta="Reuniones"
          cantidad={totalReuniones}
          icono="calendario"
          alAlternar={() => guardarCapas({ ...capas, reuniones: !capas.reuniones })}
        />
        <Interruptor
          activo={capas.tareas}
          unico={soloUna && capas.tareas}
          etiqueta="Tareas"
          cantidad={totalTareas}
          icono="bandera"
          alAlternar={() => guardarCapas({ ...capas, tareas: !capas.tareas })}
        />
      </div>

      {capas.tareas ? (
        <>
          <ul
            aria-label="Leyenda del semáforo de tareas"
            className="hidden flex-wrap items-center gap-x-4 gap-y-1 sm:flex"
          >
            <ItemsLeyenda />
          </ul>
          <details className="group basis-full sm:hidden">
            <summary className="text-suave flex min-h-11 cursor-pointer list-none items-center gap-2 text-sm font-medium [&::-webkit-details-marker]:hidden">
              <Icono
                nombre="chevron-derecha"
                tamano={16}
                className="transition-transform duration-150 group-open:rotate-90"
              />
              Leyenda del semáforo
            </summary>
            <ul aria-label="Leyenda del semáforo de tareas" className="grid gap-1.5 pt-1 pb-1">
              <ItemsLeyenda />
            </ul>
          </details>
        </>
      ) : null}

      {pendientes > 0 ? (
        <Link
          href="/tareas?vista=pendientes"
          className="enlace text-suave ml-auto inline-flex min-h-8 items-center gap-1.5 text-xs max-md:min-h-11 [@media(pointer:coarse)]:min-h-11"
        >
          <Icono nombre="info" tamano={14} className="shrink-0" />
          Tareas sin fecha en Pendientes ({pendientes})
        </Link>
      ) : null}
    </div>
  );
}
