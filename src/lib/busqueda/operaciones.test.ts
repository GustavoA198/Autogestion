import { describe, expect, it, vi, beforeEach } from "vitest";

const prisma = {
  credencial: { findMany: vi.fn() },
  contacto: { findMany: vi.fn() },
  nota: { findMany: vi.fn() },
  tarea: { findMany: vi.fn() },
};
vi.mock("@/lib/prisma", () => ({ obtenerPrisma: () => prisma }));

import { buscarGlobal } from "@/lib/busqueda/operaciones";

const credencialMock = (override = {}) => ({
  id: "c1",
  nombre: "DB Production",
  categoria: "BASE_DATOS",
  usuario: "admin",
  global: false,
  proyectos: [{ proyectoId: "p1" }],
  ...override,
});

const contactoMock = (override = {}) => ({
  id: "co1",
  nombre: "Juan Pérez",
  correo: "juan@example.com",
  empresaOCargo: "Gerente",
  global: false,
  proyectos: [{ proyectoId: "p1" }],
  ...override,
});

const notaMock = (override = {}) => ({
  id: "n1",
  texto: "Nota sobre el proyecto",
  proyectoId: "p1",
  ...override,
});

const tareaMock = (override = {}) => ({
  id: "t1",
  titulo: "Tarea importante",
  descripcion: "Descripción",
  proyecto: { id: "p1" },
  ...override,
});

beforeEach(() => {
  for (const modelo of Object.values(prisma)) {
    for (const fn of Object.values(modelo)) {
      fn.mockReset();
    }
  }
});

describe("buscarGlobal", () => {
  it("busca credenciales por nombre sin devolver secreto", async () => {
    prisma.credencial.findMany.mockResolvedValue([credencialMock()]);
    prisma.contacto.findMany.mockResolvedValue([]);
    prisma.nota.findMany.mockResolvedValue([]);
    prisma.tarea.findMany.mockResolvedValue([]);

    const resultado = await buscarGlobal("DB");
    expect(resultado.credenciales).toHaveLength(1);
    expect(resultado.credenciales[0]).not.toHaveProperty("secretoCifrado");
    expect(resultado.credenciales[0]).not.toHaveProperty("secreto");
  });

  it("busca credenciales con mode insensitive", async () => {
    prisma.credencial.findMany.mockResolvedValue([credencialMock()]);
    prisma.contacto.findMany.mockResolvedValue([]);
    prisma.nota.findMany.mockResolvedValue([]);
    prisma.tarea.findMany.mockResolvedValue([]);

    await buscarGlobal("PRODUCCIÓN");
    expect(prisma.credencial.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            expect.objectContaining({ nombre: expect.objectContaining({ mode: "insensitive" }) }),
          ]),
        }),
      }),
    );
  });

  it("busca contactos por nombre y correo", async () => {
    prisma.credencial.findMany.mockResolvedValue([]);
    prisma.contacto.findMany.mockResolvedValue([contactoMock()]);
    prisma.nota.findMany.mockResolvedValue([]);
    prisma.tarea.findMany.mockResolvedValue([]);

    const resultado = await buscarGlobal("Juan");
    expect(resultado.contactos).toHaveLength(1);
    expect(resultado.contactos[0].nombre).toBe("Juan Pérez");
  });

  it("busca notas por texto", async () => {
    prisma.credencial.findMany.mockResolvedValue([]);
    prisma.contacto.findMany.mockResolvedValue([]);
    prisma.nota.findMany.mockResolvedValue([notaMock()]);
    prisma.tarea.findMany.mockResolvedValue([]);

    const resultado = await buscarGlobal("proyecto");
    expect(resultado.notas).toHaveLength(1);
  });

  it("busca tareas por titulo y descripcion", async () => {
    prisma.credencial.findMany.mockResolvedValue([]);
    prisma.contacto.findMany.mockResolvedValue([]);
    prisma.nota.findMany.mockResolvedValue([]);
    prisma.tarea.findMany.mockResolvedValue([tareaMock()]);

    const resultado = await buscarGlobal("importante");
    expect(resultado.tareas).toHaveLength(1);
    expect(resultado.tareas[0].titulo).toBe("Tarea importante");
  });

  it("devuelve proyectoId null para globales", async () => {
    prisma.credencial.findMany.mockResolvedValue([credencialMock({ global: true, proyectos: [] })]);
    prisma.contacto.findMany.mockResolvedValue([]);
    prisma.nota.findMany.mockResolvedValue([]);
    prisma.tarea.findMany.mockResolvedValue([]);

    const resultado = await buscarGlobal("DB");
    expect(resultado.credenciales[0].proyectoId).toBeNull();
  });

  it("devuelve proyectoId para notas (siempre tienen proyecto)", async () => {
    prisma.credencial.findMany.mockResolvedValue([]);
    prisma.contacto.findMany.mockResolvedValue([]);
    prisma.nota.findMany.mockResolvedValue([notaMock()]);
    prisma.tarea.findMany.mockResolvedValue([]);

    const resultado = await buscarGlobal("proyecto");
    expect(resultado.notas[0].proyectoId).toBe("p1");
  });

  it("devuelve proyectoId null para tareas independientes", async () => {
    prisma.credencial.findMany.mockResolvedValue([]);
    prisma.contacto.findMany.mockResolvedValue([]);
    prisma.nota.findMany.mockResolvedValue([]);
    prisma.tarea.findMany.mockResolvedValue([tareaMock({ proyecto: null })]);

    const resultado = await buscarGlobal("importante");
    expect(resultado.tareas[0].proyectoId).toBeNull();
  });

  it("devuelve arrays vacíos cuando no hay resultados", async () => {
    prisma.credencial.findMany.mockResolvedValue([]);
    prisma.contacto.findMany.mockResolvedValue([]);
    prisma.nota.findMany.mockResolvedValue([]);
    prisma.tarea.findMany.mockResolvedValue([]);

    const resultado = await buscarGlobal("inexistente");
    expect(resultado.credenciales).toHaveLength(0);
    expect(resultado.contactos).toHaveLength(0);
    expect(resultado.notas).toHaveLength(0);
    expect(resultado.tareas).toHaveLength(0);
  });

  it("consulta en paralelo los cuatro tipos", async () => {
    prisma.credencial.findMany.mockResolvedValue([]);
    prisma.contacto.findMany.mockResolvedValue([]);
    prisma.nota.findMany.mockResolvedValue([]);
    prisma.tarea.findMany.mockResolvedValue([]);

    await buscarGlobal("test");
    expect(prisma.credencial.findMany).toHaveBeenCalled();
    expect(prisma.contacto.findMany).toHaveBeenCalled();
    expect(prisma.nota.findMany).toHaveBeenCalled();
    expect(prisma.tarea.findMany).toHaveBeenCalled();
  });

  it("no incluye secreto en resultados de credenciales", async () => {
    prisma.credencial.findMany.mockResolvedValue([credencialMock()]);
    prisma.contacto.findMany.mockResolvedValue([]);
    prisma.nota.findMany.mockResolvedValue([]);
    prisma.tarea.findMany.mockResolvedValue([]);

    const keys = Object.keys((await buscarGlobal("DB")).credenciales[0]);
    expect(keys).not.toContain("secretoCifrado");
    expect(keys).not.toContain("secreto");
  });

  it("devuelve todas las categorías vacías cuando falla la consulta", async () => {
    prisma.credencial.findMany.mockRejectedValue(new Error("DB error"));
    prisma.contacto.findMany.mockResolvedValue([]);
    prisma.nota.findMany.mockResolvedValue([]);
    prisma.tarea.findMany.mockResolvedValue([]);

    await expect(buscarGlobal("test")).rejects.toThrow("DB error");
  });
});
