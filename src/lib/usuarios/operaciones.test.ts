import { beforeEach, describe, expect, it, vi } from "vitest";

const { verificarClave, tablaUsuario } = vi.hoisted(() => ({
  verificarClave: vi.fn(),
  tablaUsuario: {
    findUnique: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock("@/lib/auth/clave", async (original) => ({
  ...(await original<typeof import("@/lib/auth/clave")>()),
  verificarClave,
}));

vi.mock("@/lib/prisma", () => ({ obtenerPrisma: () => ({ usuario: tablaUsuario }) }));

import {
  actualizarClave,
  crearUsuario,
  existeUsuario,
  obtenerUsuarioPorNombre,
  verificarCredenciales,
} from "@/lib/usuarios/operaciones";

const USUARIO = {
  id: "ck9x2m7p000001a2b3c",
  nombre: "gustavo",
  claveHash: "scrypt:15:8:3:c2FsdA:aGFzaA",
  creadoEn: new Date(0),
  actualizadoEn: new Date(0),
};

const FORMATO_HASH = /^scrypt:\d+:\d+:\d+:[\w-]+:[\w-]+$/;

describe("verificarCredenciales", () => {
  beforeEach(() => {
    tablaUsuario.findUnique.mockReset();
    verificarClave.mockReset();
  });

  it("acepta las credenciales correctas", async () => {
    tablaUsuario.findUnique.mockResolvedValue(USUARIO);
    verificarClave.mockResolvedValue(true);

    expect(await verificarCredenciales("gustavo", "la-clave")).toEqual({
      ok: true,
      usuario: USUARIO,
    });
    expect(verificarClave).toHaveBeenCalledWith("la-clave", USUARIO.claveHash);
  });

  it("rechaza una contraseña incorrecta", async () => {
    tablaUsuario.findUnique.mockResolvedValue(USUARIO);
    verificarClave.mockResolvedValue(false);

    expect(await verificarCredenciales("gustavo", "mala")).toEqual({ ok: false });
  });

  it("rechaza un usuario inexistente sin revelar que no existe", async () => {
    tablaUsuario.findUnique.mockResolvedValue(null);
    verificarClave.mockResolvedValue(false);

    expect(await verificarCredenciales("otro", "la-clave")).toEqual({ ok: false });
  });

  // Si el usuario no existiera y no se derivara la clave, el tiempo de respuesta revelaría qué nombres hay
  it("deriva la clave contra un hash señuelo aunque el usuario no exista", async () => {
    tablaUsuario.findUnique.mockResolvedValue(null);
    verificarClave.mockResolvedValue(false);

    await verificarCredenciales("otro", "la-clave");

    expect(verificarClave).toHaveBeenCalledTimes(1);
    const hashUsado = verificarClave.mock.calls[0][1];
    expect(hashUsado).toMatch(FORMATO_HASH);
    expect(hashUsado).not.toBe(USUARIO.claveHash);
  });
});

describe("obtenerUsuarioPorNombre", () => {
  it("devuelve el usuario encontrado", async () => {
    tablaUsuario.findUnique.mockResolvedValue(USUARIO);
    expect(await obtenerUsuarioPorNombre("gustavo")).toEqual(USUARIO);
  });

  it("devuelve null si no existe", async () => {
    tablaUsuario.findUnique.mockResolvedValue(null);
    expect(await obtenerUsuarioPorNombre("otro")).toBeNull();
  });
});

describe("existeUsuario", () => {
  it.each([
    [1, true],
    [0, false],
  ])("con %i filas responde %s", async (cantidad, esperado) => {
    tablaUsuario.count.mockResolvedValue(cantidad);
    expect(await existeUsuario()).toBe(esperado);
  });
});

describe("crearUsuario", () => {
  beforeEach(() => tablaUsuario.create.mockReset());

  it("guarda el hash de la contraseña y nunca la contraseña", async () => {
    tablaUsuario.create.mockResolvedValue(USUARIO);

    await crearUsuario("gustavo", "clave-en-claro-1234");

    const datos = tablaUsuario.create.mock.calls[0][0].data;
    expect(datos.nombre).toBe("gustavo");
    expect(datos.claveHash).toMatch(FORMATO_HASH);
    expect(datos.claveHash).not.toContain("clave-en-claro-1234");
  });
});

describe("actualizarClave", () => {
  beforeEach(() => tablaUsuario.update.mockReset());

  it("reemplaza el hash del usuario indicado por su id", async () => {
    tablaUsuario.update.mockResolvedValue(USUARIO);

    await actualizarClave(USUARIO.id, "clave-nueva-1234");

    const llamada = tablaUsuario.update.mock.calls[0][0];
    expect(llamada.where).toEqual({ id: USUARIO.id });
    expect(llamada.data.claveHash).toMatch(FORMATO_HASH);
    expect(llamada.data.claveHash).not.toContain("clave-nueva-1234");
  });
});
