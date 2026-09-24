// Bloque de tareas del dia con checkbox para marcar completada.
// Es "use client" porque necesita interactividad (checkbox) y revalidatePath.

"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Tarjeta } from "@/componentes/shell/tarjeta";
import { EstadoError } from "@/componentes/estado-error";
import { EstadoVacio } from "@/componentes/estado-vacio";
import { accionCompletarTarea } from "@/app/(autenticado)/tareas/acciones";
import type { TareaDelDia } from "./dashboard-data";

type Props = {
  recurrentes: TareaDelDia[];
  puntuales: TareaDelDia[];
};

function TareaFila({ tarea }: { tarea: TareaDelDia }) {
  const [pending, startTransition] = useTransition();

  function marcar() {
    startTransition(async () => {
      await accionCompletarTarea(tarea.id);
    });
  }

  return (
    <li className="flex items-center gap-3 py-2">
      <input
        type="checkbox"
        className="checkbox checkbox-primary checkbox-sm"
        checked={false}
        onChange={marcar}
        disabled={pending}
        aria-label={`Marcar "${tarea.titulo}" como completada`}
      />
      <span className={pending ? "opacity-50" : ""}>{tarea.titulo}</span>
      {tarea.proyecto && (
        <Link
          href={`/proyectos/${tarea.proyecto.id}`}
          className="badge badge-ghost badge-sm ml-auto text-xs"
          onClick={(e) => e.stopPropagation()}
        >
          {tarea.proyecto.nombre}
        </Link>
      )}
    </li>
  );
}

export function BloqueTareas({ recurrentes, puntuales }: Props) {
  const hayRecurrentes = recurrentes.length > 0;
  const hayPuntuales = puntuales.length > 0;
  const total = recurrentes.length + puntuales.length;

  if (total === 0) {
    return (
      <Tarjeta titulo="Tareas del día">
        <EstadoVacio
          icono="lista"
          titulo="Sin tareas para hoy"
          descripcion="No hay tareas recurrentes ni puntuales programadas para este día."
        />
      </Tarjeta>
    );
  }

  return (
    <Tarjeta
      titulo="Tareas del día"
      accion={
        <Link href="/tareas" className="btn btn-ghost btn-xs">
          Ver todas
        </Link>
      }
    >
      {hayRecurrentes && (
        <section aria-labelledby="tareas-recurrentes-heading">
          <h3
            id="tareas-recurrentes-heading"
            className="text-base-content/60 mb-2 text-xs font-semibold uppercase"
          >
            Fijas
          </h3>
          <ul className="divide-base-300 space-y-1 divide-y">
            {recurrentes.map((t) => (
              <TareaFila key={t.id} tarea={t} />
            ))}
          </ul>
        </section>
      )}
      {hayPuntuales && (
        <section
          aria-labelledby="tareas-puntuales-heading"
          className={hayRecurrentes ? "mt-4" : ""}
        >
          <h3
            id="tareas-puntuales-heading"
            className="text-base-content/60 mb-2 text-xs font-semibold uppercase"
          >
            Puntuales
          </h3>
          <ul className="divide-base-300 space-y-1 divide-y">
            {puntuales.map((t) => (
              <TareaFila key={t.id} tarea={t} />
            ))}
          </ul>
        </section>
      )}
    </Tarjeta>
  );
}

export function BloqueTareasError({ mensaje }: { mensaje: string }) {
  return (
    <Tarjeta titulo="Tareas del día">
      <EstadoError mensaje={mensaje} />
    </Tarjeta>
  );
}
