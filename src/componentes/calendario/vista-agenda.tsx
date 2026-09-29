"use client";

import { Boton } from "@/componentes/boton";
import { Icono, type NombreIcono } from "@/componentes/icono";
import { Insignia } from "@/componentes/insignia";
import type { TramoDia, ReunionesDelDia } from "@/lib/calendario/disposicion";
import { listaDelDia } from "@/lib/calendario/disposicion";
import { diferenciaDias, type DiaCivil } from "@/lib/calendario/fechas";
import { etiquetaDia, fechaLarga, formatoHora } from "@/lib/calendario/formato";
import type { ReunionDetalle } from "@/lib/calendario/operaciones";
import type { CapasVisibles } from "@/lib/calendario/preferencias";
import type { EventoTarea } from "@/lib/calendario/tareas";
import {
  ESTILO_PROVEEDOR,
  enlaceDeUnion,
  esCancelada,
  esProvisional,
  nombreAccesible,
  textoCantidad,
  ubicacionLegible,
  type AlSeleccionar,
} from "./comun";
import { FilaTarea } from "./fila-tarea";

type Propiedades = {
  dias: ReunionesDelDia<ReunionDetalle>[];
  // Tareas por clave de día (AAAA-MM-DD) y tareas vencidas que se arrastran al bloque de hoy
  tareasPorDia: ReadonlyMap<string, readonly EventoTarea[]>;
  vencidas: readonly EventoTarea[];
  capas: CapasVisibles;
  hoy: DiaCivil;
  ahora: number;
  zona: string;
  cargando: boolean;
  alSeleccionar: AlSeleccionar;
  alVerAnteriores: () => void;
  alVerMas: () => void;
};

// Horario de la fila: hora de inicio y fin, o marcas de continuación si cruza la medianoche
function HorarioFila({
  reunion,
  tramo,
  zona,
}: {
  reunion: ReunionDetalle;
  tramo: TramoDia<ReunionDetalle> | null;
  zona: string;
}) {
  if (!tramo) {
    return <span className="text-sm leading-5 font-bold">Todo el día</span>;
  }
  const inicio = formatoHora(new Date(reunion.inicio), zona);
  const fin = formatoHora(new Date(reunion.fin), zona);
  const principal = tramo.continuaAntes ? "Continúa" : inicio;
  const secundario = tramo.continuaDespues ? "sigue mañana" : `hasta ${fin}`;
  return (
    <>
      <span className="font-mono text-sm leading-5 font-bold tabular-nums">{principal}</span>
      <span className="text-suave font-mono text-xs leading-4 tabular-nums">{secundario}</span>
    </>
  );
}

function FilaReunion({
  reunion,
  tramo,
  hoy,
  ahora,
  zona,
  esDiaActual,
  alSeleccionar,
}: {
  reunion: ReunionDetalle;
  tramo: TramoDia<ReunionDetalle> | null;
  hoy: DiaCivil;
  ahora: number;
  zona: string;
  esDiaActual: boolean;
  alSeleccionar: AlSeleccionar;
}) {
  const estilo = ESTILO_PROVEEDOR[reunion.proveedor];
  const enlace = enlaceDeUnion(reunion);
  const ubicacion = ubicacionLegible(reunion);
  const inicio = new Date(reunion.inicio).getTime();
  const fin = new Date(reunion.fin).getTime();
  const enCurso = esDiaActual && !reunion.diaCompleto && inicio <= ahora && ahora < fin;
  const terminada = esDiaActual && !reunion.diaCompleto && fin <= ahora;
  const cancelada = esCancelada(reunion);

  return (
    <li className="flex items-center">
      <button
        type="button"
        onClick={() => alSeleccionar(reunion)}
        aria-label={nombreAccesible(reunion, zona, hoy)}
        className="foco-interior hover:bg-hover grid min-h-14 min-w-0 flex-1 cursor-pointer grid-cols-[4.5rem_minmax(0,1fr)] items-start gap-3 px-4 py-3 text-left transition-colors duration-150 sm:grid-cols-[5.5rem_minmax(0,1fr)]"
      >
        <span className="flex flex-col pt-px">
          <HorarioFila reunion={reunion} tramo={tramo} zona={zona} />
        </span>
        <span className={`min-w-0 border-l-[3px] pl-3 ${estilo.barra}`}>
          <span
            title={reunion.titulo}
            className={`line-clamp-2 block font-bold ${terminada ? "text-suave" : ""} ${cancelada ? "line-through" : ""}`}
          >
            {reunion.titulo}
          </span>
          <span className="text-suave mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            <span>{estilo.nombre}</span>
            {ubicacion ? (
              <span className="inline-flex min-w-0 items-center gap-1">
                <span aria-hidden="true">·</span>
                <span className="truncate" title={ubicacion}>
                  {ubicacion}
                </span>
              </span>
            ) : null}
            {enCurso ? (
              <Insignia tono="success" className="badge-sm">
                En curso
              </Insignia>
            ) : null}
            {cancelada ? (
              <Insignia tono="error" className="badge-sm">
                Cancelado
              </Insignia>
            ) : null}
            {esProvisional(reunion) ? (
              <Insignia tono="warning" className="badge-sm">
                Provisional
              </Insignia>
            ) : null}
          </span>
        </span>
      </button>
      {enlace ? (
        <a
          href={enlace}
          target="_blank"
          rel="noopener noreferrer"
          className="foco-interior btn btn-primary btn-soft mr-3 shrink-0"
          aria-label={`Unirse a ${reunion.titulo} (se abre en una pestaña nueva)`}
        >
          <Icono nombre="video" tamano={18} />
          <span className="max-sm:sr-only">Unirse</span>
        </a>
      ) : null}
    </li>
  );
}

// Resumen de la cabecera: reuniones y tareas del día, o el texto de "sin nada" según lo visible
function resumenDelDia(reuniones: number, tareas: number, mostrarTareas: boolean): string {
  const partes: string[] = [];
  if (reuniones > 0) partes.push(textoCantidad(reuniones, "reunión", "reuniones"));
  if (tareas > 0) partes.push(textoCantidad(tareas, "tarea", "tareas"));
  if (partes.length > 0) return partes.join(" · ");
  return mostrarTareas ? "Sin actividad" : "Sin reuniones";
}

function CabeceraDia({ dia, hoy, resumen }: { dia: DiaCivil; hoy: DiaCivil; resumen: string }) {
  const diferencia = diferenciaDias(hoy, dia);
  const esHoy = diferencia === 0;
  const etiqueta = etiquetaDia(dia, hoy);
  const conFechaAparte = diferencia >= -1 && diferencia <= 1;
  return (
    <header className="bg-hundida border-linea-tarjeta sticky top-16 z-10 flex items-center gap-3 border-y px-4 py-2">
      <span
        className={`grid size-9 shrink-0 place-items-center rounded-full text-sm font-bold ${
          esHoy
            ? "bg-primary text-primary-content"
            : "bg-base-100 border-linea-tarjeta text-base-content border"
        }`}
        aria-hidden="true"
      >
        {dia.dia}
      </span>
      <h3 className="min-w-0 flex flex-wrap items-baseline gap-x-2 text-sm font-bold first-letter:uppercase">
        <span className={esHoy ? "text-primary" : ""}>{etiqueta}</span>
        {conFechaAparte ? (
          <span className="text-suave font-normal first-letter:uppercase">
            {fechaLarga(dia, hoy)}
          </span>
        ) : null}
      </h3>
      <span className="text-suave ml-auto shrink-0 font-mono text-xs">{resumen}</span>
    </header>
  );
}

// Subtítulo que separa los bloques de un mismo día (reuniones, tareas que vencen, vencidas)
function SubtituloBloque({
  icono,
  texto,
  cantidad,
  urgente = false,
}: {
  icono: NombreIcono;
  texto: string;
  cantidad: number;
  urgente?: boolean;
}) {
  return (
    <h4
      className={`border-linea-tarjeta flex items-center gap-2 border-b px-4 py-2 text-xs font-bold tracking-wide uppercase ${
        urgente ? "text-error" : "text-suave"
      }`}
    >
      <Icono nombre={icono} tamano={14} />
      {texto}
      <span className="font-normal tabular-nums">({cantidad})</span>
    </h4>
  );
}

// Lista agrupada por día desde hoy; solo muestra días con reuniones o tareas y siempre el día actual
export function VistaAgenda({
  dias,
  tareasPorDia,
  vencidas,
  capas,
  hoy,
  ahora,
  zona,
  cargando,
  alSeleccionar,
  alVerAnteriores,
  alVerMas,
}: Propiedades) {
  const visibles = dias.filter((dia) => {
    const esHoy = diferenciaDias(hoy, dia.dia) === 0;
    if (esHoy) return true;
    return (
      dia.todoElDia.length + dia.conHora.length > 0 ||
      (tareasPorDia.get(dia.clave)?.length ?? 0) > 0
    );
  });

  return (
    <div className="tarjeta relative overflow-clip">
      <div className="flex justify-center px-4 py-2">
        <Boton variante="fantasma" onClick={alVerAnteriores} disabled={cargando}>
          <Icono nombre="chevron-arriba" tamano={18} />
          Ver anteriores
        </Boton>
      </div>
      <div className={`transition-opacity duration-200 ${cargando ? "opacity-60" : "opacity-100"}`}>
        {visibles.map((dia) => {
          const lista = listaDelDia(dia);
          const esDiaActual = diferenciaDias(hoy, dia.dia) === 0;
          const tareas = tareasPorDia.get(dia.clave) ?? [];
          const vencidasDelDia = esDiaActual ? vencidas : [];
          const sinNada = lista.length === 0 && tareas.length === 0 && vencidasDelDia.length === 0;
          const tituloReuniones = capas.tareas || vencidasDelDia.length > 0;
          return (
            <section key={dia.clave} aria-label={fechaLarga(dia.dia, hoy, true)}>
              <CabeceraDia
                dia={dia.dia}
                hoy={hoy}
                resumen={resumenDelDia(
                  lista.length,
                  tareas.length + vencidasDelDia.length,
                  capas.tareas,
                )}
              />
              {sinNada ? (
                <p className="text-suave px-4 py-4 text-sm">
                  {capas.tareas ? "No hay reuniones ni tareas hoy." : "No hay reuniones hoy."}
                </p>
              ) : null}
              {vencidasDelDia.length > 0 ? (
                <div>
                  <SubtituloBloque
                    icono="alerta"
                    texto="Vencidas"
                    cantidad={vencidasDelDia.length}
                    urgente
                  />
                  <ul className="divide-linea-tarjeta/60 divide-y" role="list">
                    {vencidasDelDia.map((tarea) => (
                      <FilaTarea key={`v-${tarea.id}`} tarea={tarea} mostrarFecha />
                    ))}
                  </ul>
                </div>
              ) : null}
              {lista.length > 0 ? (
                <div>
                  {tituloReuniones ? (
                    <SubtituloBloque icono="calendario" texto="Reuniones" cantidad={lista.length} />
                  ) : null}
                  <ul className="divide-linea-tarjeta/60 divide-y" role="list">
                    {lista.map(({ reunion, tramo }) => (
                      <FilaReunion
                        key={`${reunion.id}-${dia.clave}`}
                        reunion={reunion}
                        tramo={tramo}
                        hoy={hoy}
                        ahora={ahora}
                        zona={zona}
                        esDiaActual={esDiaActual}
                        alSeleccionar={alSeleccionar}
                      />
                    ))}
                  </ul>
                </div>
              ) : null}
              {tareas.length > 0 ? (
                <div>
                  <SubtituloBloque
                    icono="bandera"
                    texto="Tareas que vencen"
                    cantidad={tareas.length}
                  />
                  <ul className="divide-linea-tarjeta/60 divide-y" role="list">
                    {tareas.map((tarea) => (
                      <FilaTarea key={tarea.id} tarea={tarea} />
                    ))}
                  </ul>
                </div>
              ) : null}
            </section>
          );
        })}
      </div>
      <div className="border-linea-tarjeta flex justify-center border-t px-4 py-2">
        <Boton variante="fantasma" onClick={alVerMas} disabled={cargando}>
          Ver más adelante
          <Icono nombre="chevron-abajo" tamano={18} />
        </Boton>
      </div>
    </div>
  );
}

// Marcador de posición con la misma estructura de la agenda para no saltar al cargar
export function EsqueletoAgenda() {
  return (
    <div className="tarjeta overflow-clip" aria-hidden="true">
      {[0, 1, 2].map((grupo) => (
        <div key={grupo}>
          <div className="bg-hundida border-linea-tarjeta flex items-center gap-3 border-y px-4 py-2">
            <span className="skeleton size-9 rounded-full" />
            <span className="skeleton h-4 w-40" />
          </div>
          {[0, 1].map((fila) => (
            <div key={fila} className="flex items-start gap-3 px-4 py-3">
              <span className="skeleton mt-0.5 h-10 w-[5.5rem] shrink-0" />
              <span className="flex flex-1 flex-col gap-2 pt-1">
                <span className="skeleton h-4 w-3/4" />
                <span className="skeleton h-3 w-1/3" />
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
