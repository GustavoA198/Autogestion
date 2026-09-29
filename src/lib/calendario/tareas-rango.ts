// Carga de tareas abiertas para el calendario según su vencimiento efectivo; solo servidor.
import { obtenerPrisma } from "@/lib/prisma";
import { claveDiaEnZona, claveDiaPuntual, claveDiaUTC } from "@/lib/tareas/recurrencia";
import { calcularSemaforo, vencimientoEfectivo } from "@/lib/tareas/semaforo";
import { leerEntornoTiempo } from "@/lib/tareas/tiempo";
import { claveDia, type DiaCivil } from "./fechas";
import type { EventoTarea } from "./tareas";

const MS_DIA = 86_400_000;
const MAX_TAREAS = 500;

function aClaveNumerica(dia: DiaCivil): number {
  return dia.anio * 10000 + dia.mes * 100 + dia.dia;
}

function aFechaUTC(dia: DiaCivil): Date {
  return new Date(`${claveDia(dia)}T00:00:00.000Z`);
}

function aTextoClave(clave: number): string {
  const texto = String(clave);
  return `${texto.slice(0, 4)}-${texto.slice(4, 6)}-${texto.slice(6, 8)}`;
}

// Tareas puntuales abiertas con vencimiento en [desde, hasta); con incluirVencidas suma las vencidas anteriores a hoy
export async function listarTareasEnRango(
  desde: DiaCivil,
  hasta: DiaCivil,
  incluirVencidas: boolean,
): Promise<EventoTarea[]> {
  const { TZ } = leerEntornoTiempo();
  const ahora = new Date();
  const claveHoy = claveDiaEnZona(ahora, TZ);
  const claveDesde = aClaveNumerica(desde);
  const claveHasta = aClaveNumerica(hasta);

  const desdeUTC = aFechaUTC(desde);
  const hastaUTC = aFechaUTC(hasta);
  // La fecha puntual puede traer hora: se amplía un día a cada lado y se afina después por clave
  const filtroLimite = {
    lt: hastaUTC,
    ...(incluirVencidas ? {} : { gte: desdeUTC }),
  };
  const filtroPuntual = {
    lt: new Date(hastaUTC.getTime() + MS_DIA),
    ...(incluirVencidas ? {} : { gte: new Date(desdeUTC.getTime() - MS_DIA) }),
  };

  const filas = await obtenerPrisma().tarea.findMany({
    where: {
      activa: true,
      // Las recurrentes no entran al calendario; los pendientes sin fecha tampoco (no cumplen el OR)
      tipoFrecuencia: "PUNTUAL",
      estado: { notIn: ["COMPLETADA", "CANCELADA"] },
      OR: [{ fechaLimite: filtroLimite }, { fechaLimite: null, fechaPuntual: filtroPuntual }],
    },
    include: { proyecto: { select: { id: true, nombre: true } } },
    orderBy: [{ fechaLimite: "asc" }, { fechaPuntual: "asc" }],
    take: MAX_TAREAS,
  });

  const tareas: EventoTarea[] = [];
  for (const fila of filas) {
    const vencimiento = vencimientoEfectivo(fila);
    if (!vencimiento) continue;
    const clave = fila.fechaLimite
      ? claveDiaUTC(fila.fechaLimite)
      : claveDiaPuntual(vencimiento, TZ);
    const enRango = clave >= claveDesde && clave < claveHasta;
    const vencidaPrevia = incluirVencidas && clave < claveHoy;
    if (!enRango && !vencidaPrevia) continue;

    const semaforo = calcularSemaforo({ vencimiento, estado: fila.estado, hoy: ahora, zona: TZ });
    tareas.push({
      id: fila.id,
      titulo: fila.titulo,
      fecha: aTextoClave(clave),
      estado: fila.estado,
      prioridad: fila.prioridad,
      proyecto: fila.proyecto,
      semaforo: {
        nivel: semaforo.nivel,
        texto: semaforo.texto,
        diasRestantes: semaforo.diasRestantes,
      },
    });
  }
  return tareas;
}
