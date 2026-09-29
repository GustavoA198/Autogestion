// Carga de las tareas completadas de una semana para el reporte semanal.
import { inicioDelDiaEnZona, sumarDias, type RangoFechas } from "@/lib/notas/periodo";
import type { TareaReporte } from "@/lib/notas/reporte";
import { obtenerPrisma } from "@/lib/prisma";
import { leerEntornoTiempo } from "@/lib/tareas/tiempo";

// Completadas de la semana: marcas diarias (TareaCompletada) más tareas cuyo estado cambió a Completada
export async function tareasCompletadasEnSemana({ desde, hasta }: RangoFechas): Promise<TareaReporte[]> {
  const { TZ } = leerEntornoTiempo();
  const inicio = inicioDelDiaEnZona(desde, TZ);
  const fin = inicioDelDiaEnZona(sumarDias(hasta, 1), TZ);
  const seleccion = { id: true, titulo: true, proyecto: { select: { id: true, nombre: true } } };

  const [marcas, cerradas] = await Promise.all([
    obtenerPrisma().tareaCompletada.findMany({
      where: { fecha: { gte: desde, lte: hasta } },
      include: { tarea: { select: seleccion } },
      orderBy: { fecha: "asc" },
    }),
    obtenerPrisma().tarea.findMany({
      where: {
        estado: "COMPLETADA",
        actualizadoEn: { gte: inicio, lt: fin },
        completadas: { none: {} },
      },
      select: seleccion,
      orderBy: { actualizadoEn: "asc" },
    }),
  ]);

  // Una recurrente completada varios días cuenta cada día; las cerradas por estado, solo si no tienen ninguna marca
  const tareas = [...marcas.map((m) => m.tarea), ...cerradas];
  return tareas.map((t) => ({ titulo: t.titulo, proyecto: t.proyecto }));
}
