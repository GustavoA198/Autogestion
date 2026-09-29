"use client";

import Link from "next/link";
import { useEffect, useOptimistic, useRef, useState, useTransition } from "react";
import { useAvisos } from "@/componentes/aviso";
import { Confirmacion } from "@/componentes/confirmacion";
import { Icono } from "@/componentes/icono";
import { Insignia } from "@/componentes/insignia";
import {
  InsigniaEstado,
  InsigniaPrioridad,
  InsigniaSemaforo,
} from "@/componentes/tarea/insignias-tarea";
import {
  accionCompletarTarea,
  accionDesconpletarTarea,
  accionEliminarTareaEnLista,
} from "@/app/(autenticado)/tareas/acciones";
import { AsignarFecha } from "@/app/(autenticado)/tareas/asignar-fecha";
import { avisarCambioNotificaciones } from "@/lib/notificaciones/eventos";
import { avanceDeTarea } from "@/lib/tareas/avance";
import { FRECUENCIA_LABEL, formatearFechaCorta, frecuenciaDetalle } from "@/lib/tareas/presentacion";
import type { ResultadoSemaforo } from "@/lib/tareas/semaforo";

export type DatosTareaTarjeta = {
  id: string;
  titulo: string;
  descripcion: string | null;
  tipoFrecuencia: string;
  diaSemana: number | null;
  diaMes: number | null;
  fechaPuntual: Date | null;
  fechaLimite: Date | null;
  proyecto: { id: string; nombre: string } | null;
  estado: string;
  prioridad: string;
  // Solo la casilla de cada subtarea: de ahí se deriva el avance
  subtareas: { hecho: boolean }[];
  responsable: string | null;
};

type Propiedades = {
  tarea: DatosTareaTarjeta;
  semaforo: ResultadoSemaforo;
  // Completa: tarjeta con bloque de acciones; compacta: fila para paneles y fichas
  variante?: "completa" | "compacta";
  // Muestra la casilla y el botón Completar
  marcable?: boolean;
  completadaHoy?: boolean;
  // Pendiente sin fecha: muestra el aviso y el botón para asignarle una
  sinFecha?: boolean;
  // Oculta el proyecto cuando la tarjeta ya vive dentro de su ficha
  ocultarProyecto?: boolean;
  // Variante compacta: añade el chip "Hoy" y la frecuencia, útiles en la ficha de proyecto
  deHoy?: boolean;
  conFrecuencia?: boolean;
  // Nivel del título según el encabezado del grupo que la contiene
  nivelTitulo?: 3 | 4;
};

export function TarjetaTarea({
  tarea,
  semaforo,
  variante = "completa",
  marcable = false,
  completadaHoy = false,
  sinFecha = false,
  ocultarProyecto = false,
  nivelTitulo = 3,
  deHoy = false,
  conFrecuencia = false,
}: Propiedades) {
  const Encabezado = nivelTitulo === 4 ? "h4" : "h3";
  const { notificar } = useAvisos();
  const [marcando, marcar] = useTransition();
  const [eliminando, eliminar] = useTransition();
  const [confirmando, setConfirmando] = useState(false);
  const eliminada = useRef(false);

  // Al desaparecer la tarjeta eliminada el foco pasa al contenido para no quedar perdido
  useEffect(
    () => () => {
      if (eliminada.current) document.getElementById("contenido")?.focus({ preventScroll: true });
    },
    [],
  );

  // Una puntual se completa una vez (estado); una recurrente marca solo el día de hoy
  const esPuntual = tarea.tipoFrecuencia === "PUNTUAL";
  const [completada, mostrarCompletada] = useOptimistic(
    esPuntual ? tarea.estado === "COMPLETADA" : completadaHoy,
  );
  const cerrada = tarea.estado === "COMPLETADA" || tarea.estado === "CANCELADA";
  const puedeMarcar = marcable && tarea.estado !== "CANCELADA";
  const tachada = completada || cerrada;
  const avance = avanceDeTarea(tarea);
  const compacta = variante === "compacta";
  const mostrarSemaforo = semaforo.diasRestantes !== null && !cerrada;

  function alternarCompletada() {
    marcar(async () => {
      mostrarCompletada(!completada);
      const resultado = completada
        ? await accionDesconpletarTarea(tarea.id)
        : await accionCompletarTarea(tarea.id);
      if (resultado.ok) avisarCambioNotificaciones();
      else notificar(resultado.error ?? "No se pudo actualizar la tarea.", "critico");
    });
  }

  function confirmarEliminacion() {
    eliminar(async () => {
      const resultado = await accionEliminarTareaEnLista(tarea.id);
      setConfirmando(false);
      if (resultado.ok) {
        notificar(`Tarea "${tarea.titulo}" eliminada.`, "exito");
        avisarCambioNotificaciones();
        eliminada.current = true;
      } else {
        notificar(resultado.error ?? "No se pudo eliminar la tarea.", "critico");
      }
    });
  }

  const etiquetaCasilla = completada
    ? `Deshacer "${tarea.titulo}" como completada`
    : `Marcar "${tarea.titulo}" como completada`;

  const casilla = puedeMarcar ? (
    <button
      type="button"
      role="checkbox"
      aria-checked={completada}
      aria-label={etiquetaCasilla}
      onClick={alternarCompletada}
      disabled={marcando}
      className="casilla-tarea relative z-10 grid size-11 shrink-0 cursor-pointer place-items-center rounded-full"
    >
      <span className="casilla-tarea-marca grid size-5 place-items-center rounded-full">
        {completada ? <Icono nombre="check" tamano={14} strokeWidth={3} /> : null}
      </span>
    </button>
  ) : null;

  const titulo = (
    <Link
      href={`/tareas/${tarea.id}`}
      title={tarea.titulo}
      className={`tarjeta-tarea-enlace min-w-0 font-bold after:absolute after:inset-0 after:content-[''] ${
        compacta ? "text-sm break-words" : "truncate text-base"
      } ${tachada ? "text-suave line-through" : ""}`}
    >
      {tarea.titulo}
    </Link>
  );

  const botonEliminar = (
    <button
      type="button"
      onClick={() => setConfirmando(true)}
      aria-label={`Eliminar "${tarea.titulo}"`}
      title={`Eliminar "${tarea.titulo}"`}
      className="btn btn-accion btn-accion-error btn-tarjeta btn-tarjeta-icono"
    >
      <Icono nombre="papelera" tamano={18} />
    </button>
  );

  const dialogo = (
    <Confirmacion
      key={confirmando ? tarea.id : "inactivo"}
      abierto={confirmando}
      alCancelar={() => setConfirmando(false)}
      alConfirmar={confirmarEliminacion}
      titulo="Eliminar tarea"
      mensaje={`Se eliminará "${tarea.titulo}" con sus subtareas, enlaces y comentarios. Esta acción no se puede deshacer.`}
      textoConfirmar="Eliminar tarea"
      cargando={eliminando}
      destructivo
    />
  );

  const detalleFrecuencia = frecuenciaDetalle(tarea);
  const etiquetaFrecuencia = FRECUENCIA_LABEL[tarea.tipoFrecuencia] ?? tarea.tipoFrecuencia;

  const chips = (
    <ul className="flex flex-wrap items-center gap-1.5 text-xs sm:text-sm" aria-label="Detalles de la tarea">
      {compacta ? (
        <>
          {deHoy ? (
            <li>
              <Insignia tono="success">Hoy</Insignia>
            </li>
          ) : null}
          {mostrarSemaforo ? (
            <li>
              <InsigniaSemaforo semaforo={semaforo} />
            </li>
          ) : null}
          {tarea.estado !== "NUEVA" ? (
            <li>
              <InsigniaEstado estado={tarea.estado} />
            </li>
          ) : null}
          {conFrecuencia ? (
            <li>
              <Insignia tono="info" contorno className="gap-1">
                <Icono nombre={esPuntual ? "calendario" : "repetir"} tamano={12} />
                {detalleFrecuencia
                  ? `${etiquetaFrecuencia} · ${detalleFrecuencia}`
                  : etiquetaFrecuencia}
              </Insignia>
            </li>
          ) : null}
        </>
      ) : (
        <>
          <li>
            <InsigniaEstado estado={tarea.estado} />
          </li>
          <li>
            <InsigniaPrioridad prioridad={tarea.prioridad} />
          </li>
          {mostrarSemaforo ? (
            <li>
              <InsigniaSemaforo semaforo={semaforo} />
            </li>
          ) : null}
          {tarea.proyecto && !ocultarProyecto ? (
            <li className="min-w-0">
              <Insignia tono="ghost" className="max-w-full gap-1">
                <Icono nombre="carpeta" tamano={12} />
                <span className="truncate" title={tarea.proyecto.nombre}>
                  {tarea.proyecto.nombre}
                </span>
              </Insignia>
            </li>
          ) : null}
          {!compacta && tarea.responsable ? (
            <li className="min-w-0">
              <Insignia tono="ghost" className="max-w-full gap-1">
                <Icono nombre="usuario" tamano={12} />
                <span className="truncate" title={tarea.responsable}>
                  {tarea.responsable}
                </span>
              </Insignia>
            </li>
          ) : null}
          <li>
            <Insignia tono="info" contorno className="gap-1">
              <Icono nombre={esPuntual ? "calendario" : "repetir"} tamano={12} />
              {detalleFrecuencia
                ? `${etiquetaFrecuencia} · ${detalleFrecuencia}`
                : etiquetaFrecuencia}
            </Insignia>
          </li>
          {!compacta && tarea.fechaLimite ? (
            <li>
              <Insignia tono="ghost" className="gap-1">
                <Icono nombre="reloj" tamano={12} />
                {formatearFechaCorta(tarea.fechaLimite)}
              </Insignia>
            </li>
          ) : null}
        </>
      )}
      {avance.total > 0 ? (
        <li>
          <Insignia tono="ghost" className="gap-1 tabular-nums">
            <Icono nombre="check" tamano={12} />
            {avance.hechas}/{avance.total} subtareas
          </Insignia>
        </li>
      ) : null}
    </ul>
  );

  const avisoSinFecha = sinFecha ? (
    <p className="text-suave flex items-center gap-1.5 text-xs">
      <Icono nombre="info" tamano={14} />
      Sin fecha: no aparece en el calendario
    </p>
  ) : null;

  if (compacta) {
    return (
      <li>
        <article
          className={`tarjeta-fila tarjeta-tarea relative flex items-start gap-1 py-1.5 pr-1 ${casilla ? "pl-2" : "pl-4"}`}
        >
          {casilla ? <div className="flex h-11 items-center">{casilla}</div> : null}
          <div className={`min-w-0 flex-1 space-y-1.5 py-3 ${marcando ? "opacity-70" : ""}`}>
            <Encabezado className="flex min-w-0">{titulo}</Encabezado>
            {chips}
            {sinFecha ? (
              <div className="relative z-10">
                <AsignarFecha tareaId={tarea.id} titulo={tarea.titulo} />
              </div>
            ) : null}
          </div>
          <div className="flex h-11 items-center">{botonEliminar}</div>
          {dialogo}
        </article>
      </li>
    );
  }

  return (
    <li className="@container">
      <article
        className={`tarjeta tarjeta-tarea acento-${semaforo.nivel} relative flex flex-col gap-4 p-4 @4xl:flex-row @4xl:items-center @4xl:gap-6 @4xl:p-5`}
      >
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex min-w-0 items-center gap-3">
            {casilla ? <div className="-m-2.5 shrink-0">{casilla}</div> : null}
            <Encabezado className="flex min-w-0 flex-1">{titulo}</Encabezado>
          </div>
          {chips}
          {tarea.descripcion ? (
            <p className="text-suave flex items-center gap-1.5 text-xs">
              <Icono nombre="mensaje" tamano={14} />
              <span className="truncate" title={tarea.descripcion}>
                {tarea.descripcion}
              </span>
            </p>
          ) : null}
          {avisoSinFecha}
        </div>

        <div className="border-base-300 flex min-w-0 flex-wrap items-center gap-x-4 gap-y-3 @4xl:w-[30rem] @4xl:shrink-0 @4xl:flex-nowrap @4xl:justify-end @4xl:border-s @4xl:ps-6">
          {avance.porcentaje !== null && avance.total > 0 ? (
            <div className="w-full @md:w-44 @4xl:w-40">
              <div className="mb-1.5 flex items-baseline justify-between text-xs">
                <span className="text-suave font-medium">Avance</span>
                <span className="text-verde font-bold tabular-nums">{avance.porcentaje} %</span>
              </div>
              <progress
                className={`progress block h-2 w-full ${avance.porcentaje === 100 ? "progress-success" : "progress-primary"}`}
                value={avance.porcentaje}
                max={100}
                aria-label={`Avance: ${avance.hechas} de ${avance.total} subtareas`}
              />
            </div>
          ) : null}
          <div className="flex w-full flex-wrap items-center gap-2 @md:w-auto">
            {sinFecha ? (
              <div className="relative z-10 w-full @md:w-auto">
                <AsignarFecha tareaId={tarea.id} titulo={tarea.titulo} />
              </div>
            ) : null}
            {puedeMarcar ? (
              <button
                type="button"
                onClick={alternarCompletada}
                disabled={marcando}
                aria-pressed={completada}
                aria-label={
                  completada
                    ? `Completada: deshacer "${tarea.titulo}"`
                    : `Completar "${tarea.titulo}"`
                }
                className={`btn btn-accion btn-accion-primario btn-tarjeta btn-tarjeta-icono ${marcando ? "opacity-70" : ""}`}
              >
                <Icono nombre="check" tamano={18} />
              </button>
            ) : null}
            <Link
              href={`/tareas/${tarea.id}/editar`}
              aria-label={`Editar "${tarea.titulo}"`}
              title={`Editar "${tarea.titulo}"`}
              className="btn btn-accion btn-accion-info btn-tarjeta btn-tarjeta-icono"
            >
              <Icono nombre="editar" tamano={18} />
            </Link>
            <div className="ms-auto @md:ms-0">{botonEliminar}</div>
          </div>
        </div>
        {dialogo}
      </article>
    </li>
  );
}
