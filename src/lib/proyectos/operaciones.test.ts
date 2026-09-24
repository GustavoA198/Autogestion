import { beforeEach, describe, expect, it, vi } from "vitest";

const prisma = {
  proyecto: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    deleteMany: vi.fn(),
  },
  credencial: { deleteMany: vi.fn() },
  $transaction: vi.fn(),
};

vi.mock("@/lib/prisma", () => ({ obtenerPrisma: () => prisma }));

import {
  actualizarProyecto,
  crearProyecto,
  eliminarProyecto,
  listarProyectos,
} from "@/lib/proyectos/operaciones";

const datos = { nombre: "Cliente Norte", descripcion: null, enlaceDocumentacion: null };
const errorPrisma = (code: string) => Object.assign(new Error("prisma"), { code });

beforeEach(() => {
  Object.values(prisma.proyecto).forEach((mock) => mock.mockReset());
  prisma.credencial.deleteMany.mockReset();
  prisma.$transaction.mockReset().mockImplementation((tarea) => tarea(prisma));
});

describe("listarProyectos", () => {
  it("ordena por nombre", async () => {
    prisma.proyecto.findMany.mockResolvedValue([]);
    await listarProyectos();
    expect(prisma.proyecto.findMany).toHaveBeenCalledWith({ orderBy: { nombre: "asc" } });
  });
});

describe("crearProyecto", () => {
  it("devuelve el id del proyecto creado", async () => {
    prisma.proyecto.create.mockResolvedValue({ id: "p1" });
    expect(await crearProyecto(datos)).toEqual({ ok: true, id: "p1" });
    expect(prisma.proyecto.create).toHaveBeenCalledWith({ data: datos });
  });

  it("informa nombre duplicado cuando Prisma viola la unicidad", async () => {
    prisma.proyecto.create.mockRejectedValue(errorPrisma("P2002"));
    expect(await crearProyecto(datos)).toEqual({ ok: false, error: "nombre-duplicado" });
  });

  it("propaga los errores inesperados", async () => {
    prisma.proyecto.create.mockRejectedValue(errorPrisma("P1001"));
    await expect(crearProyecto(datos)).rejects.toThrow("prisma");
  });
});

describe("actualizarProyecto", () => {
  it("actualiza por id", async () => {
    prisma.proyecto.update.mockResolvedValue({ id: "p1" });
    expect(await actualizarProyecto("p1", datos)).toEqual({ ok: true, id: "p1" });
    expect(prisma.proyecto.update).toHaveBeenCalledWith({ where: { id: "p1" }, data: datos });
  });

  it("informa nombre duplicado", async () => {
    prisma.proyecto.update.mockRejectedValue(errorPrisma("P2002"));
    expect(await actualizarProyecto("p1", datos)).toEqual({ ok: false, error: "nombre-duplicado" });
  });

  it("devuelve null si el proyecto ya no existe", async () => {
    prisma.proyecto.update.mockRejectedValue(errorPrisma("P2025"));
    expect(await actualizarProyecto("p1", datos)).toBeNull();
  });
});

describe("eliminarProyecto", () => {
  it("elimina solo el proyecto indicado y confirma", async () => {
    prisma.proyecto.deleteMany.mockResolvedValue({ count: 1 });
    expect(await eliminarProyecto("p1")).toBe(true);
    expect(prisma.proyecto.deleteMany).toHaveBeenCalledWith({ where: { id: "p1" } });
  });

  it("devuelve false si no existía", async () => {
    prisma.proyecto.deleteMany.mockResolvedValue({ count: 0 });
    expect(await eliminarProyecto("nada")).toBe(false);
  });

  it("borra solo las credenciales exclusivas: no globales y sin otros proyectos", async () => {
    prisma.proyecto.deleteMany.mockResolvedValue({ count: 1 });
    await eliminarProyecto("p1");
    expect(prisma.credencial.deleteMany).toHaveBeenCalledWith({
      where: {
        global: false,
        proyectos: { some: { proyectoId: "p1" } },
        NOT: { proyectos: { some: { proyectoId: { not: "p1" } } } },
      },
    });
  });

  it("ejecuta el borrado de credenciales y del proyecto en una sola transacción", async () => {
    prisma.proyecto.deleteMany.mockResolvedValue({ count: 1 });
    await eliminarProyecto("p1");
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });
});
