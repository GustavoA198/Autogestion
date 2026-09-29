import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { BotonEnlace, Enlace } from "@/componentes/enlace";
import { Icono } from "@/componentes/icono";
import { Insignia } from "@/componentes/insignia";
import { Tarjeta } from "@/componentes/shell/tarjeta";
import { BarraAvance } from "@/componentes/tarea/barra-avance";
import { TituloSeccion } from "@/componentes/shell/titulo-seccion";
import {
  InsigniaEstado,
  InsigniaPrioridad,
  InsigniaSemaforo,
} from "@/componentes/tarea/insignias-tarea";
import { exigirSesion } from "@/lib/auth/sesion";
import { avanceDeTarea } from "@/lib/tareas/avance";
import { listarTareasCompletadas, obtenerTarea } from "@/lib/tareas/operaciones";
import { FRECUENCIA_LABEL, formatearFecha, frecuenciaDetalle } from "@/lib/tareas/presentacion";
import { vencimientoEfectivo } from "@/lib/tareas/semaforo";
import { leerEntornoTiempo } from "@/lib/tareas/tiempo";
import { estaAbierta } from "@/lib/tareas/validacion";
import { semaforoDeTarea } from "@/lib/tareas/vista";
import { BotonEliminarTarea } from "./boton-eliminar";
import { PanelSubtareas } from "./panel-subtareas";
import { PanelComentarios } from "./panel-comentarios";
import { PanelEnlaces } from "./panel-enlaces";
import { SelectorEstado } from "./selector-estado";

export const dynamic = "force-dynamic";

const MAX_COMPLETADAS = 10;

function DatoLateral({ etiqueta, children }: { etiqueta: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-suave text-xs font-bold tracking-wide uppercase">{etiqueta}</dt>
      <dd className="mt-1 text-sm font-medium break-words">
        {children ?? <span className="text-tenue">Sin definir</span>}
      </dd>
    </div>
  );
}

export default async function DetalleTarea({ params }: PageProps<"/tareas/[id]">) {
  await exigirSesion();
  const { id } = await params;
  const tarea = await obtenerTarea(id);
  if (!tarea) notFound();

  const { TZ } = leerEntornoTiempo();
  const completadas = await listarTareasCompletadas(id, MAX_COMPLETADAS);
  const semaforo = semaforoDeTarea(tarea);
  const vence = vencimientoEfectivo(tarea);
  const esPuntual = tarea.tipoFrecuencia === "PUNTUAL";
  const cerrada = !estaAbierta(tarea.estado);
  const formatoFechaHora = new Intl.DateTimeFormat("es-CO", {
    timeZone: TZ,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  const avance = avanceDeTarea(tarea);

  return (
    <>
      <nav aria-label="Ubicación" className="mb-3">
        <Enlace
          href="/tareas"
          discreto
          className="text-suave inline-flex items-center gap-1 text-sm"
        >
          <Icono nombre="chevron-izquierda" tamano={16} />
          Tareas
        </Enlace>
      </nav>
      <TituloSeccion
        modulo="Tarea"
        titulo={tarea.titulo}
        descripcion={
          <span className="flex flex-wrap items-center gap-2">
            <InsigniaEstado estado={tarea.estado} />
            <InsigniaPrioridad prioridad={tarea.prioridad} />
            {vence !== null || cerrada ? <InsigniaSemaforo semaforo={semaforo} /> : null}
            <Insignia tono="info" contorno>
              {FRECUENCIA_LABEL[tarea.tipoFrecuencia] ?? tarea.tipoFrecuencia}
            </Insignia>
            {tarea.proyecto ? (
              <Enlace href={`/proyectos/${tarea.proyecto.id}`} className="text-sm">
                {tarea.proyecto.nombre}
              </Enlace>
            ) : null}
          </span>
        }
        accion={
          <>
            <BotonEnlace href={`/tareas/${tarea.id}/editar`} variante="secundario">
              <Icono nombre="editar" tamano={16} />
              Editar
            </BotonEnlace>
            <BotonEliminarTarea id={tarea.id} nombre={tarea.titulo} />
          </>
        }
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-5">
          <Tarjeta titulo="Estado y avance">
            <div className="max-w-xs">
              <SelectorEstado id={tarea.id} estado={tarea.estado} />
            </div>
            {avance.porcentaje !== null ? (
              <div className="space-y-2">
                <p className="text-sm font-bold">Avance</p>
                <BarraAvance valor={avance.porcentaje} completada={tarea.estado === "COMPLETADA"} />
                <p className="text-suave text-sm">
                  {avance.total > 0
                    ? `${avance.hechas} de ${avance.total} ${avance.total === 1 ? "subtarea hecha" : "subtareas hechas"}. El avance se calcula desde las subtareas.`
                    : "Una tarea completada cuenta como 100 %."}
                </p>
              </div>
            ) : null}
          </Tarjeta>

          {tarea.descripcion ? (
            <Tarjeta titulo="Descripción">
              <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
                {tarea.descripcion}
              </p>
            </Tarjeta>
          ) : null}

          <PanelSubtareas
            tareaId={tarea.id}
            estado={tarea.estado}
            cerrada={cerrada}
            subtareas={tarea.subtareas.map((s) => ({
              id: s.id,
              texto: s.texto,
              descripcion: s.descripcion,
              hecho: s.hecho,
            }))}
          />
          <PanelEnlaces
            tareaId={tarea.id}
            enlaces={tarea.enlaces.map((e) => ({ id: e.id, etiqueta: e.etiqueta, url: e.url }))}
          />
          <PanelComentarios
            tareaId={tarea.id}
            comentarios={tarea.comentarios.map((c) => ({
              id: c.id,
              texto: c.texto,
              fechaTexto: formatoFechaHora.format(c.creadoEn),
            }))}
          />

          {!esPuntual || completadas.length > 0 ? (
            <Tarjeta titulo="Historial de completadas">
              {completadas.length === 0 ? (
                <p className="text-suave text-sm">
                  Aún no se ha marcado como completada ningún día.
                </p>
              ) : (
                <ul className="flex flex-wrap gap-2">
                  {completadas.map((c) => (
                    <li key={c.fecha.toISOString()}>
                      <Insignia tono="success" contorno className="gap-1">
                        <Icono nombre="check" tamano={12} />
                        {formatearFecha(c.fecha)}
                      </Insignia>
                    </li>
                  ))}
                </ul>
              )}
            </Tarjeta>
          ) : null}
        </div>

        <aside className="min-w-0 space-y-5" aria-label="Datos de la tarea">
          <Tarjeta titulo="Fechas">
            <dl className="space-y-4">
              {esPuntual ? (
                <DatoLateral etiqueta="Para el día">
                  {tarea.fechaPuntual ? formatearFecha(tarea.fechaPuntual) : null}
                </DatoLateral>
              ) : null}
              <DatoLateral etiqueta="Inicio">
                {tarea.fechaInicio ? formatearFecha(tarea.fechaInicio) : null}
              </DatoLateral>
              <DatoLateral etiqueta="Límite">
                {tarea.fechaLimite ? formatearFecha(tarea.fechaLimite) : null}
              </DatoLateral>
              <DatoLateral etiqueta="Vencimiento">
                {vence !== null || cerrada ? <InsigniaSemaforo semaforo={semaforo} /> : null}
              </DatoLateral>
              <DatoLateral etiqueta="Creada">{formatoFechaHora.format(tarea.creadoEn)}</DatoLateral>
              <DatoLateral etiqueta="Actualizada">
                {formatoFechaHora.format(tarea.actualizadoEn)}
              </DatoLateral>
            </dl>
          </Tarjeta>

          <Tarjeta titulo="Personas">
            <dl className="space-y-3">
              <DatoLateral etiqueta="Responsable">{tarea.responsable}</DatoLateral>
              <DatoLateral etiqueta="Asignada por">{tarea.asignadoPor}</DatoLateral>
            </dl>
          </Tarjeta>

          <Tarjeta titulo="Recurrencia">
            <dl className="space-y-3">
              <DatoLateral etiqueta="Frecuencia">
                {FRECUENCIA_LABEL[tarea.tipoFrecuencia] ?? tarea.tipoFrecuencia}
              </DatoLateral>
              <DatoLateral etiqueta="Cuándo toca">{frecuenciaDetalle(tarea)}</DatoLateral>
            </dl>
          </Tarjeta>
        </aside>
      </div>
    </>
  );
}
