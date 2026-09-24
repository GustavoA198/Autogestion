import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = {
  tarea: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    deleteMany: vi.fn(),
  },
  tareaCompletada: {
    create: vi.fn(),
    deleteMany: vi.fn(),
    count: vi.fn(),
  },
};
vi.mock("@/lib/prisma", () => ({ obtenerPrisma: () => prismaMock }));
vi.mock("@/lib/tareas/tiempo", () => ({ leerEntornoTiempo: () => ({ TZ: "America/Bogota" }) }));

import { crearTarea, eliminarTarea } from "./operaciones";
import { FrecuenciaTarea } from "@/generated/prisma/enums";

describe("operaciones", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("crearTarea", () => {
    it("crea una tarea diaria", async () => {
      prismaMock.tarea.create.mockResolvedValue({ id: "tarea-1" });

      const datos = {
        titulo: "Revisar correo",
        descripcion: null,
        tipoFrecuencia: FrecuenciaTarea.DIARIA,
        diaSemana: null,
        diaMes: null,
        fechaPuntual: null,
        proyectoId: null,
        activa: true,
      };

      const resultado = await crearTarea(datos);
      expect(resultado.id).toBe("tarea-1");
      expect(prismaMock.tarea.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ titulo: "Revisar correo", tipoFrecuencia: "DIARIA" }),
        select: { id: true },
      });
    });

    it("crea una tarea semanal con diaSemana", async () => {
      prismaMock.tarea.create.mockResolvedValue({ id: "tarea-2" });

      const datos = {
        titulo: "Reunión semanal",
        descripcion: null,
        tipoFrecuencia: FrecuenciaTarea.SEMANAL,
        diaSemana: 1,
        diaMes: null,
        fechaPuntual: null,
        proyectoId: null,
        activa: true,
      };

      await crearTarea(datos);
      expect(prismaMock.tarea.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ diaSemana: 1 }),
        select: { id: true },
      });
    });

    it("crea una tarea mensual con diaMes", async () => {
      prismaMock.tarea.create.mockResolvedValue({ id: "tarea-3" });

      const datos = {
        titulo: "Reporte mensual",
        descripcion: null,
        tipoFrecuencia: FrecuenciaTarea.MENSUAL,
        diaSemana: null,
        diaMes: 15,
        fechaPuntual: null,
        proyectoId: null,
        activa: true,
      };

      await crearTarea(datos);
      expect(prismaMock.tarea.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ diaMes: 15 }),
        select: { id: true },
      });
    });
  });

  describe("eliminarTarea", () => {
    it("devuelve true cuando elimina", async () => {
      prismaMock.tarea.deleteMany.mockResolvedValue({ count: 1 });
      const resultado = await eliminarTarea("tarea-1");
      expect(resultado).toBe(true);
    });

    it("devuelve false cuando no existe", async () => {
      prismaMock.tarea.deleteMany.mockResolvedValue({ count: 0 });
      const resultado = await eliminarTarea("inexistente");
      expect(resultado).toBe(false);
    });
  });
});
