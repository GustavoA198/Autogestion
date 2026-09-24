import { beforeEach, describe, expect, it, vi } from "vitest";

const consultar = vi.fn();

vi.mock("@/lib/prisma", () => ({
  obtenerPrisma: () => ({ $queryRaw: consultar }),
}));

import { GET } from "@/app/api/health/route";

describe("GET /api/health", () => {
  beforeEach(() => {
    consultar.mockReset();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("responde 200 cuando la base de datos responde", async () => {
    consultar.mockResolvedValue([{ "?column?": 1 }]);

    const respuesta = await GET();

    expect(respuesta.status).toBe(200);
    expect(await respuesta.json()).toEqual({ estado: "ok", baseDatos: "conectada" });
  });

  it("responde 503 sin filtrar detalles cuando la base de datos falla", async () => {
    consultar.mockRejectedValue(new Error("password authentication failed for user secreto"));

    const respuesta = await GET();
    const cuerpo = await respuesta.json();

    expect(respuesta.status).toBe(503);
    expect(cuerpo).toEqual({ estado: "error", baseDatos: "sin conexión" });
    expect(JSON.stringify(cuerpo)).not.toContain("secreto");
  });
});
