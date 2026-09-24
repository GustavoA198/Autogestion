import { beforeEach, describe, expect, it, vi } from "vitest";

const prisma = {
  intentoAcceso: { deleteMany: vi.fn(), createMany: vi.fn(), count: vi.fn() },
};

vi.mock("@/lib/prisma", () => ({ obtenerPrisma: () => prisma }));

import {
  POLITICA_ACCESO,
  claveDeIp,
  limiteAlcanzado,
  limiteSuperado,
  obtenerIp,
  registrarIntento,
  reiniciarIntentos,
} from "@/lib/auth/limitador";

describe("obtenerIp", () => {
  it("toma la primera IP de x-forwarded-for", () => {
    expect(obtenerIp({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" })).toBe("203.0.113.7");
  });

  it("acepta la cabecera como lista", () => {
    expect(obtenerIp({ "x-forwarded-for": ["198.51.100.4", "10.0.0.1"] })).toBe("198.51.100.4");
  });

  it("usa un valor fijo cuando no hay cabecera", () => {
    expect(obtenerIp({})).toBe("desconocida");
    expect(obtenerIp({ "x-forwarded-for": "" })).toBe("desconocida");
  });
});

describe("claveDeIp", () => {
  it("es estable y no contiene la IP", () => {
    expect(claveDeIp("203.0.113.7")).toBe(claveDeIp("203.0.113.7"));
    expect(claveDeIp("203.0.113.7")).not.toContain("203.0.113.7");
    expect(claveDeIp("203.0.113.7")).not.toBe(claveDeIp("203.0.113.8"));
  });
});

describe("limiteAlcanzado", () => {
  it("se activa al llegar al máximo, no antes", () => {
    expect(limiteAlcanzado(POLITICA_ACCESO.maxPorIp - 1, 0)).toBe(false);
    expect(limiteAlcanzado(POLITICA_ACCESO.maxPorIp, 0)).toBe(true);
    expect(limiteAlcanzado(0, POLITICA_ACCESO.maxGlobal - 1)).toBe(false);
    expect(limiteAlcanzado(0, POLITICA_ACCESO.maxGlobal)).toBe(true);
  });
});

describe("limiteSuperado", () => {
  it("permite hasta el máximo por IP y bloquea el siguiente", () => {
    expect(limiteSuperado(POLITICA_ACCESO.maxPorIp, 0)).toBe(false);
    expect(limiteSuperado(POLITICA_ACCESO.maxPorIp + 1, 0)).toBe(true);
  });

  it("permite hasta el máximo global y bloquea el siguiente", () => {
    expect(limiteSuperado(0, POLITICA_ACCESO.maxGlobal)).toBe(false);
    expect(limiteSuperado(0, POLITICA_ACCESO.maxGlobal + 1)).toBe(true);
  });
});

describe("registrarIntento", () => {
  const ahora = new Date("2026-09-24T12:00:00Z");
  const { count, createMany, deleteMany } = prisma.intentoAcceso;

  // Cada recuento consulta primero la IP y después el total global
  function simularConteos(
    previoIp: number,
    previoGlobal: number,
    posteriorIp = previoIp + 1,
    posteriorGlobal = previoGlobal + 1,
  ) {
    count
      .mockResolvedValueOnce(previoIp)
      .mockResolvedValueOnce(previoGlobal)
      .mockResolvedValueOnce(posteriorIp)
      .mockResolvedValueOnce(posteriorGlobal);
  }

  beforeEach(() => {
    Object.values(prisma.intentoAcceso).forEach((mock) => mock.mockReset());
  });

  it("purga los intentos fuera de la ventana", async () => {
    simularConteos(0, 0);

    await registrarIntento("203.0.113.7", ahora);

    const desde = new Date(ahora.getTime() - POLITICA_ACCESO.ventanaMs);
    expect(deleteMany).toHaveBeenCalledWith({ where: { creadoEn: { lt: desde } } });
  });

  it("registra el intento por IP y global entre los dos recuentos", async () => {
    simularConteos(0, 0);

    expect(await registrarIntento("203.0.113.7", ahora)).toBe(false);

    expect(createMany).toHaveBeenCalledWith({
      data: [
        { clave: claveDeIp("203.0.113.7"), creadoEn: ahora },
        { clave: "global", creadoEn: ahora },
      ],
    });
    const ordenCrear = createMany.mock.invocationCallOrder[0];
    expect(count.mock.invocationCallOrder[1]).toBeLessThan(ordenCrear);
    expect(count.mock.invocationCallOrder[2]).toBeGreaterThan(ordenCrear);
  });

  it("permite el último intento del límite por IP", async () => {
    simularConteos(POLITICA_ACCESO.maxPorIp - 1, 0);
    expect(await registrarIntento("203.0.113.7", ahora)).toBe(false);
  });

  it("bloquea sin guardar filas cuando la IP ya alcanzó el límite", async () => {
    simularConteos(POLITICA_ACCESO.maxPorIp, 0);

    expect(await registrarIntento("203.0.113.7", ahora)).toBe(true);
    expect(createMany).not.toHaveBeenCalled();
  });

  it("bloquea sin guardar filas cuando el total global ya alcanzó el límite", async () => {
    simularConteos(0, POLITICA_ACCESO.maxGlobal);

    expect(await registrarIntento("198.51.100.99", ahora)).toBe(true);
    expect(createMany).not.toHaveBeenCalled();
  });

  it("bloquea si las peticiones paralelas superan el límite tras registrar", async () => {
    simularConteos(POLITICA_ACCESO.maxPorIp - 1, 0, POLITICA_ACCESO.maxPorIp + 2, 3);

    expect(await registrarIntento("203.0.113.7", ahora)).toBe(true);
  });
});

describe("reiniciarIntentos", () => {
  it("borra solo los intentos de esa IP", async () => {
    prisma.intentoAcceso.deleteMany.mockReset();

    await reiniciarIntentos("203.0.113.7");

    expect(prisma.intentoAcceso.deleteMany).toHaveBeenCalledWith({
      where: { clave: claveDeIp("203.0.113.7") },
    });
  });
});
