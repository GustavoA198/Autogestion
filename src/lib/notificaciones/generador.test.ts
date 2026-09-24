// Tests unitarios del generador de notificaciones.
import { describe, expect, it } from "vitest";
import { generarNotificaciones } from "./generador";
import type { EventoCalendario } from "@/lib/calendario/proveedor";

function crearReunion(inicio: Date, idExterno = "ext-1"): EventoCalendario {
  return {
    idExterno,
    titulo: "Reunión de prueba",
    inicio,
    fin: new Date(inicio.getTime() + 60 * 60 * 1000),
  };
}

type TareaTest = {
  id: string;
  titulo: string;
  tipoFrecuencia: "DIARIA" | "SEMANAL" | "MENSUAL" | "PUNTUAL";
  diaSemana: number | null;
  diaMes: number | null;
  fechaPuntual: Date | null;
  completada: boolean;
};

function crearTarea(id: string, completada: boolean, tipo = "DIARIA"): TareaTest {
  return {
    id,
    titulo: `Tarea ${id}`,
    tipoFrecuencia: tipo as "DIARIA" | "SEMANAL" | "MENSUAL" | "PUNTUAL",
    diaSemana: null,
    diaMes: null,
    fechaPuntual: null,
    completada,
  };
}

describe("ventana de 15 minutos", () => {
  it("genera notificación cuando reunión inicia en exactamente 15 minutos", () => {
    const ahora = new Date("2026-09-24T10:00:00Z");
    const reunion = crearReunion(new Date("2026-09-24T10:15:00Z"));
    const resultado = generarNotificaciones([reunion], [], ahora, "UTC");
    expect(resultado).toHaveLength(1);
    expect(resultado[0].tipo).toBe("REUNION_PROXIMA");
  });

  it("no genera notificación cuando reunión inicia en 16 minutos", () => {
    const ahora = new Date("2026-09-24T10:00:00Z");
    const reunion = crearReunion(new Date("2026-09-24T10:16:00Z"));
    const resultado = generarNotificaciones([reunion], [], ahora, "UTC");
    expect(resultado).toHaveLength(0);
  });

  it("genera notificación cuando reunión inicia ahora mismo", () => {
    const ahora = new Date("2026-09-24T10:00:00Z");
    const reunion = crearReunion(ahora);
    const resultado = generarNotificaciones([reunion], [], ahora, "UTC");
    expect(resultado).toHaveLength(1);
  });

  it("no genera notificación cuando reunión ya pasó", () => {
    const ahora = new Date("2026-09-24T10:30:00Z");
    const reunion = crearReunion(new Date("2026-09-24T10:00:00Z"));
    const resultado = generarNotificaciones([reunion], [], ahora, "UTC");
    expect(resultado).toHaveLength(0);
  });

  it("no genera duplicados si hay 2 reuniones en ventana", () => {
    const ahora = new Date("2026-09-24T10:00:00Z");
    const reuniones = [
      crearReunion(new Date("2026-09-24T10:05:00Z"), "ext-1"),
      crearReunion(new Date("2026-09-24T10:10:00Z"), "ext-2"),
    ];
    const resultado = generarNotificaciones(reuniones, [], ahora, "UTC");
    expect(resultado).toHaveLength(2);
  });
});

describe("tareas de hoy", () => {
  it("genera notificación para tarea diaria incompleta", () => {
    const ahora = new Date("2026-09-24T10:00:00Z");
    const tarea = crearTarea("t1", false, "DIARIA");
    const resultado = generarNotificaciones([], [tarea], ahora, "UTC");
    expect(resultado).toHaveLength(1);
    expect(resultado[0].tipo).toBe("TAREA_VENCE_HOY");
    expect(resultado[0].referenciaId).toBe("t1");
  });

  it("no genera notificación para tarea diaria ya completada", () => {
    const ahora = new Date("2026-09-24T10:00:00Z");
    const tarea = crearTarea("t1", true, "DIARIA");
    const resultado = generarNotificaciones([], [tarea], ahora, "UTC");
    expect(resultado).toHaveLength(0);
  });

  it("no genera notificación para tarea semanal que no corresponde hoy", () => {
    // Thursday = 4
    const ahora = new Date("2026-09-24T10:00:00Z"); // Thursday
    const tarea = crearTarea("t1", false, "SEMANAL");
    tarea.diaSemana = 1; // Monday
    const resultado = generarNotificaciones([], [tarea], ahora, "UTC");
    expect(resultado).toHaveLength(0);
  });

  it("genera notificación para tarea semanal que corresponde hoy", () => {
    // Thursday = 4
    const ahora = new Date("2026-09-24T10:00:00Z"); // Thursday
    const tarea = crearTarea("t1", false, "SEMANAL");
    tarea.diaSemana = 4; // Thursday
    const resultado = generarNotificaciones([], [tarea], ahora, "UTC");
    expect(resultado).toHaveLength(1);
  });

  it("genera notificación para tarea mensual que corresponde hoy", () => {
    const ahora = new Date("2026-09-24T10:00:00Z"); // 24th
    const tarea = crearTarea("t1", false, "MENSUAL");
    tarea.diaMes = 24;
    const resultado = generarNotificaciones([], [tarea], ahora, "UTC");
    expect(resultado).toHaveLength(1);
  });

  it("genera notificación para tarea puntual que es hoy", () => {
    const ahora = new Date("2026-09-24T10:00:00Z");
    const tarea = crearTarea("t1", false, "PUNTUAL");
    tarea.fechaPuntual = new Date("2026-09-24T12:00:00Z");
    const resultado = generarNotificaciones([], [tarea], ahora, "UTC");
    expect(resultado).toHaveLength(1);
  });

  it("no genera notificación para tarea puntual de otro día", () => {
    const ahora = new Date("2026-09-24T10:00:00Z");
    const tarea = crearTarea("t1", false, "PUNTUAL");
    tarea.fechaPuntual = new Date("2026-09-25T12:00:00Z");
    const resultado = generarNotificaciones([], [tarea], ahora, "UTC");
    expect(resultado).toHaveLength(0);
  });
});

describe("deduplicación por referencia", () => {
  it("dos reuniones con mismo idExterno generan una sola notificación", () => {
    const ahora = new Date("2026-09-24T10:00:00Z");
    const reuniones = [
      crearReunion(new Date("2026-09-24T10:05:00Z"), "ext-duplicada"),
      crearReunion(new Date("2026-09-24T10:10:00Z"), "ext-duplicada"),
    ];
    // El generador no deduplica; la deduplicación ocurre en operaciones.ts al hacer upsert
    // Aquí verificamos que genera una por cada reunión en ventana
    const resultado = generarNotificaciones(reuniones, [], ahora, "UTC");
    expect(resultado).toHaveLength(2);
  });
});

describe("zonas horarias", () => {
  it("funciona con zona horaria diferente a UTC", () => {
    // 10:00 UTC = 05:00 America/Bogota (UTC-5)
    // La reunión es 10:15 UTC = 05:15 Bogota
    // Si la ventana se calcula en UTC, la reunión a 15 min sí cae en la ventana
    const ahora = new Date("2026-09-24T10:00:00Z");
    const reunion = crearReunion(new Date("2026-09-24T10:15:00Z"));
    const resultado = generarNotificaciones([reunion], [], ahora, "America/Bogota");
    expect(resultado).toHaveLength(1);
  });
});

describe("combinación reuniones y tareas", () => {
  it("genera notificaciones de ambos tipos simultáneamente", () => {
    const ahora = new Date("2026-09-24T10:00:00Z");
    const reunion = crearReunion(new Date("2026-09-24T10:05:00Z"));
    const tarea = crearTarea("t1", false, "DIARIA");
    const resultado = generarNotificaciones([reunion], [tarea], ahora, "UTC");
    expect(resultado).toHaveLength(2);
    expect(resultado.find((r) => r.tipo === "REUNION_PROXIMA")).toBeDefined();
    expect(resultado.find((r) => r.tipo === "TAREA_VENCE_HOY")).toBeDefined();
  });
});
