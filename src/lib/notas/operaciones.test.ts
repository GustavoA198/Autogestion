import { beforeEach, describe, expect, it, vi } from "vitest";

const prisma = {
  nota: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    deleteMany: vi.fn(),
  },
};
vi.mock("@/lib/prisma", () => ({ obtenerPrisma: () => prisma }));

import {
  buscarNotasEnProyecto,
  crearNota,
  actualizarNota,
  eliminarNota,
  listarNotasDeProyecto,
  obtenerNota,
} from "@/lib/notas/operaciones";
import type { DatosNota } from "@/lib/notas/validacion";

const datosNota: DatosNota = {
  proyectoId: "p1",
  fecha: new Date("2026-09-20"),
  texto: "Revisión inicial del módulo.",
};

beforeEach(() => {
  Object.values(prisma.nota).forEach((mock) => mock.mockReset());
});

describe("listarNotasDeProyecto", () => {
  it("ordena por fecha descendente", async () => {
    prisma.nota.findMany.mockResolvedValue([]);
    await listarNotasDeProyecto("p1");
    expect(prisma.nota.findMany.mock.calls[0]![0].orderBy).toEqual({ fecha: "desc" });
  });

  it("filtra por proyectoId", async () => {
    prisma.nota.findMany.mockResolvedValue([]);
    await listarNotasDeProyecto("p1");
    expect(prisma.nota.findMany.mock.calls[0]![0].where).toEqual({ proyectoId: "p1" });
  });
});

describe("buscarNotasEnProyecto", () => {
  it("busca por texto de forma insensible", async () => {
    prisma.nota.findMany.mockResolvedValue([]);
    await buscarNotasEnProyecto("p1", "revisión");
    expect(prisma.nota.findMany.mock.calls[0]![0].where).toEqual({
      proyectoId: "p1",
      texto: { contains: "revisión", mode: "insensitive" },
    });
  });

  it("ordena por fecha descendente", async () => {
    prisma.nota.findMany.mockResolvedValue([]);
    await buscarNotasEnProyecto("p1", "algo");
    expect(prisma.nota.findMany.mock.calls[0]![0].orderBy).toEqual({ fecha: "desc" });
  });
});

describe("crearNota", () => {
  it("crea la nota con los datos correctos", async () => {
    prisma.nota.create.mockResolvedValue({ id: "n1" });
    const resultado = await crearNota(datosNota);
    expect(resultado).toEqual({ ok: true, id: "n1" });
    expect(prisma.nota.create.mock.calls[0]![0].data).toMatchObject({
      proyectoId: "p1",
      texto: "Revisión inicial del módulo.",
    });
  });
});

describe("actualizarNota", () => {
  it("devuelve null si la nota no existe", async () => {
    prisma.nota.findUnique.mockResolvedValue(null);
    const resultado = await actualizarNota("n1", { fecha: new Date(), texto: "nuevo" });
    expect(resultado).toBeNull();
  });

  it("actualiza texto y fecha", async () => {
    prisma.nota.findUnique.mockResolvedValue({
      id: "n1",
      proyectoId: "p1",
      texto: "viejo",
      fecha: new Date(),
      creadoEn: new Date(),
      actualizadoEn: new Date(),
    });
    prisma.nota.update.mockResolvedValue({ id: "n1" });
    const resultado = await actualizarNota("n1", {
      fecha: new Date("2026-09-21"),
      texto: "nuevo texto",
    });
    expect(resultado).toEqual({ ok: true, id: "n1" });
    expect(prisma.nota.update.mock.calls[0]![0].data.texto).toBe("nuevo texto");
  });
});

describe("eliminarNota", () => {
  it("devuelve true si eliminó", async () => {
    prisma.nota.deleteMany.mockResolvedValue({ count: 1 });
    expect(await eliminarNota("n1")).toBe(true);
  });

  it("devuelve false si no existía", async () => {
    prisma.nota.deleteMany.mockResolvedValue({ count: 0 });
    expect(await eliminarNota("nada")).toBe(false);
  });
});

describe("obtenerNota", () => {
  it("busca por id", async () => {
    prisma.nota.findUnique.mockResolvedValue(null);
    await obtenerNota("n1");
    expect(prisma.nota.findUnique.mock.calls[0]![0].where).toEqual({ id: "n1" });
  });
});
