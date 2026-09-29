// Pruebas de la consulta de reuniones por rango: solapamiento con los bordes y enlace inferido.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { listarReunionesEnRango } from "./operaciones";

const prismaMock = vi.hoisted(() => ({
  reunion: { findMany: vi.fn() },
}));
vi.mock("@/lib/prisma", () => ({ obtenerPrisma: () => prismaMock }));

const fila = {
  id: "r1",
  proveedor: "GOOGLE" as const,
  idExterno: "g1",
  titulo: "Daily",
  descripcion: null,
  inicio: new Date("2026-09-24T15:00:00Z"),
  fin: new Date("2026-09-24T15:30:00Z"),
  enlaceReunion: null,
  enlaceEvento: null,
  ubicacion: "https://meet.google.com/abc-defg-hij",
  organizador: null,
  estado: "confirmed",
  diaCompleto: false,
  invitados: [{ email: "a@x.com" }],
  cuentaCalendarioId: "c1",
  creadoEn: new Date(),
  actualizadoEn: new Date(),
};

describe("listarReunionesEnRango", () => {
  beforeEach(() => vi.clearAllMocks());

  it("consulta las reuniones que se solapan con el rango, incluidas las que cruzan los bordes", async () => {
    prismaMock.reunion.findMany.mockResolvedValue([]);
    const desde = new Date("2026-09-24T05:00:00Z");
    const hasta = new Date("2026-09-25T05:00:00Z");
    await listarReunionesEnRango(desde, hasta);
    expect(prismaMock.reunion.findMany).toHaveBeenCalledWith({
      where: { inicio: { lt: hasta }, fin: { gte: desde } },
      orderBy: [{ inicio: "asc" }, { fin: "asc" }],
    });
  });

  it("devuelve reuniones de la UI con el enlace inferido de la ubicación", async () => {
    prismaMock.reunion.findMany.mockResolvedValue([fila]);
    const [reunion] = await listarReunionesEnRango(new Date(0), new Date(1));
    expect(reunion).toMatchObject({
      id: "r1",
      titulo: "Daily",
      enlaceReunion: "https://meet.google.com/abc-defg-hij",
      diaCompleto: false,
      invitados: [{ email: "a@x.com" }],
    });
    expect(reunion).not.toHaveProperty("cuentaCalendarioId");
  });

  it("tolera invitados que no son una lista", async () => {
    prismaMock.reunion.findMany.mockResolvedValue([{ ...fila, invitados: null }]);
    const [reunion] = await listarReunionesEnRango(new Date(0), new Date(1));
    expect(reunion.invitados).toEqual([]);
  });
});
