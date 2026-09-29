import { BotonEnlace } from "@/componentes/enlace";
import { Icono } from "@/componentes/icono";
import { Tarjeta } from "@/componentes/shell/tarjeta";
import { TarjetaTarea } from "@/componentes/tarea/tarjeta-tarea";
import { listarProyectos } from "@/lib/proyectos/operaciones";
import { idsCompletadasHoy, listarTareasDeProyecto } from "@/lib/tareas/operaciones";
import { leerEntornoTiempo } from "@/lib/tareas/tiempo";
import { esDeHoy, semaforoDeTarea } from "@/lib/tareas/vista";
import { ClonarTareas } from "./clonar-tareas";

export async function SeccionTareas({ proyectoId }: { proyectoId: string }) {
  const [tareas, proyectos] = await Promise.all([
    listarTareasDeProyecto(proyectoId),
    listarProyectos(),
  ]);
  const { TZ } = leerEntornoTiempo();
  const ahora = new Date();

  const completadasHoy = await idsCompletadasHoy(tareas.map((t) => t.id));
  const idsDeHoy = new Set(
    tareas.filter((t) => esDeHoy(t, completadasHoy, ahora, TZ)).map((t) => t.id),
  );

  return (
    <Tarjeta
      titulo="Tareas"
      accion={
        <div className="flex flex-wrap items-center justify-end gap-2">
          <ClonarTareas proyectoId={proyectoId} proyectos={proyectos} tareas={tareas} />
          <BotonEnlace href="/tareas/nueva" variante="secundario" tamano="pequeno">
            <Icono nombre="mas" tamano={14} />
            Nueva
          </BotonEnlace>
        </div>
      }
    >
      {tareas.length === 0 ? (
        <p className="text-suave text-sm">Este proyecto aún no tiene tareas asociadas.</p>
      ) : (
        <ul className="lista-filas">
          {tareas.map((tarea) => (
            <TarjetaTarea
              key={tarea.id}
              tarea={tarea}
              semaforo={semaforoDeTarea(tarea)}
              variante="compacta"
              marcable={idsDeHoy.has(tarea.id) || tarea.tipoFrecuencia === "PUNTUAL"}
              completadaHoy={completadasHoy.has(tarea.id)}
              ocultarProyecto
              deHoy={idsDeHoy.has(tarea.id)}
              conFrecuencia
              nivelTitulo={3}
            />
          ))}
        </ul>
      )}
    </Tarjeta>
  );
}
