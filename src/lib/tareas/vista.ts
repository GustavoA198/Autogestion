// Ayudas de presentación de tareas para páginas de servidor: qué toca hoy y su semáforo.
import { correspondeHoy } from "@/lib/tareas/recurrencia";
import {
  calcularSemaforo,
  vencimientoEfectivo,
  type ResultadoSemaforo,
} from "@/lib/tareas/semaforo";

type TareaParaHoy = {
  id: string;
  tipoFrecuencia: string;
  diaSemana: number | null;
  diaMes: number | null;
  fechaPuntual: Date | null;
  estado: string;
  fechaInicio: Date | null;
  fechaLimite: Date | null;
  activa: boolean;
};

// Toca hoy según la recurrencia, o es una puntual que se completó hoy (sigue visible para poder deshacer)
export function esDeHoy(
  tarea: TareaParaHoy,
  completadasHoy: ReadonlySet<string>,
  ahora: Date,
  zona: string,
): boolean {
  if (!tarea.activa && tarea.estado !== "COMPLETADA") return false;
  if (correspondeHoy(tarea, ahora, zona)) return true;
  return tarea.estado === "COMPLETADA" && completadasHoy.has(tarea.id);
}

// Semáforo de una tarea a partir de su vencimiento efectivo y su estado
export function semaforoDeTarea(tarea: {
  fechaLimite: Date | null;
  fechaPuntual: Date | null;
  estado: string;
}): ResultadoSemaforo {
  return calcularSemaforo({ vencimiento: vencimientoEfectivo(tarea), estado: tarea.estado });
}
