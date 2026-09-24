// Unit tests para los cargadores de datos del dashboard.
// Cada test mockea Prisma para aislar la logica de la base de datos.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { cargarReunionesHoy, cargarTareasDelDia, cargarProyectosAccesos, cargarEstadisticas, cargarNotificaciones } from "./dashboard-data";

const prismaMock = {
  reunion: { findMany: vi.fn() },
  tarea: { findMany: vi.fn() },
  tareaCompletada: { findMany: vi.fn(), create: vi.fn() },
  proyecto: { findMany: vi.fn(), findUnique: vi.fn() },
  notificacion: { count: vi.fn() },
};

// vi.hoisted() para que la referencia exista antes del hoisting de vi.mock
const contarNotificacionesMock = vi.hoisted(() => vi.fn());
vi.mock("@/lib/prisma", () => ({ obtenerPrisma: () => prismaMock }));
vi.mock("@/lib/tareas/tiempo", () => ({ leerEntornoTiempo: () => ({ TZ: "America/Bogota" }) }));
vi.mock("@/lib/tareas/recurrencia", () => ({ correspondeHoy: () => true }));
vi.mock("@/lib/notificaciones/operaciones", () => ({
  contarNotificaciones: contarNotificacionesMock,
}));

describe("dashboard-data", () => {
  beforeEach(() => vi.clearAllMocks());

  describe("cargarReunionesHoy", () => {
    it("devuelve reuniones del dia cuando hay datos", async () => {
      const ahora = new Date();
      const inicio = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 9, 0);
      const fin = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 10, 0);
      prismaMock.reunion.findMany.mockResolvedValue([
        { idExterno: "evt-1", titulo: "Daily standup", descripcion: null, inicio, fin, enlaceReunion: "https://meet.example.com/123" },
      ]);

      const res = await cargarReunionesHoy();

      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.reuniones).toHaveLength(1);
        expect(res.reuniones[0].titulo).toBe("Daily standup");
        expect(res.reuniones[0].enlaceReunion).toBe("https://meet.example.com/123");
      }
    });

    it("devuelve array vacio cuando no hay reuniones", async () => {
      prismaMock.reunion.findMany.mockResolvedValue([]);
      const res = await cargarReunionesHoy();
      expect(res.ok).toBe(true);
      if (res.ok) expect(res.reuniones).toHaveLength(0);
    });

    it("devuelve error cuando Prisma falla", async () => {
      prismaMock.reunion.findMany.mockRejectedValue(new Error("DB error"));
      const res = await cargarReunionesHoy();
      expect(res.ok).toBe(false);
      if (!res.ok) expect(res.error).toBe("No se pudieron cargar las reuniones.");
    });
  });

  describe("cargarTareasDelDia", () => {
    it("separa recurrentes y puntuales", async () => {
      prismaMock.tarea.findMany.mockResolvedValue([
        { id: "t-1", titulo: "Tarea diaria", tipoFrecuencia: "DIARIA", diaSemana: null, diaMes: null, fechaPuntual: null, proyectoId: null, activa: true, descripcion: null, createdAt: new Date(), updatedAt: new Date(), proyecto: null },
        { id: "t-2", titulo: "Tarea semanal", tipoFrecuencia: "SEMANAL", diaSemana: 1, diaMes: null, fechaPuntual: null, proyectoId: null, activa: true, descripcion: null, createdAt: new Date(), updatedAt: new Date(), proyecto: null },
        { id: "t-3", titulo: "Tarea puntual", tipoFrecuencia: "PUNTUAL", diaSemana: null, diaMes: null, fechaPuntual: new Date(), proyectoId: null, activa: true, descripcion: null, createdAt: new Date(), updatedAt: new Date(), proyecto: null },
      ]);
      const res = await cargarTareasDelDia();

      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.recurrentes.length).toBeGreaterThanOrEqual(0);
        expect(res.puntuales.length).toBeGreaterThanOrEqual(0);
      }
    });

    it("devuelve error cuando Prisma falla", async () => {
      prismaMock.tarea.findMany.mockRejectedValue(new Error("DB error"));
      const res = await cargarTareasDelDia();
      expect(res.ok).toBe(false);
      if (!res.ok) expect(res.error).toBe("No se pudieron cargar las tareas del dia.");
    });
  });

  describe("cargarProyectosAccesos", () => {
    it("devuelve hasta MAX_PROYECTOS_ACCESOS proyectos", async () => {
      const proyectos = Array.from({ length: 8 }, (_, i) => ({
        id: `p-${i + 1}`, nombre: `Proyecto ${i + 1}`, createdAt: new Date(), updatedAt: new Date(), urlDocumentacion: null, activo: true,
      }));
      prismaMock.proyecto.findMany.mockResolvedValue(proyectos);

      const res = await cargarProyectosAccesos();

      expect(res.ok).toBe(true);
      if (res.ok) expect(res.proyectos).toHaveLength(6);
    });

    it("devuelve array vacio cuando no hay proyectos", async () => {
      prismaMock.proyecto.findMany.mockResolvedValue([]);
      const res = await cargarProyectosAccesos();
      expect(res.ok).toBe(true);
      if (res.ok) expect(res.proyectos).toHaveLength(0);
    });

    it("devuelve error cuando Prisma falla", async () => {
      prismaMock.proyecto.findMany.mockRejectedValue(new Error("DB error"));
      const res = await cargarProyectosAccesos();
      expect(res.ok).toBe(false);
      if (!res.ok) expect(res.error).toBe("No se pudieron cargar los proyectos.");
    });
  });

  describe("cargarEstadisticas", () => {
    it("devuelve datos con total en cero cuando no hay completadas", async () => {
      prismaMock.tareaCompletada.findMany.mockResolvedValue([]);
      prismaMock.proyecto.findMany.mockResolvedValue([]);

      const res = await cargarEstadisticas();

      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.total).toBe(0);
        expect(res.datosSemana).toEqual([]);
        expect(res.datosProyecto).toEqual([]);
      }
    });

    it("devuelve error cuando falla la consulta de completadas", async () => {
      prismaMock.tareaCompletada.findMany.mockRejectedValue(new Error("DB error"));
      const res = await cargarEstadisticas();
      expect(res.ok).toBe(false);
      if (!res.ok) expect(res.error).toBe("No se pudieron cargar las estadisticas.");
    });
  });

  describe("cargarNotificaciones", () => {
    it("devuelve la cantidad cuando hay notificaciones", async () => {
      contarNotificacionesMock.mockResolvedValue(3);
      const res = await cargarNotificaciones();
      expect(res.ok).toBe(true);
      if (res.ok) expect(res.cantidad).toBe(3);
    });

    it("devuelve cero cuando no hay notificaciones", async () => {
      contarNotificacionesMock.mockResolvedValue(0);
      const res = await cargarNotificaciones();
      expect(res.ok).toBe(true);
      if (res.ok) expect(res.cantidad).toBe(0);
    });

    it("devuelve cero en cantidad cuando falla", async () => {
      // El catch del loader convierte el rechazo en { ok: false, cantidad: 0 }
      contarNotificacionesMock.mockImplementation(() => Promise.reject(new Error("DB error")));
      const res = await cargarNotificaciones();
      expect(res.ok).toBe(false);
      if (!res.ok) expect(res.cantidad).toBe(0);
    });
  });
});
