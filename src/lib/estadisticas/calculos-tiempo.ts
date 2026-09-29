// Cálculos puros del tiempo invertido según la bitácora; sin acceso a la base de datos.
import {
  claveSemanaDeFechaPura,
  completarSemanas,
  type DatoSemanal,
} from "@/lib/estadisticas/semanas";

// Nota reducida a lo necesario: fecha pura, minutos opcionales y proyecto
export type NotaTiempo = { fecha: Date; minutos: number | null; proyectoId: string };

export type MinutosProyecto = { proyectoId: string; nombre: string; minutos: number };

function minutosValidos(nota: NotaTiempo): number {
  return nota.minutos && nota.minutos > 0 ? nota.minutos : 0;
}

// Minutos por proyecto, del que más tiempo suma al que menos; ignora notas sin tiempo
export function minutosPorProyecto(
  notas: NotaTiempo[],
  proyectos: { id: string; nombre: string }[],
): MinutosProyecto[] {
  const acumulado = new Map<string, number>();
  for (const nota of notas) {
    const minutos = minutosValidos(nota);
    if (minutos > 0)
      acumulado.set(nota.proyectoId, (acumulado.get(nota.proyectoId) ?? 0) + minutos);
  }
  const nombres = new Map(proyectos.map((p) => [p.id, p.nombre]));
  return Array.from(acumulado, ([proyectoId, minutos]) => ({
    proyectoId,
    nombre: nombres.get(proyectoId) ?? "Proyecto",
    minutos,
  })).sort((a, b) => b.minutos - a.minutos);
}

// Minutos por semana del periodo, con ceros en las semanas sin tiempo registrado
export function minutosPorSemana(notas: NotaTiempo[], semanas: string[]): DatoSemanal[] {
  const acumulado = new Map<string, number>();
  for (const nota of notas) {
    const minutos = minutosValidos(nota);
    if (minutos === 0) continue;
    const semana = claveSemanaDeFechaPura(nota.fecha);
    acumulado.set(semana, (acumulado.get(semana) ?? 0) + minutos);
  }
  return completarSemanas(semanas, acumulado);
}

// Total de minutos registrados en las notas
export function totalMinutos(notas: NotaTiempo[]): number {
  return notas.reduce((suma, nota) => suma + minutosValidos(nota), 0);
}

// Horas con dos decimales a partir de minutos, para gráficas y tablas
export function minutosAHoras(minutos: number): number {
  return Math.round((minutos / 60) * 100) / 100;
}

export type EscalaTiempo = {
  unidad: string;
  unidadSingular: string;
  convertir: (minutos: number) => number;
};

// Con menos de una hora en total se grafica en minutos; si no, en horas, para no redondear todo a cero
export function escalaDeTiempo(totalMinutosPeriodo: number): EscalaTiempo {
  if (totalMinutosPeriodo < 60) {
    return { unidad: "min", unidadSingular: "min", convertir: (minutos) => minutos };
  }
  return { unidad: "horas", unidadSingular: "hora", convertir: minutosAHoras };
}
