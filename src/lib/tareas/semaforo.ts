// Semáforo de vencimiento: lógica pura por fecha de calendario, sin React ni acceso a BD.
import { claveDiaEnZona, claveDiaPuntual } from "@/lib/tareas/recurrencia";
import { leerEntornoTiempo } from "@/lib/tareas/tiempo";

export type NivelSemaforo = "rojo" | "naranja" | "amarillo" | "verde" | "gris";

export type ResultadoSemaforo = {
  nivel: NivelSemaforo;
  diasRestantes: number | null;
  texto: string;
};

type EntradaSemaforo = {
  vencimiento: Date | string | null;
  estado?: string | null;
  hoy?: Date;
  zona?: string;
};

// Vencimiento efectivo de una tarea: "hasta" (fechaLimite) o, si falta, el día puntual
export function vencimientoEfectivo(tarea: {
  fechaLimite?: Date | null;
  fechaPuntual?: Date | null;
}): Date | null {
  return tarea.fechaLimite ?? tarea.fechaPuntual ?? null;
}

// Cantidad de días de calendario entre dos claves aaaammdd
function diferenciaEnDias(desde: number, hasta: number): number {
  const aMs = (clave: number) =>
    Date.UTC(Math.floor(clave / 10000), (Math.floor(clave / 100) % 100) - 1, clave % 100);
  return Math.round((aMs(hasta) - aMs(desde)) / 86_400_000);
}

// Convierte el vencimiento a clave de día: los textos ISO y las fechas sin hora se leen tal cual
function claveDeVencimiento(vencimiento: Date | string, zona: string): number | null {
  if (typeof vencimiento === "string") {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(vencimiento);
    if (!m) return null;
    return Number(m[1]) * 10000 + Number(m[2]) * 100 + Number(m[3]);
  }
  if (Number.isNaN(vencimiento.getTime())) return null;
  return claveDiaPuntual(vencimiento, zona);
}

function textoRelativo(dias: number): string {
  if (dias < 0) {
    const atras = -dias;
    return `Vencida hace ${atras} ${atras === 1 ? "día" : "días"}`;
  }
  if (dias === 0) return "Vence hoy";
  if (dias === 1) return "Mañana";
  return `En ${dias} días`;
}

// Nivel por días restantes: rojo hasta hoy, naranja 1-5, amarillo 6-10, verde más de 10
function nivelPorDias(dias: number): NivelSemaforo {
  if (dias <= 0) return "rojo";
  if (dias <= 5) return "naranja";
  if (dias <= 10) return "amarillo";
  return "verde";
}

export function calcularSemaforo({
  vencimiento,
  estado,
  hoy = new Date(),
  zona,
}: EntradaSemaforo): ResultadoSemaforo {
  if (estado === "COMPLETADA") return { nivel: "gris", diasRestantes: null, texto: "Completada" };
  if (estado === "CANCELADA") return { nivel: "gris", diasRestantes: null, texto: "Cancelada" };
  if (vencimiento === null) return { nivel: "gris", diasRestantes: null, texto: "Sin fecha" };

  const zonaHoraria = zona ?? leerEntornoTiempo().TZ;
  const claveVence = claveDeVencimiento(vencimiento, zonaHoraria);
  if (claveVence === null) return { nivel: "gris", diasRestantes: null, texto: "Sin fecha" };

  const dias = diferenciaEnDias(claveDiaEnZona(hoy, zonaHoraria), claveVence);
  return { nivel: nivelPorDias(dias), diasRestantes: dias, texto: textoRelativo(dias) };
}

export type ClasesSemaforo = {
  insignia: string;
  texto: string;
  fondo: string;
  borde: string;
  barra: string;
};

// Clases de tema por nivel; el amarillo usa el token propio definido en globals.css
export const CLASES_SEMAFORO: Record<NivelSemaforo, ClasesSemaforo> = {
  rojo: {
    insignia: "badge-error",
    texto: "text-error",
    fondo: "bg-error/10",
    borde: "border-error/30",
    barra: "bg-error",
  },
  naranja: {
    insignia: "badge-warning",
    texto: "text-warning",
    fondo: "bg-warning/10",
    borde: "border-warning/30",
    barra: "bg-warning",
  },
  amarillo: {
    insignia: "badge-amarillo",
    texto: "text-amarillo",
    fondo: "bg-amarillo/10",
    borde: "border-amarillo/30",
    barra: "bg-amarillo",
  },
  verde: {
    insignia: "badge-success",
    texto: "text-success",
    fondo: "bg-success/10",
    borde: "border-success/30",
    barra: "bg-success",
  },
  gris: {
    insignia: "badge-ghost",
    texto: "text-suave",
    fondo: "bg-base-200",
    borde: "border-linea-fuerte",
    barra: "bg-tenue",
  },
};

// Tono equivalente para el componente Insignia
export const TONO_SEMAFORO: Record<
  NivelSemaforo,
  "error" | "warning" | "amarillo" | "success" | "ghost"
> = {
  rojo: "error",
  naranja: "warning",
  amarillo: "amarillo",
  verde: "success",
  gris: "ghost",
};
