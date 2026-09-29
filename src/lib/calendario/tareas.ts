// Tareas dentro del calendario: tipo serializable, reparto por día y textos accesibles; lógica pura.
import { ESTADO_LABEL } from "@/lib/tareas/presentacion";
import type { NivelSemaforo } from "@/lib/tareas/semaforo";
import { claveDia, diaDesdeClave, diferenciaDias, type DiaCivil } from "./fechas";
import { MAX_DIAS_CONSULTA } from "./rango";

// Tarea lista para pintar en el calendario; las fechas viajan como texto y el semáforo llega calculado
export type EventoTarea = {
  id: string;
  titulo: string;
  // Día de vencimiento efectivo en formato AAAA-MM-DD
  fecha: string;
  estado: string;
  prioridad: string;
  proyecto: { id: string; nombre: string } | null;
  semaforo: { nivel: NivelSemaforo; texto: string; diasRestantes: number | null };
};

const PESO_PRIORIDAD: Record<string, number> = { URGENTE: 0, ALTA: 1, MEDIA: 2, BAJA: 3 };

// Orden dentro de un día: primero las más urgentes y luego por título
export function compararTareas(a: EventoTarea, b: EventoTarea): number {
  const pesoA = PESO_PRIORIDAD[a.prioridad] ?? 2;
  const pesoB = PESO_PRIORIDAD[b.prioridad] ?? 2;
  return pesoA - pesoB || a.titulo.localeCompare(b.titulo, "es");
}

// Agrupa las tareas por clave de día (AAAA-MM-DD) para los días indicados
export function tareasPorDia(
  tareas: readonly EventoTarea[],
  dias: readonly DiaCivil[],
): Map<string, EventoTarea[]> {
  const mapa = new Map<string, EventoTarea[]>();
  for (const dia of dias) mapa.set(claveDia(dia), []);
  for (const tarea of tareas) mapa.get(tarea.fecha)?.push(tarea);
  for (const lista of mapa.values()) lista.sort(compararTareas);
  return mapa;
}

// Tareas cuyo vencimiento quedó antes de hoy, de la más antigua a la más reciente
export function tareasVencidas(tareas: readonly EventoTarea[], claveHoy: string): EventoTarea[] {
  return tareas
    .filter((tarea) => tarea.fecha < claveHoy)
    .sort((a, b) => a.fecha.localeCompare(b.fecha) || compararTareas(a, b));
}

// Cantidad de tareas distintas con vencimiento en alguno de los días indicados
export function contarTareasEnDias(
  porDia: ReadonlyMap<string, readonly EventoTarea[]>,
  vencidas: readonly EventoTarea[],
): number {
  let total = vencidas.length;
  for (const lista of porDia.values()) total += lista.length;
  return total;
}

// Vencimiento en palabras para lectores de pantalla: "vence en 3 días", "vencida hace 2 días"
export function textoVencimiento(semaforo: EventoTarea["semaforo"]): string {
  const dias = semaforo.diasRestantes;
  if (dias === null) return "sin fecha de vencimiento";
  if (dias < 0) return `vencida hace ${-dias} ${dias === -1 ? "día" : "días"}`;
  if (dias === 0) return "vence hoy";
  if (dias === 1) return "vence mañana";
  return `vence en ${dias} días`;
}

// Nombre accesible completo: "Tarea: Informe, vence en 3 días, estado En desarrollo"
export function nombreAccesibleTarea(tarea: EventoTarea): string {
  const partes = [
    `Tarea: ${tarea.titulo}`,
    textoVencimiento(tarea.semaforo),
    `estado ${ESTADO_LABEL[tarea.estado] ?? tarea.estado}`,
  ];
  if (tarea.proyecto) partes.push(`proyecto ${tarea.proyecto.nombre}`);
  return partes.join(", ");
}

// Valida las claves AAAA-MM-DD que llegan al servidor; hasta es exclusivo y el rango tiene tope
export function validarRangoClaves(
  desde: unknown,
  hasta: unknown,
): { desde: DiaCivil; hasta: DiaCivil } | null {
  if (typeof desde !== "string" || typeof hasta !== "string") return null;
  const inicio = diaDesdeClave(desde);
  const fin = diaDesdeClave(hasta);
  if (!inicio || !fin) return null;
  const dias = diferenciaDias(inicio, fin);
  if (dias <= 0 || dias > MAX_DIAS_CONSULTA) return null;
  return { desde: inicio, hasta: fin };
}
