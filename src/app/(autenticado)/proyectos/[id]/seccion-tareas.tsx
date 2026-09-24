import Link from "next/link";
import { Tarjeta } from "@/componentes/shell/tarjeta";
import { Insignia } from "@/componentes/insignia";
import { listarTareasDeProyecto } from "@/lib/tareas/operaciones";
import { leerEntornoTiempo } from "@/lib/tareas/tiempo";
import { correspondeHoy } from "@/lib/tareas/recurrencia";

const FRECUENCIA_LABEL: Record<string, string> = {
  DIARIA: "Diaria",
  SEMANAL: "Semanal",
  MENSUAL: "Mensual",
  PUNTUAL: "Puntual",
};

const DIA_SEMANA_LABEL = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function frecuenciaDetalle(tarea: {
  tipoFrecuencia: string;
  diaSemana: number | null;
  diaMes: number | null;
  fechaPuntual: Date | null;
}): string {
  switch (tarea.tipoFrecuencia) {
    case "DIARIA":
      return "Cada día";
    case "SEMANAL":
      return `Cada ${DIA_SEMANA_LABEL[tarea.diaSemana ?? 0]}`;
    case "MENSUAL":
      return `Día ${tarea.diaMes}`;
    case "PUNTUAL":
      if (!tarea.fechaPuntual) return "Sin fecha";
      return tarea.fechaPuntual.toLocaleDateString("es-CO", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    default:
      return "";
  }
}

export async function SeccionTareas({ proyectoId }: { proyectoId: string }) {
  const tareas = await listarTareasDeProyecto(proyectoId);
  const { TZ } = leerEntornoTiempo();
  const ahora = new Date();

  const deHoy = tareas.filter((t) =>
    correspondeHoy(
      {
        tipoFrecuencia: t.tipoFrecuencia,
        diaSemana: t.diaSemana,
        diaMes: t.diaMes,
        fechaPuntual: t.fechaPuntual,
      },
      ahora,
      TZ,
    ),
  );

  return (
    <Tarjeta
      titulo="Tareas"
      accion={
        <Link href="/tareas/nueva" className="btn btn-outline btn-sm">
          Nueva
        </Link>
      }
    >
      {tareas.length === 0 ? (
        <p className="text-sm opacity-70">Este proyecto aún no tiene tareas asociadas.</p>
      ) : (
        <ul className="divide-base-300 divide-y">
          {tareas.map((tarea) => (
            <li key={tarea.id} className="flex items-center justify-between gap-2 py-2">
              <span className="flex min-w-0 items-center gap-2">
                <Link
                  href={`/tareas/${tarea.id}/editar`}
                  className="link link-hover truncate font-medium"
                >
                  {tarea.titulo}
                </Link>
                <Insignia tono="info" contorno>
                  {FRECUENCIA_LABEL[tarea.tipoFrecuencia]}
                </Insignia>
                <span className="text-xs opacity-70">{frecuenciaDetalle(tarea)}</span>
                {deHoy.some((t) => t.id === tarea.id) && <Insignia tono="success">Hoy</Insignia>}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Tarjeta>
  );
}
