// Cálculos puros de reuniones; el modelo no enlaza reuniones con proyectos, se agrupa por semana y proveedor.
import {
  claveSemanaDeInstante,
  completarSemanas,
  type DatoSemanal,
} from "@/lib/estadisticas/semanas";

export type ReunionEstadistica = {
  proveedor: string;
  inicio: Date;
  fin: Date;
  diaCompleto: boolean;
  estado: string | null;
};

// Una reunión cuenta si no es de día completo ni está cancelada
export function reunionCuenta(
  reunion: Pick<ReunionEstadistica, "diaCompleto" | "estado">,
): boolean {
  if (reunion.diaCompleto) return false;
  return !/^cancel/i.test(reunion.estado ?? "");
}

function horasDe(reunion: Pick<ReunionEstadistica, "inicio" | "fin">): number {
  return Math.max(0, reunion.fin.getTime() - reunion.inicio.getTime()) / 3_600_000;
}

function redondear(valor: number): number {
  return Math.round(valor * 10) / 10;
}

// Cantidad de reuniones por semana del periodo, con ceros donde no hay
export function reunionesPorSemana(
  reuniones: ReunionEstadistica[],
  semanas: string[],
  zona: string,
): DatoSemanal[] {
  const acumulado = new Map<string, number>();
  for (const reunion of reuniones) {
    if (!reunionCuenta(reunion)) continue;
    const semana = claveSemanaDeInstante(reunion.inicio, zona);
    acumulado.set(semana, (acumulado.get(semana) ?? 0) + 1);
  }
  return completarSemanas(semanas, acumulado);
}

// Horas en reuniones por semana del periodo, con un decimal
export function horasReunionesPorSemana(
  reuniones: ReunionEstadistica[],
  semanas: string[],
  zona: string,
): DatoSemanal[] {
  const acumulado = new Map<string, number>();
  for (const reunion of reuniones) {
    if (!reunionCuenta(reunion)) continue;
    const semana = claveSemanaDeInstante(reunion.inicio, zona);
    acumulado.set(semana, (acumulado.get(semana) ?? 0) + horasDe(reunion));
  }
  return completarSemanas(semanas, acumulado).map((dato) => ({
    ...dato,
    valor: redondear(dato.valor),
  }));
}

const NOMBRE_PROVEEDOR: Record<string, string> = { GOOGLE: "Google", MICROSOFT: "Microsoft" };

export type HorasProveedor = {
  proveedor: string;
  nombre: string;
  horas: number;
  reuniones: number;
};

// Horas por calendario (proveedor), del que más suma al que menos
export function horasReunionesPorProveedor(reuniones: ReunionEstadistica[]): HorasProveedor[] {
  const acumulado = new Map<string, { horas: number; reuniones: number }>();
  for (const reunion of reuniones) {
    if (!reunionCuenta(reunion)) continue;
    const previo = acumulado.get(reunion.proveedor) ?? { horas: 0, reuniones: 0 };
    acumulado.set(reunion.proveedor, {
      horas: previo.horas + horasDe(reunion),
      reuniones: previo.reuniones + 1,
    });
  }
  return Array.from(acumulado, ([proveedor, dato]) => ({
    proveedor,
    nombre: NOMBRE_PROVEEDOR[proveedor] ?? proveedor,
    horas: redondear(dato.horas),
    reuniones: dato.reuniones,
  })).sort((a, b) => b.horas - a.horas);
}

// Horas totales en reuniones válidas, con un decimal
export function totalHorasReuniones(reuniones: ReunionEstadistica[]): number {
  return redondear(reuniones.filter(reunionCuenta).reduce((suma, r) => suma + horasDe(r), 0));
}
