// Generador del reporte semanal: lógica pura sobre datos ya cargados, sin BD ni React.
import { formatearMinutos, resumirTexto, sumarMinutos } from "@/lib/notas/formato";
import { claveDeFecha, type RangoFechas } from "@/lib/notas/periodo";

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const DIAS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];

const RESUMEN_ENTRADA = 160;
const SIN_PROYECTO = "Sin proyecto";

export type ProyectoReporte = { id: string; nombre: string };

export type NotaReporte = {
  fecha: Date;
  texto: string;
  proximoPaso: string;
  minutos: number | null;
  proyecto: ProyectoReporte;
};

export type TareaReporte = {
  titulo: string;
  proyecto: ProyectoReporte | null;
};

export type EntradaReporte = {
  rango: RangoFechas;
  notas: NotaReporte[];
  tareasCompletadas: TareaReporte[];
};

export type EntradaDiaReporte = { dia: string; resumen: string; minutos: number | null };

export type SeccionProyectoReporte = {
  proyectoId: string | null;
  nombre: string;
  entradas: EntradaDiaReporte[];
  proximoPaso: string | null;
  minutos: number;
  tareas: string[];
};

export type ReporteSemanal = {
  encabezado: string;
  proyectos: SeccionProyectoReporte[];
  totalMinutos: number;
  vacio: boolean;
  texto: string;
};

// Rango legible: "21–27 sep 2026", "28 sep – 4 oct 2026" o con año en ambos extremos
export function formatearRango({ desde, hasta }: RangoFechas): string {
  const d = { dia: desde.getUTCDate(), mes: MESES[desde.getUTCMonth()], anio: desde.getUTCFullYear() };
  const h = { dia: hasta.getUTCDate(), mes: MESES[hasta.getUTCMonth()], anio: hasta.getUTCFullYear() };
  if (d.anio !== h.anio) return `${d.dia} ${d.mes} ${d.anio} – ${h.dia} ${h.mes} ${h.anio}`;
  if (d.mes !== h.mes) return `${d.dia} ${d.mes} – ${h.dia} ${h.mes} ${h.anio}`;
  return `${d.dia}–${h.dia} ${h.mes} ${h.anio}`;
}

// Día corto de una fecha pura: "lun 21 sep"
export function formatearDiaCorto(fecha: Date): string {
  return `${DIAS[fecha.getUTCDay()]} ${fecha.getUTCDate()} ${MESES[fecha.getUTCMonth()]}`;
}

function nuevaSeccion(proyectoId: string | null, nombre: string): SeccionProyectoReporte {
  return { proyectoId, nombre, entradas: [], proximoPaso: null, minutos: 0, tareas: [] };
}

function textoDelReporte(encabezado: string, proyectos: SeccionProyectoReporte[], total: number) {
  const lineas = [encabezado, ""];
  if (proyectos.length === 0) {
    lineas.push("Sin actividad registrada en la semana.");
    return lineas.join("\n");
  }
  for (const p of proyectos) {
    lineas.push(p.minutos > 0 ? `## ${p.nombre} · ${formatearMinutos(p.minutos)}` : `## ${p.nombre}`);
    if (p.entradas.length > 0) {
      lineas.push("Entradas");
      for (const e of p.entradas) {
        const tiempo = e.minutos ? ` (${formatearMinutos(e.minutos)})` : "";
        lineas.push(`- ${e.dia}: ${e.resumen}${tiempo}`);
      }
    }
    if (p.tareas.length > 0) {
      lineas.push("Tareas completadas");
      for (const t of p.tareas) lineas.push(`- ${t}`);
    }
    if (p.proximoPaso) lineas.push(`Próximo paso: ${p.proximoPaso}`);
    lineas.push("");
  }
  lineas.push(`Tiempo total de la semana: ${total > 0 ? formatearMinutos(total) : "sin registrar"}`);
  return lineas.join("\n");
}

export function generarReporteSemanal(entrada: EntradaReporte): ReporteSemanal {
  const encabezado = `Reporte semanal · ${formatearRango(entrada.rango)}`;
  const secciones = new Map<string, SeccionProyectoReporte>();
  const seccionDe = (proyecto: ProyectoReporte | null) => {
    const clave = proyecto?.id ?? "";
    let seccion = secciones.get(clave);
    if (!seccion) {
      seccion = nuevaSeccion(proyecto?.id ?? null, proyecto?.nombre ?? SIN_PROYECTO);
      secciones.set(clave, seccion);
    }
    return seccion;
  };

  // Las entradas se ordenan por fecha para que el próximo paso vigente sea el de la última
  const notas = [...entrada.notas].sort(
    (a, b) => claveDeFecha(a.fecha).localeCompare(claveDeFecha(b.fecha)),
  );
  for (const nota of notas) {
    const seccion = seccionDe(nota.proyecto);
    seccion.entradas.push({
      dia: formatearDiaCorto(nota.fecha),
      resumen: resumirTexto(nota.texto, RESUMEN_ENTRADA),
      minutos: nota.minutos,
    });
    seccion.proximoPaso = nota.proximoPaso;
  }
  for (const tarea of entrada.tareasCompletadas) seccionDe(tarea.proyecto).tareas.push(tarea.titulo);
  for (const seccion of secciones.values()) {
    seccion.minutos = sumarMinutos(seccion.entradas);
  }

  const proyectos = [...secciones.values()].sort((a, b) => {
    if ((a.proyectoId === null) !== (b.proyectoId === null)) return a.proyectoId === null ? 1 : -1;
    return a.nombre.localeCompare(b.nombre, "es");
  });
  const totalMinutos = proyectos.reduce((total, p) => total + p.minutos, 0);

  return {
    encabezado,
    proyectos,
    totalMinutos,
    vacio: proyectos.length === 0,
    texto: textoDelReporte(encabezado, proyectos, totalMinutos),
  };
}
