import { DIAS_SIN_AVANCE, estaSinAvance } from "@/lib/notas/constantes";
import { resumirTexto } from "@/lib/notas/formato";
import { diasEntre, hoyComoFecha, type RangoFechas } from "@/lib/notas/periodo";
import type { DatosNota } from "@/lib/notas/validacion";
import { obtenerPrisma } from "@/lib/prisma";
import { leerEntornoTiempo } from "@/lib/tareas/tiempo";

// Rango opcional sobre Nota.fecha (fecha pura a medianoche UTC, extremos incluidos)
type RangoOpcional = Partial<RangoFechas> | undefined;

const ORDEN_RECIENTE = [{ fecha: "desc" }, { creadoEn: "desc" }] as const;

function filtroFecha(rango: RangoOpcional) {
  if (!rango || (!rango.desde && !rango.hasta)) return {};
  return { fecha: { ...(rango.desde && { gte: rango.desde }), ...(rango.hasta && { lte: rango.hasta }) } };
}

export function listarNotasDeProyecto(proyectoId: string, rango?: RangoOpcional, limite?: number) {
  return obtenerPrisma().nota.findMany({
    where: { proyectoId, ...filtroFecha(rango) },
    orderBy: [...ORDEN_RECIENTE],
    take: limite,
  });
}

export function contarNotasDeProyecto(proyectoId: string) {
  return obtenerPrisma().nota.count({ where: { proyectoId } });
}

export function obtenerNota(id: string) {
  return obtenerPrisma().nota.findUnique({ where: { id } });
}

// Busca en el texto y en el próximo paso de las entradas del proyecto
export function buscarNotasEnProyecto(proyectoId: string, texto: string, rango?: RangoOpcional) {
  return obtenerPrisma().nota.findMany({
    where: {
      proyectoId,
      ...filtroFecha(rango),
      OR: [
        { texto: { contains: texto, mode: "insensitive" } },
        { proximoPaso: { contains: texto, mode: "insensitive" } },
      ],
    },
    orderBy: [...ORDEN_RECIENTE],
  });
}

// Última entrada de un proyecto: la de fecha más reciente y, a igual fecha, la creada después
export function obtenerUltimaNota(proyectoId: string) {
  return obtenerPrisma().nota.findFirst({
    where: { proyectoId },
    orderBy: [...ORDEN_RECIENTE],
  });
}

// Última entrada de toda la bitácora con el nombre de su proyecto
export function obtenerUltimaNotaGlobal() {
  return obtenerPrisma().nota.findFirst({
    orderBy: [...ORDEN_RECIENTE],
    include: { proyecto: { select: { id: true, nombre: true } } },
  });
}

export type UltimaNota = {
  id: string;
  proyectoId: string;
  fecha: Date;
  proximoPaso: string;
  resumen: string;
};

type FilaUltimaNota = {
  id: string;
  proyecto_id: string;
  fecha: Date;
  proximo_paso: string;
  texto: string;
};

// Una sola consulta: la última entrada de cada proyecto, indexada por proyecto
export async function ultimaNotaPorProyecto(): Promise<Map<string, UltimaNota>> {
  const filas = await obtenerPrisma().$queryRaw<FilaUltimaNota[]>`
    SELECT DISTINCT ON ("proyecto_id") "id", "proyecto_id", "fecha", "proximo_paso", LEFT("texto", 240) AS "texto"
    FROM "nota"
    ORDER BY "proyecto_id", "fecha" DESC, "creado_en" DESC`;
  return new Map(
    filas.map((f) => [
      f.proyecto_id,
      {
        id: f.id,
        proyectoId: f.proyecto_id,
        fecha: f.fecha,
        proximoPaso: f.proximo_paso,
        resumen: resumirTexto(f.texto, 160),
      },
    ]),
  );
}

export type TotalesProyecto = { entradas: number; minutos: number };

// Cantidad de entradas y minutos invertidos por proyecto dentro del rango
export async function totalesPorProyecto(rango?: RangoOpcional): Promise<Map<string, TotalesProyecto>> {
  const grupos = await obtenerPrisma().nota.groupBy({
    by: ["proyectoId"],
    where: filtroFecha(rango),
    _count: { _all: true },
    _sum: { minutos: true },
  });
  return new Map(
    grupos.map((g) => [g.proyectoId, { entradas: g._count._all, minutos: g._sum.minutos ?? 0 }]),
  );
}

// Entradas de todos los proyectos dentro del rango, de la más antigua a la más reciente
export function listarNotasEnRango(desde: Date, hasta: Date) {
  return obtenerPrisma().nota.findMany({
    where: { fecha: { gte: desde, lte: hasta } },
    orderBy: [{ fecha: "asc" }, { creadoEn: "asc" }],
    include: { proyecto: { select: { id: true, nombre: true } } },
  });
}

export type AvanceProyecto = {
  proyecto: { id: string; nombre: string; descripcion: string | null };
  ultima: UltimaNota | null;
  // Días desde la última entrada; sin entradas se cuentan desde la creación del proyecto
  dias: number;
  sinNotas: boolean;
  sinAvance: boolean;
};

// Estado de avance de cada proyecto, primero los más rezagados
export async function avanceDeProyectos(
  umbral: number = DIAS_SIN_AVANCE,
  ahora: Date = new Date(),
): Promise<AvanceProyecto[]> {
  const { TZ } = leerEntornoTiempo();
  const hoy = hoyComoFecha(TZ, ahora);
  const [proyectos, ultimas] = await Promise.all([
    obtenerPrisma().proyecto.findMany({
      select: { id: true, nombre: true, descripcion: true, creadoEn: true },
    }),
    ultimaNotaPorProyecto(),
  ]);
  return proyectos
    .map((p): AvanceProyecto => {
      const ultima = ultimas.get(p.id) ?? null;
      const base = ultima ? ultima.fecha : hoyComoFecha(TZ, p.creadoEn);
      const dias = Math.max(0, diasEntre(base, hoy));
      return {
        proyecto: { id: p.id, nombre: p.nombre, descripcion: p.descripcion },
        ultima,
        dias,
        sinNotas: !ultima,
        sinAvance: estaSinAvance(dias, umbral),
      };
    })
    .sort((a, b) => b.dias - a.dias || a.proyecto.nombre.localeCompare(b.proyecto.nombre, "es"));
}

// Proyectos cuya última entrada es anterior a N días (o que nunca tuvieron una en ese tiempo)
export async function proyectosSinAvance(dias: number = DIAS_SIN_AVANCE, ahora?: Date) {
  const avance = await avanceDeProyectos(dias, ahora);
  return avance.filter((a) => a.sinAvance);
}

export async function crearNota(datos: DatosNota) {
  const nota = await obtenerPrisma().nota.create({
    data: {
      proyectoId: datos.proyectoId,
      fecha: datos.fecha,
      texto: datos.texto,
      proximoPaso: datos.proximoPaso,
      minutos: datos.minutos,
    },
    select: { id: true },
  });
  return { ok: true as const, id: nota.id };
}

export async function actualizarNota(id: string, datos: Omit<DatosNota, "proyectoId">) {
  const actual = await obtenerPrisma().nota.findUnique({ where: { id } });
  if (!actual) return null;

  await obtenerPrisma().nota.update({
    where: { id },
    data: {
      fecha: datos.fecha,
      texto: datos.texto,
      proximoPaso: datos.proximoPaso,
      minutos: datos.minutos,
    },
  });
  return { ok: true as const, id };
}

export async function eliminarNota(id: string): Promise<boolean> {
  const { count } = await obtenerPrisma().nota.deleteMany({ where: { id } });
  return count > 0;
}
