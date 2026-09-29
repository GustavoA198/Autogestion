// Limpieza de notificaciones ligadas a tareas (sin FK: la referencia es el id de la tarea).
import type { Prisma } from "@/generated/prisma/client";

export const TIPOS_NOTIFICACION_TAREA: Array<"TAREA_VENCE_HOY" | "TAREA_VENCE_PRONTO"> = [
  "TAREA_VENCE_HOY",
  "TAREA_VENCE_PRONTO",
];

// Estados que no deben seguir avisando de vencimientos
const ESTADOS_SIN_AVISO = ["PAUSADA", "COMPLETADA", "CANCELADA"];

export function estadoSinAviso(estado: string): boolean {
  return ESTADOS_SIN_AVISO.includes(estado);
}

// Elimina las notificaciones de una tarea; se usa al borrarla
export async function eliminarNotificacionesDeTarea(
  tx: Prisma.TransactionClient,
  tareaId: string,
): Promise<void> {
  await tx.notificacion.deleteMany({
    where: { tipo: { in: TIPOS_NOTIFICACION_TAREA }, referenciaId: tareaId },
  });
}

// Descarta las notificaciones pendientes de una tarea que dejó de estar abierta
export async function descartarNotificacionesDeTarea(
  tx: Prisma.TransactionClient,
  tareaId: string,
): Promise<void> {
  const pendientes = await tx.notificacion.findMany({
    where: { tipo: { in: TIPOS_NOTIFICACION_TAREA }, referenciaId: tareaId, descartada: null },
    select: { id: true },
  });
  if (pendientes.length === 0) return;
  await tx.notificacionDescartada.createMany({
    data: pendientes.map((n) => ({ notificacionId: n.id })),
    skipDuplicates: true,
  });
}
