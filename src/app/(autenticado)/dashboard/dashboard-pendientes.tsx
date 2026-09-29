// Bloque compacto de pendientes sin fecha, con acceso rápido para programarlos.

import { EstadoError } from "@/componentes/estado-error";
import { EstadoVacio } from "@/componentes/estado-vacio";
import { Enlace } from "@/componentes/enlace";
import { Tarjeta } from "@/componentes/shell/tarjeta";
import { TarjetaTarea } from "@/componentes/tarea/tarjeta-tarea";
import { semaforoDeTarea } from "@/lib/tareas/vista";
import type { ResultadoPendientes } from "./dashboard-data";

const TITULO = "Pendientes sin fecha";

export function BloquePendientes({ resultado }: { resultado: ResultadoPendientes | null }) {
  if (resultado === null || !resultado.ok) {
    return (
      <Tarjeta titulo={TITULO}>
        <EstadoError
          mensaje={resultado?.ok === false ? resultado.error : "Error al cargar los pendientes."}
        />
      </Tarjeta>
    );
  }

  const { tareas, total } = resultado;
  if (total === 0) {
    return (
      <Tarjeta titulo={TITULO}>
        <EstadoVacio
          icono="check-circulo"
          titulo="No tienes pendientes sin fecha"
          descripcion="Las tareas puntuales sin fecha aparecerán aquí hasta que las programes."
        />
      </Tarjeta>
    );
  }

  return (
    <Tarjeta
      titulo={`${TITULO} (${total})`}
      accion={
        <Enlace href="/tareas?vista=pendientes" className="text-sm">
          {total > tareas.length ? `Ver los ${total}` : "Ver todos"}
        </Enlace>
      }
    >
      <p className="text-suave mb-3 text-xs">
        No aparecen en el calendario hasta que les asignes una fecha.
      </p>
      <ul className="lista-filas">
        {tareas.map((t) => (
          <TarjetaTarea
            key={t.id}
            tarea={t}
            semaforo={semaforoDeTarea(t)}
            variante="compacta"
            marcable
            sinFecha
            nivelTitulo={3}
          />
        ))}
      </ul>
    </Tarjeta>
  );
}
