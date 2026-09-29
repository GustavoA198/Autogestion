import Link from "next/link";
import { Icono } from "@/componentes/icono";
import { InsigniaEstado, InsigniaSemaforo } from "@/componentes/tarea/insignias-tarea";
import { diaDesdeClave } from "@/lib/calendario/fechas";
import { fechaCorta } from "@/lib/calendario/formato";
import { nombreAccesibleTarea, type EventoTarea } from "@/lib/calendario/tareas";
import { CLASES_SEMAFORO } from "@/lib/tareas/semaforo";
import { BORDE_SEMAFORO } from "./comun";

// Fila de la agenda para una tarea: casilla decorativa, título, semáforo con texto, estado y proyecto
export function FilaTarea({
  tarea,
  mostrarFecha = false,
}: {
  tarea: EventoTarea;
  // En el bloque de vencidas se indica el día en que vencieron
  mostrarFecha?: boolean;
}) {
  const { nivel } = tarea.semaforo;
  const dia = mostrarFecha ? diaDesdeClave(tarea.fecha) : null;
  return (
    <li>
      <Link
        href={`/tareas/${tarea.id}`}
        aria-label={nombreAccesibleTarea(tarea)}
        className="foco-interior hover:bg-hover grid min-h-14 min-w-0 grid-cols-[4.5rem_minmax(0,1fr)] items-start gap-3 px-4 py-3 text-left transition-colors duration-150 sm:grid-cols-[5.5rem_minmax(0,1fr)]"
      >
        <span className="flex items-center gap-2 pt-px" aria-hidden="true">
          <span
            className={`grid size-6 shrink-0 place-items-center rounded-full border-2 ${BORDE_SEMAFORO[nivel]} ${CLASES_SEMAFORO[nivel].fondo}`}
          >
            <Icono nombre="bandera" tamano={14} />
          </span>
          <span className="text-suave font-mono text-xs leading-4 tabular-nums">
            {dia ? fechaCorta(dia) : "Vence"}
          </span>
        </span>
        <span className={`min-w-0 border-l-[3px] pl-3 ${BORDE_SEMAFORO[nivel]}`}>
          <span className="line-clamp-2 block font-bold" title={tarea.titulo}>
            {tarea.titulo}
          </span>
          <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            <InsigniaSemaforo semaforo={tarea.semaforo} />
            <InsigniaEstado estado={tarea.estado} />
            {tarea.proyecto ? (
              <span className="text-suave inline-flex min-w-0 items-center gap-1">
                <span aria-hidden="true">·</span>
                <span className="truncate" title={tarea.proyecto.nombre}>
                  {tarea.proyecto.nombre}
                </span>
              </span>
            ) : null}
          </span>
        </span>
      </Link>
    </li>
  );
}
