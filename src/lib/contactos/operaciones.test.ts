import { beforeEach, describe, expect, it, vi } from "vitest";

const prisma = {
  contacto: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    deleteMany: vi.fn(),
  },
  contactoProyecto: { createMany: vi.fn(), deleteMany: vi.fn() },
  $transaction: vi.fn(),
};
vi.mock("@/lib/prisma", () => ({ obtenerPrisma: () => prisma }));

import {
  crearContacto,
  eliminarContacto,
  esExclusiva,
  listarContactos,
  listarContactosDeProyecto,
  vincularContacto,
  desvincularContacto,
} from "@/lib/contactos/operaciones";
import type { DatosContacto } from "@/lib/contactos/validacion";

const datos: DatosContacto = {
  nombre: "Laura García",
  correo: "laura@ejemplo.com",
  telefono: "+54 9 11 1234-5678",
  empresaOCargo: "Analista",
  nota: null,
  global: false,
  proyectoIds: ["p1"],
};

beforeEach(() => {
  Object.values(prisma.contacto).forEach((mock) => mock.mockReset());
  Object.values(prisma.contactoProyecto).forEach((mock) => mock.mockReset());
  prisma.$transaction.mockReset().mockImplementation((tarea) => tarea(prisma));
});

describe("listados", () => {
  it("busca por texto en nombre, correo y empresa", async () => {
    prisma.contacto.findMany.mockResolvedValue([]);
    await listarContactos({ texto: "laura" });
    expect(prisma.contacto.findMany.mock.calls[0]![0].where).toMatchObject({
      OR: [
        { nombre: { contains: "laura", mode: "insensitive" } },
        { correo: { contains: "laura", mode: "insensitive" } },
        { empresaOCargo: { contains: "laura", mode: "insensitive" } },
      ],
    });
  });

  it("filtra por alcance global", async () => {
    prisma.contacto.findMany.mockResolvedValue([]);
    await listarContactos({ alcance: "global" });
    expect(prisma.contacto.findMany.mock.calls[0]![0].where).toEqual({ global: true });
  });

  it("filtra por proyecto", async () => {
    prisma.contacto.findMany.mockResolvedValue([]);
    await listarContactos({ alcance: "p1" });
    expect(prisma.contacto.findMany.mock.calls[0]![0].where).toEqual({
      proyectos: { some: { proyectoId: "p1" } },
    });
  });

  it("lista del proyecto incluye propias y globales", async () => {
    prisma.contacto.findMany.mockResolvedValue([]);
    await listarContactosDeProyecto("p1");
    expect(prisma.contacto.findMany.mock.calls[0]![0].where).toEqual({
      OR: [{ global: true }, { proyectos: { some: { proyectoId: "p1" } } }],
    });
  });
});

describe("crearContacto", () => {
  it("crea el contacto y vincula a proyectos", async () => {
    prisma.contacto.create.mockResolvedValue({ id: "c1" });
    expect(await crearContacto(datos)).toEqual({ ok: true, id: "c1" });
    expect(prisma.contacto.create.mock.calls[0]![0].data.proyectos.create).toEqual([
      { proyectoId: "p1" },
    ]);
  });

  it("devuelve error si un proyecto no existe", async () => {
    prisma.contacto.create.mockRejectedValue(Object.assign(new Error("fk"), { code: "P2003" }));
    expect(await crearContacto(datos)).toEqual({ ok: false, error: "proyecto-inexistente" });
  });
});

describe("vincularContacto y desvincularContacto", () => {
  it("vincular ignora duplicados", async () => {
    prisma.contactoProyecto.createMany.mockResolvedValue({ count: 0 });
    await vincularContacto("c1", "p1");
    expect(prisma.contactoProyecto.createMany).toHaveBeenCalledWith({
      data: [{ contactoId: "c1", proyectoId: "p1" }],
      skipDuplicates: true,
    });
  });

  it("desvincular solo elimina el vinculo", async () => {
    prisma.contactoProyecto.deleteMany.mockResolvedValue({ count: 1 });
    await desvincularContacto("c1", "p1");
    expect(prisma.contactoProyecto.deleteMany).toHaveBeenCalledWith({
      where: { contactoId: "c1", proyectoId: "p1" },
    });
  });
});

describe("eliminarContacto", () => {
  it("devuelve true si borro algo", async () => {
    prisma.contacto.deleteMany.mockResolvedValue({ count: 1 });
    expect(await eliminarContacto("c1")).toBe(true);
  });

  it("devuelve false si no existia", async () => {
    prisma.contacto.deleteMany.mockResolvedValue({ count: 0 });
    expect(await eliminarContacto("nada")).toBe(false);
  });
});

describe("esExclusiva", () => {
  it("true si no es global y solo esta en ese proyecto", () => {
    expect(esExclusiva({ global: false, proyectos: [{ proyectoId: "p1" }] }, "p1")).toBe(true);
  });

  it("false si es global", () => {
    expect(esExclusiva({ global: true, proyectos: [{ proyectoId: "p1" }] }, "p1")).toBe(false);
  });

  it("false si esta en mas proyectos", () => {
    expect(
      esExclusiva({ global: false, proyectos: [{ proyectoId: "p1" }, { proyectoId: "p2" }] }, "p1"),
    ).toBe(false);
  });
});
