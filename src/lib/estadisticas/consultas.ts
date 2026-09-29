// Cargadores de datos de cada sección de estadísticas: consultas acotadas al periodo, sin histórico completo.
import { cache } from "react";
import {
  avancePromedioPorProyecto,
  tareasPorEstado,
  vencidasVsATiempo,
  type AvanceProyectoEstadistica,
  type ConteoEstado,
  type TareaEstadistica,
  type VencimientosAbiertas,
} from "@/lib/estadisticas/calculos-tareas";
import {
  completadasPorSemana,
  eventosCompletados,
  porcentajeATiempo,
  promedioSemanal,
  puntualidadPorSemana,
  type EventoCompletado,
  type PuntualidadSemana,
  type ResumenPuntualidad,
} from "@/lib/estadisticas/calculos-cumplimiento";
import {
  minutosPorProyecto,
  minutosPorSemana,
  totalMinutos,
  type MinutosProyecto,
} from "@/lib/estadisticas/calculos-tiempo";
import {
  horasReunionesPorProveedor,
  horasReunionesPorSemana,
  reunionCuenta,
  reunionesPorSemana,
  totalHorasReuniones,
  type HorasProveedor,
} from "@/lib/estadisticas/calculos-reuniones";
import {
  finDelPeriodo,
  inicioDelPeriodo,
  instantesDelPeriodo,
  type DatoSemanal,
} from "@/lib/estadisticas/semanas";
import { claveDeFecha } from "@/lib/notas/periodo";
import { obtenerPrisma } from "@/lib/prisma";
import { avanceDeTarea } from "@/lib/tareas/avance";

const CERRADAS: ("COMPLETADA" | "CANCELADA")[] = ["COMPLETADA", "CANCELADA"];

const SELECCION_TAREA = {
  id: true,
  estado: true,
  proyectoId: true,
  subtareas: { select: { hecho: true } },
  fechaLimite: true,
  fechaPuntual: true,
  actualizadoEn: true,
} as const;

// Proyectos básicos; se comparte entre secciones dentro de una misma petición
const cargarProyectos = cache(() =>
  obtenerPrisma().proyecto.findMany({
    select: { id: true, nombre: true },
    orderBy: { nombre: "asc" },
  }),
);

export type DatosTareas = {
  porEstado: ConteoEstado[];
  avance: AvanceProyectoEstadistica[];
  vencimientos: VencimientosAbiertas;
  abiertas: number;
  // Promedio del avance de las tareas abiertas con subtareas; null si no hay ninguna
  avancePromedio: number | null;
};

// Tareas abiertas y las cerradas dentro del periodo
export async function cargarDatosTareas(
  semanas: string[],
  zona: string,
  hoy: Date,
): Promise<DatosTareas> {
  const { desde } = instantesDelPeriodo(semanas, zona);
  const [tareas, proyectos] = await Promise.all([
    obtenerPrisma().tarea.findMany({
      where: {
        OR: [
          { estado: { notIn: CERRADAS } },
          { estado: { in: CERRADAS }, actualizadoEn: { gte: desde } },
        ],
      },
      select: SELECCION_TAREA,
    }),
    cargarProyectos(),
  ]);
  const lista: TareaEstadistica[] = tareas;
  const abiertas = lista.filter((t) => !CERRADAS.includes(t.estado as "COMPLETADA"));
  const porcentajes = abiertas.flatMap((t) => avanceDeTarea(t).porcentaje ?? []);
  const suma = porcentajes.reduce((total, p) => total + p, 0);
  return {
    porEstado: tareasPorEstado(lista),
    avance: avancePromedioPorProyecto(lista, proyectos),
    vencimientos: vencidasVsATiempo(lista, hoy, zona),
    abiertas: abiertas.length,
    avancePromedio: porcentajes.length === 0 ? null : Math.round(suma / porcentajes.length),
  };
}

export type DatosCumplimiento = {
  eventos: EventoCompletado[];
  completadas: DatoSemanal[];
  puntualidad: PuntualidadSemana[];
  resumen: ResumenPuntualidad;
  total: number;
  promedio: number;
};

// Completadas del periodo: marcas diarias más tareas cerradas por estado
export async function cargarDatosCumplimiento(
  semanas: string[],
  zona: string,
): Promise<DatosCumplimiento> {
  const { desde, hasta } = instantesDelPeriodo(semanas, zona);
  const [marcas, cerradas] = await Promise.all([
    obtenerPrisma().tareaCompletada.findMany({
      where: { fecha: { gte: inicioDelPeriodo(semanas), lte: finDelPeriodo(semanas) } },
      select: {
        tareaId: true,
        fecha: true,
        tarea: { select: { proyectoId: true, fechaLimite: true, fechaPuntual: true } },
      },
    }),
    obtenerPrisma().tarea.findMany({
      // Solo cerradas sin ninguna marca: con marca se cuentan por sus marcas y no se duplican al editarlas
      where: {
        estado: "COMPLETADA",
        actualizadoEn: { gte: desde, lt: hasta },
        completadas: { none: {} },
      },
      select: SELECCION_TAREA,
    }),
  ]);
  const primerDia = semanas[0];
  const ultimoDia = claveDeFecha(finDelPeriodo(semanas));
  const eventos = eventosCompletados(marcas, cerradas, zona).filter(
    (e) => e.dia >= primerDia && e.dia <= ultimoDia,
  );
  const completadas = completadasPorSemana(eventos, semanas);
  return {
    eventos,
    completadas,
    puntualidad: puntualidadPorSemana(eventos, semanas),
    resumen: porcentajeATiempo(eventos),
    total: eventos.length,
    promedio: promedioSemanal(completadas),
  };
}

export type DatosTiempo = {
  porProyecto: MinutosProyecto[];
  porSemana: DatoSemanal[];
  totalMinutos: number;
};

// Minutos de la bitácora dentro del periodo
export async function cargarDatosTiempo(semanas: string[]): Promise<DatosTiempo> {
  const [notas, proyectos] = await Promise.all([
    obtenerPrisma().nota.findMany({
      where: {
        fecha: { gte: inicioDelPeriodo(semanas), lte: finDelPeriodo(semanas) },
        minutos: { gt: 0 },
      },
      select: { fecha: true, minutos: true, proyectoId: true },
    }),
    cargarProyectos(),
  ]);
  return {
    porProyecto: minutosPorProyecto(notas, proyectos),
    porSemana: minutosPorSemana(notas, semanas),
    totalMinutos: totalMinutos(notas),
  };
}

export type DatosReuniones = {
  porSemana: DatoSemanal[];
  horasPorSemana: DatoSemanal[];
  porProveedor: HorasProveedor[];
  total: number;
  horas: number;
};

// Reuniones del periodo, incluida la semana actual completa aunque no haya terminado
export async function cargarDatosReuniones(
  semanas: string[],
  zona: string,
): Promise<DatosReuniones> {
  const { desde, hasta } = instantesDelPeriodo(semanas, zona);
  const reuniones = await obtenerPrisma().reunion.findMany({
    where: { inicio: { gte: desde, lt: hasta }, diaCompleto: false },
    select: { proveedor: true, inicio: true, fin: true, diaCompleto: true, estado: true },
  });
  return {
    porSemana: reunionesPorSemana(reuniones, semanas, zona),
    horasPorSemana: horasReunionesPorSemana(reuniones, semanas, zona),
    porProveedor: horasReunionesPorProveedor(reuniones),
    total: reuniones.filter(reunionCuenta).length,
    horas: totalHorasReuniones(reuniones),
  };
}
