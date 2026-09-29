"use client";

import Link from "next/link";
import { useMemo, type ReactNode } from "react";
import { Icono } from "@/componentes/icono";
import type { ReunionesDelDia } from "@/lib/calendario/disposicion";
import { listaDelDia } from "@/lib/calendario/disposicion";
import { mismoDia, type DiaCivil } from "@/lib/calendario/fechas";
import {
  DIAS_CORTOS,
  MESES_CORTOS,
  NOMBRES_DIA,
  fechaLarga,
  formatoHora,
} from "@/lib/calendario/formato";
import type { ReunionDetalle } from "@/lib/calendario/operaciones";
import { nombreAccesibleTarea, type EventoTarea } from "@/lib/calendario/tareas";
import { CLASES_SEMAFORO } from "@/lib/tareas/semaforo";
import {
  BORDE_SEMAFORO,
  ESTILO_PROVEEDOR,
  esCancelada,
  nombreAccesible,
  textoCantidad,
  type AlSeleccionar,
} from "./comun";

const MAX_CHIPS = 3;
const FILAS = 6;
const SIN_TAREAS: readonly EventoTarea[] = [];

type Propiedades = {
  dias: ReunionesDelDia<ReunionDetalle>[];
  // Tareas por clave de día (AAAA-MM-DD)
  tareasPorDia: ReadonlyMap<string, readonly EventoTarea[]>;
  // Mes que se está viendo; los días de otros meses se atenúan
  mes: DiaCivil;
  hoy: DiaCivil;
  zona: string;
  cargando: boolean;
  alSeleccionar: AlSeleccionar;
  alIrADia: (dia: DiaCivil) => void;
  // Mensaje superpuesto cuando el mes no tiene reuniones
  vacio?: ReactNode;
};

function ChipEvento({
  reunion,
  esTodoElDia,
  hoy,
  zona,
  alSeleccionar,
}: {
  reunion: ReunionDetalle;
  esTodoElDia: boolean;
  hoy: DiaCivil;
  zona: string;
  alSeleccionar: AlSeleccionar;
}) {
  const estilo = ESTILO_PROVEEDOR[reunion.proveedor];
  const cancelada = esCancelada(reunion);
  return (
    <li>
      <button
        type="button"
        onClick={() => alSeleccionar(reunion)}
        aria-label={nombreAccesible(reunion, zona, hoy)}
        title={reunion.titulo}
        className={`foco-interior flex min-h-[1.5rem] w-full cursor-pointer items-center gap-1 rounded-lg px-1 text-left text-xs transition-colors duration-150 [@media(pointer:coarse)]:min-h-11 ${
          esTodoElDia
            ? `${estilo.relleno} font-bold hover:opacity-90`
            : "hover:bg-base-content/8 text-base-content"
        } ${cancelada ? "line-through" : ""}`}
      >
        {esTodoElDia ? null : (
          <span className={`size-2 shrink-0 rounded-full ${estilo.punto}`} aria-hidden="true" />
        )}
        {esTodoElDia ? null : (
          <span className="text-suave shrink-0 font-mono tabular-nums">
            {formatoHora(new Date(reunion.inicio), zona)}
          </span>
        )}
        <span className="truncate font-bold" title={reunion.titulo}>
          {reunion.titulo}
        </span>
      </button>
    </li>
  );
}

// Chip de tarea: el ícono de bandera y el borde punteado la distinguen de una reunión sin depender del color
function ChipTarea({ tarea }: { tarea: EventoTarea }) {
  const { nivel } = tarea.semaforo;
  return (
    <li>
      <Link
        href={`/tareas/${tarea.id}`}
        aria-label={nombreAccesibleTarea(tarea)}
        title={`${tarea.titulo} · ${tarea.semaforo.texto}`}
        className={`foco-interior text-base-content flex min-h-[1.5rem] w-full cursor-pointer items-center gap-0.5 rounded-lg border border-dashed px-0.5 text-left text-xs font-medium transition-colors duration-150 hover:brightness-95 [@media(pointer:coarse)]:min-h-11 ${BORDE_SEMAFORO[nivel]} ${CLASES_SEMAFORO[nivel].fondo}`}
      >
        <Icono nombre="bandera" tamano={11} className="shrink-0" />
        <span className="truncate" title={tarea.titulo}>
          {tarea.titulo}
        </span>
      </Link>
    </li>
  );
}

function CeldaDia({
  dia,
  tareas,
  mes,
  hoy,
  zona,
  alSeleccionar,
  alIrADia,
}: {
  dia: ReunionesDelDia<ReunionDetalle>;
  tareas: readonly EventoTarea[];
  mes: DiaCivil;
  hoy: DiaCivil;
  zona: string;
  alSeleccionar: AlSeleccionar;
  alIrADia: (dia: DiaCivil) => void;
}) {
  const esHoy = mismoDia(dia.dia, hoy);
  const delMes = dia.dia.mes === mes.mes && dia.dia.anio === mes.anio;
  const lista = listaDelDia(dia);
  // Los chips de tarea van primero y el "+N más" cuenta tareas y reuniones juntas
  const total = tareas.length + lista.length;
  const cupo = total > MAX_CHIPS ? MAX_CHIPS - 1 : total;
  const tareasVisibles = tareas.slice(0, cupo);
  const reunionesVisibles = lista.slice(0, Math.max(cupo - tareasVisibles.length, 0));
  const restantes = total - tareasVisibles.length - reunionesVisibles.length;
  const resumenAria = [
    lista.length > 0 ? textoCantidad(lista.length, "reunión", "reuniones") : null,
    tareas.length > 0 ? textoCantidad(tareas.length, "tarea", "tareas") : null,
  ]
    .filter(Boolean)
    .join(" y ");
  const etiquetaNumero =
    dia.dia.dia === 1 ? `${dia.dia.dia} ${MESES_CORTOS[dia.dia.mes - 1]}` : String(dia.dia.dia);

  return (
    <td
      className={`border-linea-tarjeta h-32 min-w-0 border-t border-l p-1 align-top first:border-l-0 ${
        delMes ? "" : "bg-base-200/60"
      } ${esHoy ? "bg-primary/5" : ""}`}
    >
      <button
        type="button"
        onClick={() => alIrADia(dia.dia)}
        aria-label={`Ver ${fechaLarga(dia.dia, hoy)}${esHoy ? " (hoy)" : ""}${
          resumenAria ? `, ${resumenAria}` : ""
        }`}
        aria-current={esHoy ? "date" : undefined}
        className={`foco-interior mb-0.5 inline-grid h-7 min-w-7 cursor-pointer place-items-center rounded-full px-1.5 text-xs font-bold tabular-nums transition-colors duration-150 [@media(pointer:coarse)]:h-11 [@media(pointer:coarse)]:min-w-11 ${
          esHoy
            ? "bg-primary text-primary-content"
            : delMes
              ? "hover:bg-base-content/8"
              : "text-tenue hover:bg-base-content/8"
        }`}
      >
        {etiquetaNumero}
      </button>
      {total > 0 ? (
        <ul role="list" className="flex flex-col gap-0.5">
          {tareasVisibles.map((tarea) => (
            <ChipTarea key={tarea.id} tarea={tarea} />
          ))}
          {reunionesVisibles.map(({ reunion, tramo }) => (
            <ChipEvento
              key={`${reunion.id}-${dia.clave}`}
              reunion={reunion}
              esTodoElDia={tramo === null}
              hoy={hoy}
              zona={zona}
              alSeleccionar={alSeleccionar}
            />
          ))}
          {restantes > 0 ? (
            <li>
              <button
                type="button"
                onClick={() => alIrADia(dia.dia)}
                aria-label={`Ver ${textoCantidad(restantes, "elemento más", "elementos más")} del ${fechaLarga(dia.dia, hoy)}`}
                className="foco-interior text-primary hover:bg-primary/10 flex min-h-[1.5rem] w-full cursor-pointer items-center rounded-lg px-1.5 text-left text-xs font-bold transition-colors duration-150 [@media(pointer:coarse)]:min-h-11"
              >
                +{restantes} más
              </button>
            </li>
          ) : null}
        </ul>
      ) : null}
    </td>
  );
}

// Cuadrícula mensual de 6 semanas con chips de reunión y un "+N más" que lleva al día
export function VistaMes({
  dias,
  tareasPorDia,
  mes,
  hoy,
  zona,
  cargando,
  alSeleccionar,
  alIrADia,
  vacio,
}: Propiedades) {
  const semanas = useMemo(
    () => Array.from({ length: FILAS }, (_, fila) => dias.slice(fila * 7, fila * 7 + 7)),
    [dias],
  );

  return (
    <div className="tarjeta relative overflow-hidden">
      <table
        className={`w-full table-fixed border-collapse transition-opacity duration-200 ${cargando ? "opacity-60" : "opacity-100"}`}
      >
        <caption className="sr-only">Reuniones y tareas del mes</caption>
        <thead>
          <tr>
            {DIAS_CORTOS.map((corto, indice) => (
              <th
                key={corto}
                scope="col"
                className="text-suave border-linea-tarjeta h-10 border-l text-xs font-bold tracking-wide uppercase first:border-l-0"
              >
                <span aria-hidden="true">{corto}</span>
                <span className="sr-only">{NOMBRES_DIA[indice]}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {semanas.map((semana) => (
            <tr key={semana[0].clave}>
              {semana.map((dia) => (
                <CeldaDia
                  key={dia.clave}
                  dia={dia}
                  tareas={tareasPorDia.get(dia.clave) ?? SIN_TAREAS}
                  mes={mes}
                  hoy={hoy}
                  zona={zona}
                  alSeleccionar={alSeleccionar}
                  alIrADia={alIrADia}
                />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {vacio}
    </div>
  );
}

// Marcador de posición con la misma estructura del mes: 6 filas de 7 celdas
export function EsqueletoMes() {
  return (
    <div className="tarjeta overflow-hidden" aria-hidden="true">
      <div className="grid grid-cols-7">
        {DIAS_CORTOS.map((corto) => (
          <div key={corto} className="flex h-10 items-center justify-center">
            <span className="skeleton h-3 w-8" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {Array.from({ length: FILAS * 7 }).map((_, indice) => (
          <div key={indice} className="border-linea-tarjeta h-32 border-t border-l p-1.5">
            <span className="skeleton block size-7 rounded-full" />
            {indice % 3 !== 2 ? <span className="skeleton mt-2 block h-4 w-4/5" /> : null}
            {indice % 4 === 0 ? <span className="skeleton mt-1 block h-4 w-3/5" /> : null}
          </div>
        ))}
      </div>
    </div>
  );
}
