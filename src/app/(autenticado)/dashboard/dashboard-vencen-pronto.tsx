// Bloque de tareas abiertas que vencen en los próximos días (o ya vencieron), ordenadas por fecha.

import { EstadoError } from "@/componentes/estado-error";
import { EstadoVacio } from "@/componentes/estado-vacio";
import { Enlace } from "@/componentes/enlace";
import { Tarjeta } from "@/componentes/shell/tarjeta";
import { TarjetaTarea } from "@/componentes/tarea/tarjeta-tarea";
import type { ResultadoVencenPronto } from "./dashboard-data";

export function BloqueVencenPronto({ resultado }: { resultado: ResultadoVencenPronto | null }) {
  if (resultado === null || !resultado.ok) {
    return (
      <Tarjeta titulo="Vencen pronto">
        <EstadoError
          mensaje={resultado?.ok === false ? resultado.error : "Error al cargar tareas."}
        />
      </Tarjeta>
    );
  }

  const { tareas, total } = resultado;
  if (tareas.length === 0) {
    return (
      <Tarjeta titulo="Vencen pronto">
        <EstadoVacio
          icono="check-circulo"
          titulo="Nada por vencer en 10 días"
          descripcion="Las tareas abiertas con fecha límite cercana aparecerán aquí."
        />
      </Tarjeta>
    );
  }

  return (
    <Tarjeta
      titulo="Vencen pronto"
      accion={
        <Enlace href="/tareas?vista=abiertas&vencen=10" className="text-sm">
          {total > tareas.length ? `Ver las ${total}` : "Ver en tareas"}
        </Enlace>
      }
    >
      <ul className="lista-filas">
        {tareas.map((t) => (
          <TarjetaTarea
            key={t.id}
            tarea={t.tarea}
            semaforo={t.semaforo}
            variante="compacta"
            nivelTitulo={3}
          />
        ))}
      </ul>
    </Tarjeta>
  );
}
