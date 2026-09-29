// Pruebas del detalle completo de eventos: mapeo de proveedores, enlaces seguros y persistencia.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { enlaceSeguro, type EventoCalendario, type ProveedorCalendario } from "./proveedor";
import { mapearEventoGoogle } from "./google/proveedor-google";
import { mapearEventoGraph } from "./microsoft/proveedor-microsoft";
import { sincronizarReuniones } from "./operaciones";

const prismaMock = vi.hoisted(() => ({
  cuentaCalendario: { findUnique: vi.fn() },
  reunion: { upsert: vi.fn((a: unknown) => a), deleteMany: vi.fn((a: unknown) => a) },
  $transaction: vi.fn(),
}));
vi.mock("@/lib/prisma", () => ({ obtenerPrisma: () => prismaMock }));

describe("enlaceSeguro", () => {
  it("acepta http y https", () => {
    expect(enlaceSeguro("https://meet.google.com/abc")).toBe("https://meet.google.com/abc");
    expect(enlaceSeguro("http://ejemplo.com/x")).toBe("http://ejemplo.com/x");
  });

  it("rechaza esquemas peligrosos y valores vacíos", () => {
    expect(enlaceSeguro("javascript:alert(1)")).toBeUndefined();
    expect(enlaceSeguro("data:text/html,x")).toBeUndefined();
    expect(enlaceSeguro("no es url")).toBeUndefined();
    expect(enlaceSeguro(null)).toBeUndefined();
  });
});

describe("mapearEventoGoogle", () => {
  it("conserva enlaces, ubicación, organizador, estado e invitados", () => {
    const e = mapearEventoGoogle({
      id: "g1",
      summary: "Daily",
      htmlLink: "https://www.google.com/calendar/event?eid=1",
      hangoutLink: "https://meet.google.com/abc-defg",
      location: "Sala 2",
      status: "confirmed",
      organizer: { email: "org@x.com" },
      start: { dateTime: "2026-09-25T10:00:00-05:00" },
      end: { dateTime: "2026-09-25T10:30:00-05:00" },
      attendees: [{ email: "a@x.com", responseStatus: "accepted", optional: true }],
    });
    expect(e.enlaceEvento).toBe("https://www.google.com/calendar/event?eid=1");
    expect(e.enlaceReunion).toBe("https://meet.google.com/abc-defg");
    expect(e.ubicacion).toBe("Sala 2");
    expect(e.organizador).toBe("org@x.com");
    expect(e.estado).toBe("confirmed");
    expect(e.diaCompleto).toBe(false);
    expect(e.invitados).toEqual([
      {
        nombre: undefined,
        email: "a@x.com",
        respuesta: "accepted",
        organizador: undefined,
        opcional: true,
      },
    ]);
  });

  it("usa el entryPoint de video y detecta día completo", () => {
    const e = mapearEventoGoogle({
      id: "g2",
      start: { date: "2026-09-25" },
      end: { date: "2026-09-26" },
      conferenceData: {
        entryPoints: [{ entryPointType: "video", uri: "https://zoom.us/j/1" }],
      },
    });
    expect(e.enlaceReunion).toBe("https://zoom.us/j/1");
    expect(e.diaCompleto).toBe(true);
  });

  it("descarta enlaces con esquema no permitido", () => {
    const e = mapearEventoGoogle({ id: "g3", htmlLink: "javascript:alert(1)" });
    expect(e.enlaceEvento).toBeUndefined();
  });
});

describe("mapearEventoGraph", () => {
  it("interpreta las fechas como UTC y mapea el detalle", () => {
    const e = mapearEventoGraph({
      id: "m1",
      subject: "Reunión",
      webLink: "https://outlook.office.com/calendar/item/1",
      onlineMeeting: { joinUrl: "https://teams.microsoft.com/l/meetup-join/1" },
      location: { displayName: "Oficina" },
      organizer: { emailAddress: { name: "Ana", address: "ana@x.com" } },
      start: { dateTime: "2026-09-25T10:00:00.0000000" },
      end: { dateTime: "2026-09-25T11:00:00.0000000" },
      attendees: [
        {
          type: "optional",
          status: { response: "accepted" },
          emailAddress: { address: "b@x.com" },
        },
      ],
    });
    expect(e.inicio.toISOString()).toBe("2026-09-25T10:00:00.000Z");
    expect(e.enlaceReunion).toBe("https://teams.microsoft.com/l/meetup-join/1");
    expect(e.enlaceEvento).toBe("https://outlook.office.com/calendar/item/1");
    expect(e.organizador).toBe("Ana");
    expect(e.ubicacion).toBe("Oficina");
    expect(e.invitados?.[0]).toMatchObject({ email: "b@x.com", opcional: true });
  });
});

describe("sincronizarReuniones", () => {
  beforeEach(() => vi.clearAllMocks());

  const evento: EventoCalendario = {
    idExterno: "g1",
    titulo: "Daily",
    inicio: new Date("2026-09-25T10:00:00Z"),
    fin: new Date("2026-09-25T10:30:00Z"),
    enlaceEvento: "https://www.google.com/calendar/event?eid=1",
    ubicacion: "Sala 2",
    invitados: [{ email: "a@x.com" }],
  };
  const proveedor = {
    listarEventos: vi.fn().mockResolvedValue([evento]),
  } as unknown as ProveedorCalendario;

  it("persiste los campos completos y borra las reuniones obsoletas del rango", async () => {
    prismaMock.cuentaCalendario.findUnique.mockResolvedValue({ id: "c1" });
    const n = await sincronizarReuniones(proveedor, "GOOGLE");
    expect(n).toBe(1);
    const upsert = prismaMock.reunion.upsert.mock.calls[0][0] as {
      create: Record<string, unknown>;
    };
    expect(upsert.create).toMatchObject({
      enlaceEvento: evento.enlaceEvento,
      ubicacion: "Sala 2",
      invitados: [{ email: "a@x.com" }],
    });
    const borrado = prismaMock.reunion.deleteMany.mock.calls[0][0] as {
      where: { idExterno: { notIn: string[] }; cuentaCalendarioId: string };
    };
    expect(borrado.where.idExterno.notIn).toEqual(["g1"]);
    expect(borrado.where.cuentaCalendarioId).toBe("c1");
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
  });

  it("propaga el error del proveedor sin tragarlo", async () => {
    const fallido = {
      listarEventos: vi.fn().mockRejectedValue(new Error("boom")),
    } as unknown as ProveedorCalendario;
    await expect(sincronizarReuniones(fallido, "GOOGLE")).rejects.toThrow();
  });
});
