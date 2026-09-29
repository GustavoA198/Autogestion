// Bloque de tareas del día con tarjetas compactas: casilla, semáforo y menú de acciones.

import { EstadoError } from "@/componentes/estado-error";
import { EstadoVacio } from "@/componentes/estado-vacio";
import { Enlace } from "@/componentes/enlace";
import { Tarjeta } from "@/componentes/shell/tarjeta";
import { TarjetaTarea } from "@/componentes/tarea/tarjeta-tarea";
import type { TareaDelDia } from "./dashboard-data";

type Props = {
  recurrentes: TareaDelDia[];
  puntuales: TareaDelDia[];
};

function GrupoTareas({
  id,
  titulo,
  tareas,
}: {
  id: string;
  titulo: string;
  tareas: TareaDelDia[];
}) {
  if (tareas.length === 0) return null;
  return (
    <section aria-labelledby={id}>
      <h3 id={id} className="text-suave mb-2 text-xs font-bold tracking-wide uppercase">
        {titulo}
      </h3>
      <ul className="lista-filas">
        {tareas.map((t) => (
          <TarjetaTarea
            key={t.id}
            tarea={t}
            semaforo={t.semaforo}
            variante="compacta"
            nivelTitulo={4}
            marcable
            completadaHoy={t.completadaHoy}
          />
        ))}
      </ul>
    </section>
  );
}

export function BloqueTareas({ recurrentes, puntuales }: Props) {
  if (recurrentes.length + puntuales.length === 0) {
    return (
      <Tarjeta titulo="Tareas del día">
        <EstadoVacio
          icono="lista"
          titulo="Sin tareas para hoy"
          descripcion="No hay tareas fijas ni puntuales programadas para este día."
        />
      </Tarjeta>
    );
  }

  return (
    <Tarjeta
      titulo="Tareas del día"
      accion={
        <Enlace href="/tareas" className="text-sm">
          Ver todas
        </Enlace>
      }
    >
      <GrupoTareas id="tareas-recurrentes-heading" titulo="Fijas" tareas={recurrentes} />
      <GrupoTareas id="tareas-puntuales-heading" titulo="Puntuales" tareas={puntuales} />
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
