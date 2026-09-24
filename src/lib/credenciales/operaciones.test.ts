import { randomBytes } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

const prisma = {
  credencial: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    deleteMany: vi.fn(),
  },
  credencialProyecto: { createMany: vi.fn(), deleteMany: vi.fn() },
  historialCredencial: { createMany: vi.fn() },
  $transaction: vi.fn(),
};
vi.mock("@/lib/prisma", () => ({ obtenerPrisma: () => prisma }));

import { cifrar } from "@/lib/cifrado/cifrado";
import {
  actualizarCredencial,
  crearCredencial,
  desvincularCredencial,
  listarCredenciales,
  listarCredencialesDeProyecto,
  obtenerSecreto,
  resumirEliminacionProyecto,
  vincularCredencial,
} from "@/lib/credenciales/operaciones";
import type { DatosCredencial } from "@/lib/credenciales/validacion";

const datos: DatosCredencial = {
  nombre: "GoAnywhere",
  categoria: "SERVIDOR",
  usuario: "admin",
  host: null,
  nota: null,
  global: false,
  proyectoIds: ["p1", "p2"],
  secreto: "secreto-en-claro",
};
const existente = {
  nombre: "GoAnywhere",
  categoria: "SERVIDOR",
  usuario: "admin",
  host: null,
  nota: null,
  global: false,
  proyectos: [{ proyectoId: "p1" }, { proyectoId: "p2" }],
};

beforeEach(() => {
  process.env.CLAVE_CIFRADO = randomBytes(32).toString("base64");
  for (const grupo of [prisma.credencial, prisma.credencialProyecto, prisma.historialCredencial]) {
    Object.values(grupo).forEach((mock) => mock.mockReset());
  }
  prisma.$transaction.mockReset().mockImplementation((tarea) => tarea(prisma));
});

describe("listados", () => {
  it("nunca piden el secreto cifrado", async () => {
    prisma.credencial.findMany.mockResolvedValue([]);
    await listarCredenciales();
    await listarCredencialesDeProyecto("p1");
    for (const [consulta] of prisma.credencial.findMany.mock.calls) {
      expect(consulta.omit).toEqual({ secretoCifrado: true });
    }
  });

  it("filtra por categoría y por alcance global", async () => {
    prisma.credencial.findMany.mockResolvedValue([]);
    await listarCredenciales({ categoria: "BASE_DATOS", alcance: "global" });
    expect(prisma.credencial.findMany.mock.calls[0]![0].where).toEqual({
      categoria: "BASE_DATOS",
      global: true,
    });
  });

  it("filtra por proyecto usando el vínculo", async () => {
    prisma.credencial.findMany.mockResolvedValue([]);
    await listarCredenciales({ alcance: "p9" });
    expect(prisma.credencial.findMany.mock.calls[0]![0].where).toEqual({
      proyectos: { some: { proyectoId: "p9" } },
    });
  });

  it("la lista de un proyecto incluye las propias y las globales", async () => {
    prisma.credencial.findMany.mockResolvedValue([]);
    await listarCredencialesDeProyecto("p1");
    expect(prisma.credencial.findMany.mock.calls[0]![0].where).toEqual({
      OR: [{ global: true }, { proyectos: { some: { proyectoId: "p1" } } }],
    });
  });
});

describe("crearCredencial", () => {
  it("guarda el secreto cifrado y vincula a varios proyectos", async () => {
    prisma.credencial.create.mockResolvedValue({ id: "c1" });
    expect(await crearCredencial(datos)).toEqual({ ok: true, id: "c1" });
    const { data } = prisma.credencial.create.mock.calls[0]![0];
    expect(data.secretoCifrado).toMatch(/^v1:/);
    expect(JSON.stringify(data)).not.toContain("secreto-en-claro");
    expect(data.proyectos.create).toEqual([{ proyectoId: "p1" }, { proyectoId: "p2" }]);
  });

  it("una global se crea sin vínculos", async () => {
    prisma.credencial.create.mockResolvedValue({ id: "c1" });
    await crearCredencial({ ...datos, global: true, proyectoIds: [] });
    expect(prisma.credencial.create.mock.calls[0]![0].data.proyectos.create).toEqual([]);
  });

  it("informa proyecto inexistente ante una violación de llave foránea", async () => {
    prisma.credencial.create.mockRejectedValue(Object.assign(new Error("x"), { code: "P2003" }));
    expect(await crearCredencial(datos)).toEqual({ ok: false, error: "proyecto-inexistente" });
  });
});

describe("actualizarCredencial", () => {
  it("con secreto vacío conserva el actual y no registra historial si nada cambió", async () => {
    prisma.credencial.findUnique.mockResolvedValue(existente);
    expect(await actualizarCredencial("c1", { ...datos, secreto: null })).toEqual({
      ok: true,
      id: "c1",
    });
    expect(prisma.credencial.update).not.toHaveBeenCalled();
    expect(prisma.historialCredencial.createMany).not.toHaveBeenCalled();
  });

  it("sin secreto nuevo no toca el secreto y el historial solo lleva nombres de campo", async () => {
    prisma.credencial.findUnique.mockResolvedValue(existente);
    await actualizarCredencial("c1", { ...datos, secreto: null, usuario: "root", nota: "algo" });
    const { data } = prisma.credencial.update.mock.calls[0]![0];
    expect(data).not.toHaveProperty("secretoCifrado");
    expect(data).not.toHaveProperty("secretoActualizadoEn");
    expect(prisma.historialCredencial.createMany).toHaveBeenCalledWith({
      data: [
        { credencialId: "c1", campo: "usuario" },
        { credencialId: "c1", campo: "nota" },
      ],
    });
  });

  it("con secreto nuevo lo cifra, renueva la fecha y registra solo el campo", async () => {
    prisma.credencial.findUnique.mockResolvedValue(existente);
    await actualizarCredencial("c1", { ...datos, secreto: "nuevo-secreto" });
    const { data } = prisma.credencial.update.mock.calls[0]![0];
    expect(data.secretoCifrado).toMatch(/^v1:/);
    expect(data.secretoActualizadoEn).toBeInstanceOf(Date);
    expect(prisma.historialCredencial.createMany).toHaveBeenCalledWith({
      data: [{ credencialId: "c1", campo: "secreto" }],
    });
    expect(JSON.stringify(prisma.historialCredencial.createMany.mock.calls)).not.toContain(
      "nuevo-secreto",
    );
  });

  it("reemplaza los vínculos solo cuando cambia el alcance", async () => {
    prisma.credencial.findUnique.mockResolvedValue(existente);
    await actualizarCredencial("c1", { ...datos, secreto: null, proyectoIds: ["p3"] });
    expect(prisma.credencial.update.mock.calls[0]![0].data.proyectos).toEqual({
      deleteMany: {},
      create: [{ proyectoId: "p3" }],
    });
  });

  it("devuelve null si la credencial ya no existe", async () => {
    prisma.credencial.findUnique.mockResolvedValue(null);
    expect(await actualizarCredencial("c1", datos)).toBeNull();
  });
});

describe("obtenerSecreto", () => {
  it("descifra el secreto guardado", async () => {
    prisma.credencial.findUnique.mockResolvedValue({ secretoCifrado: cifrar("secreto-en-claro") });
    expect(await obtenerSecreto("c1")).toBe("secreto-en-claro");
  });

  it("devuelve null si no existe", async () => {
    prisma.credencial.findUnique.mockResolvedValue(null);
    expect(await obtenerSecreto("c1")).toBeNull();
  });
});

describe("vínculos", () => {
  it("vincular no duplica y desvincular borra solo el vínculo", async () => {
    await vincularCredencial("c1", "p1");
    expect(prisma.credencialProyecto.createMany).toHaveBeenCalledWith({
      data: [{ credencialId: "c1", proyectoId: "p1" }],
      skipDuplicates: true,
    });
    await desvincularCredencial("c1", "p1");
    expect(prisma.credencialProyecto.deleteMany).toHaveBeenCalledWith({
      where: { credencialId: "c1", proyectoId: "p1" },
    });
    expect(prisma.credencial.deleteMany).not.toHaveBeenCalled();
  });
});

describe("resumirEliminacionProyecto", () => {
  it("separa exclusivas de compartidas y globales", async () => {
    prisma.credencial.findMany.mockResolvedValue([
      { nombre: "Exclusiva", global: false, proyectos: [{ proyectoId: "p1" }] },
      {
        nombre: "Compartida",
        global: false,
        proyectos: [{ proyectoId: "p1" }, { proyectoId: "p2" }],
      },
      { nombre: "Global", global: true, proyectos: [{ proyectoId: "p1" }] },
    ]);
    expect(await resumirEliminacionProyecto("p1")).toEqual({
      exclusivas: ["Exclusiva"],
      desvinculadas: ["Compartida", "Global"],
    });
  });
});
