import type { ReunionDetalle } from "@/lib/calendario/operaciones";
import { fechaLarga, rangoHoras } from "@/lib/calendario/formato";
import { diaCivilDe, type DiaCivil } from "@/lib/calendario/fechas";
import { enlaceSeguro } from "@/lib/calendario/proveedor";
import type { NivelSemaforo } from "@/lib/tareas/semaforo";

export type AlSeleccionar = (reunion: ReunionDetalle) => void;

type EstiloProveedor = {
  nombre: string;
  // Bloque de la cuadrícula: fondo teñido, borde izquierdo de acento y hover
  bloque: string;
  // Barra de acento de las filas de la agenda
  barra: string;
  // Chip relleno de un evento de día completo
  relleno: string;
  // Punto de un evento con hora en la vista mensual
  punto: string;
};

// El color del proveedor es solo un acento: siempre se acompaña del nombre y del horario en texto
export const ESTILO_PROVEEDOR: Record<ReunionDetalle["proveedor"], EstiloProveedor> = {
  GOOGLE: {
    nombre: "Google",
    bloque: "border-primary bg-primary/12 ring-1 ring-inset ring-primary/30 hover:bg-primary/20",
    barra: "border-primary",
    relleno: "bg-primary text-primary-content",
    punto: "bg-primary",
  },
  MICROSOFT: {
    nombre: "Microsoft",
    bloque: "border-accent bg-accent/12 ring-1 ring-inset ring-accent/30 hover:bg-accent/20",
    barra: "border-accent",
    relleno: "bg-accent text-accent-content",
    punto: "bg-accent",
  },
};

// Franja lateral del semáforo en filas y chips de tarea; el texto del vencimiento siempre la acompaña
export const BORDE_SEMAFORO: Record<NivelSemaforo, string> = {
  rojo: "border-error",
  naranja: "border-warning",
  amarillo: "border-amarillo",
  verde: "border-success",
  gris: "border-tenue",
};

export function esCancelada(reunion: ReunionDetalle): boolean {
  return reunion.estado === "cancelled";
}

export function esProvisional(reunion: ReunionDetalle): boolean {
  return reunion.estado === "tentative";
}

// Enlace de videollamada validado (solo http/https); undefined si no hay
export function enlaceDeUnion(reunion: ReunionDetalle): string | undefined {
  return enlaceSeguro(reunion.enlaceReunion);
}

// Ubicación en texto; se omite si es una URL porque el botón "Unirse" ya la cubre
export function ubicacionLegible(reunion: ReunionDetalle): string | null {
  const ubicacion = reunion.ubicacion?.trim();
  if (!ubicacion || /^https?:\/\//i.test(ubicacion)) return null;
  return ubicacion;
}

// Nombre accesible completo de un evento para lectores de pantalla
export function nombreAccesible(reunion: ReunionDetalle, zona: string, hoy: DiaCivil): string {
  const dia = reunion.diaCompleto
    ? fechaLarga(diaCivilDe(new Date(reunion.inicio), "UTC"), hoy)
    : fechaLarga(diaCivilDe(new Date(reunion.inicio), zona), hoy);
  const partes = [
    reunion.titulo,
    dia,
    rangoHoras(reunion, zona),
    ESTILO_PROVEEDOR[reunion.proveedor].nombre,
  ];
  if (esCancelada(reunion)) partes.push("cancelado");
  else if (esProvisional(reunion)) partes.push("provisional");
  return partes.join(", ");
}

export function textoCantidad(cantidad: number, singular: string, plural: string): string {
  return `${cantidad} ${cantidad === 1 ? singular : plural}`;
}
