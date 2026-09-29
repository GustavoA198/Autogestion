// Pendiente: tarea puntual abierta sin fecha, que vive fuera del calendario hasta que se programe.
import { estaAbierta } from "@/lib/tareas/validacion";

type TareaConFechas = {
  tipoFrecuencia: string;
  estado: string;
  fechaPuntual: Date | null;
  fechaLimite: Date | null;
};

// Solo las puntuales abiertas sin día ni fecha límite; las recurrentes nunca son pendientes
export function esPendiente(tarea: TareaConFechas): boolean {
  return (
    tarea.tipoFrecuencia === "PUNTUAL" &&
    estaAbierta(tarea.estado) &&
    tarea.fechaPuntual === null &&
    tarea.fechaLimite === null
  );
}

// Valida un texto AAAA-MM-DD y lo convierte a medianoche UTC; null si no es una fecha real
export function fechaDeTexto(valor: unknown): Date | null {
  if (typeof valor !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return null;
  const fecha = new Date(`${valor}T00:00:00.000Z`);
  if (Number.isNaN(fecha.getTime())) return null;
  return fecha.toISOString().slice(0, 10) === valor ? fecha : null;
}
