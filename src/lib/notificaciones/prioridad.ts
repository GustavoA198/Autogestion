// Clasificación por severidad de las notificaciones: lógica pura, sin BD ni React.
import { calcularSemaforo, vencimientoEfectivo } from "@/lib/tareas/semaforo";
import { estadoSinAviso } from "./tareas";

// Ventana en la que una reunión ya iniciada sigue mostrándose como aviso
export const MINUTOS_TRAS_INICIO = 15;
// Hasta cuántos días antes una tarea se considera "por vencer"
const DIAS_POR_VENCER = 5;

export type TipoNotificacionBase =
  "REUNION_PROXIMA" | "TAREA_VENCE_HOY" | "TAREA_VENCE_PRONTO" | "RESUMEN_DIA";

// 1 Vencida · 2 Reunión próxima · 3 Vence hoy · 4 Pendiente de hoy · 5 Por vencer · 6 Resumen
export type Severidad = 1 | 2 | 3 | 4 | 5 | 6;
export type GrupoNotificacion = "Urgente" | "Para hoy" | "Próximamente" | "Resumen";

export const ORDEN_GRUPOS: GrupoNotificacion[] = ["Urgente", "Para hoy", "Próximamente", "Resumen"];

export type TonoInsigniaNotificacion = "error" | "primary" | "warning" | "amarillo" | "info";
export type IconoNotificacion = "alerta" | "reloj" | "calendario" | "lista" | "campana";

export type InsigniaNotificacion = {
  texto: string;
  tono: TonoInsigniaNotificacion;
  icono: IconoNotificacion;
};

export type EntradaNotificacion = {
  tipo: TipoNotificacionBase;
  referenciaId: string;
  fechaEvento: Date;
  creadoEn: Date;
};

// Datos de la tarea referenciada tal como están ahora en la BD
export type TareaParaClasificar = {
  estado: string;
  tipoFrecuencia: string;
  fechaLimite: Date | null;
  fechaPuntual: Date | null;
  completadaHoy: boolean;
};

export type Clasificacion = {
  severidad: Severidad;
  grupo: GrupoNotificacion;
  etiqueta: string;
  insignia: InsigniaNotificacion;
  // Texto corto de plazo ("Vencida hace 3 días", "En 12 min"); null si no aporta
  detalle: string | null;
  // Clave numérica para ordenar dentro del grupo: menor = más urgente
  orden: number;
  enlace: { href: string; texto: string };
};

export function grupoDeSeveridad(severidad: Severidad): GrupoNotificacion {
  if (severidad <= 3) return "Urgente";
  if (severidad === 4) return "Para hoy";
  if (severidad === 5) return "Próximamente";
  return "Resumen";
}

function pluralDias(dias: number): string {
  return `${dias} ${dias === 1 ? "día" : "días"}`;
}

// Hora local HH:mm (sin segundos) en la zona del navegador
function horaLocalSinSeg(fecha: Date): string {
  return new Intl.DateTimeFormat("es-CO", {
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(fecha);
}

// Texto del plazo de una reunión respecto a ahora; se recalcula en cliente para mantenerlo vivo
export function textoReunion(inicio: Date, ahora: Date): string {
  const minutos = Math.round((inicio.getTime() - ahora.getTime()) / 60_000);
  if (minutos > 0) return `En ${minutos} min`;
  if (minutos === 0) return "Comienza ahora";
  return `Ya comenzó hace ${-minutos} min`;
}

function construir(
  severidad: Severidad,
  etiqueta: string,
  insignia: InsigniaNotificacion,
  detalle: string | null,
  orden: number,
  enlace: Clasificacion["enlace"],
): Clasificacion {
  return {
    severidad,
    grupo: grupoDeSeveridad(severidad),
    etiqueta,
    insignia,
    detalle,
    orden,
    enlace,
  };
}

// Clasifica una notificación en el momento de leer; null si ya no aplica y no debe mostrarse
export function clasificarNotificacion(
  notificacion: EntradaNotificacion,
  tarea: TareaParaClasificar | null,
  ahora: Date,
  zona: string,
): Clasificacion | null {
  if (notificacion.tipo === "RESUMEN_DIA") {
    return construir(
      6,
      "Resumen del día",
      { texto: "Resumen", tono: "info", icono: "lista" },
      null,
      0,
      { href: "/dashboard", texto: "Ir al panel" },
    );
  }

  if (notificacion.tipo === "REUNION_PROXIMA") {
    const inicio = notificacion.fechaEvento;
    const minutos = Math.round((inicio.getTime() - ahora.getTime()) / 60_000);
    // Una reunión que empezó hace más de la ventana ya no es un aviso vigente
    if (minutos < -MINUTOS_TRAS_INICIO) return null;
    // Si la reunión es en más de 15 min, baja a "Próximamente" (severidad 5) en lugar de "Urgente"
    if (minutos > 15) {
      const dias = Math.max(1, Math.ceil(minutos / (24 * 60)));
      return construir(
        5,
        "Reunión próxima",
        { texto: "Reunión próxima", tono: "primary", icono: "calendario" },
        dias === 1
          ? `Mañana a las ${horaLocalSinSeg(inicio)}`
          : `En ${dias} días · ${horaLocalSinSeg(inicio)}`,
        minutos,
        { href: "/calendario", texto: "Ver calendario" },
      );
    }
    return construir(
      2,
      "Reunión próxima",
      { texto: "Reunión próxima", tono: "primary", icono: "calendario" },
      textoReunion(inicio, ahora),
      inicio.getTime(),
      { href: "/calendario", texto: "Ver calendario" },
    );
  }

  // Avisos de tarea: se reclasifican con el estado actual, no con el texto guardado
  if (!tarea || estadoSinAviso(tarea.estado) || tarea.completadaHoy) return null;

  const enlace = { href: `/tareas/${notificacion.referenciaId}`, texto: "Ver tarea" };
  const dias = calcularSemaforo({
    vencimiento: vencimientoEfectivo(tarea),
    estado: tarea.estado,
    hoy: ahora,
    zona,
  }).diasRestantes;

  if (dias !== null && dias < 0) {
    return construir(
      1,
      "Vencida",
      { texto: "Vencida", tono: "error", icono: "alerta" },
      `Vencida hace ${pluralDias(-dias)}`,
      dias,
      enlace,
    );
  }
  if (dias === 0) {
    return construir(
      3,
      "Vence hoy",
      { texto: "Vence hoy", tono: "error", icono: "alerta" },
      "Vence hoy",
      0,
      enlace,
    );
  }
  if (dias !== null && dias <= DIAS_POR_VENCER) {
    return construir(
      5,
      "Por vencer",
      { texto: "Por vencer", tono: "warning", icono: "reloj" },
      dias === 1 ? "Vence mañana" : `En ${dias} días`,
      dias,
      enlace,
    );
  }
  if (notificacion.tipo === "TAREA_VENCE_PRONTO") {
    // Aviso de plazo que ya no está en la ventana de 5 días; se conserva como por vencer
    return construir(
      5,
      "Por vencer",
      { texto: "Por vencer", tono: "warning", icono: "reloj" },
      dias === null ? null : `En ${dias} días`,
      dias ?? Number.MAX_SAFE_INTEGER,
      enlace,
    );
  }
  return construir(
    4,
    "Pendiente de hoy",
    { texto: "Pendiente de hoy", tono: "amarillo", icono: "reloj" },
    "Aún sin completar hoy",
    0,
    enlace,
  );
}

// Orden global: severidad, luego clave del grupo y, como desempate, la más reciente primero
export function compararPrioridad(
  a: { severidad: number; orden: number; creadoEn: Date | string },
  b: { severidad: number; orden: number; creadoEn: Date | string },
): number {
  if (a.severidad !== b.severidad) return a.severidad - b.severidad;
  if (a.orden !== b.orden) return a.orden - b.orden;
  return new Date(b.creadoEn).getTime() - new Date(a.creadoEn).getTime();
}

// Notificación lista para la UI: datos guardados más la clasificación calculada al leer
export type NotificacionPriorizada = {
  id: string;
  tipo: TipoNotificacionBase;
  referenciaId: string;
  // Nombre de la tarea o reunión (o el título del resumen) para el encabezado de la tarjeta
  asunto: string;
  mensaje: string;
  fechaEvento: string;
  creadoEn: string;
  severidad: Severidad;
  grupo: GrupoNotificacion;
  etiqueta: string;
  insignia: InsigniaNotificacion;
  detalle: string | null;
  enlace: { href: string; texto: string };
};

// Cantidad de notificaciones urgentes (vencidas, reuniones próximas y que vencen hoy)
export function contarUrgentes(items: Array<{ severidad: number }>): number {
  return items.filter((i) => i.severidad <= 3).length;
}
