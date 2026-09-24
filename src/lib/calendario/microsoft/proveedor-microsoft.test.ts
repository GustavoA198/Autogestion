import { describe, expect, it, beforeEach, vi } from "vitest";
import type { DatosEvento } from "../proveedor";

const MICROSOFT_CLIENT_ID = "test-client-id";
const MICROSOFT_CLIENT_SECRET = "test-client-secret";
const MICROSOFT_TENANT_ID = "common";
const MICROSOFT_REDIRECT_URI = "http://localhost:3100/api/calendario/microsoft/callback";
const MICROSOFT_CODE = "microsoft-test-code";
const MICROSOFT_ACCESS = "microsoft-access-token";
const MICROSOFT_REFRESH = "microsoft-refresh-token";

const cuentaMicrosoftMock = {
  id: "cuenta-ms-1",
  proveedor: "MICROSOFT" as const,
  usuarioId: "unico",
  accessTokenCifrado: "access-cifrado",
  refreshTokenCifrado: "refresh-cifrado",
  expiresAt: new Date(Date.now() + 3600 * 1000),
  scope: "Calendars.ReadWrite offline_access",
  syncToken: null,
  creadoEn: new Date(),
  actualizadoEn: new Date(),
};

const prismaMock = {
  cuentaCalendario: {
    findUnique: vi.fn(),
    upsert: vi.fn(),
    update: vi.fn(),
  },
};

// Estado mutable para controlar el env desde cada test
const mockEnv = {
  GOOGLE_CLIENT_ID: "",
  GOOGLE_CLIENT_SECRET: "",
  MICROSOFT_CLIENT_ID,
  MICROSOFT_CLIENT_SECRET,
  MICROSOFT_TENANT_ID,
  MICROSOFT_REDIRECT_URI,
};

vi.mock("@/lib/prisma", () => ({ obtenerPrisma: () => prismaMock }));
vi.mock("@/lib/cifrado/cifrado", () => ({
  cifrar: (t: string) => `cifrado:${t}`,
  descifrar: (t: string) => t.replace("cifrado:", ""),
}));
vi.mock("@/lib/env", () => ({
  leerEntornoCalendario: () => mockEnv,
}));

describe("MicrosoftProveedor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Restaurar env a estado configurado por defecto
    mockEnv.MICROSOFT_CLIENT_ID = MICROSOFT_CLIENT_ID;
    mockEnv.MICROSOFT_CLIENT_SECRET = MICROSOFT_CLIENT_SECRET;
  });

  describe("estaConfigurado", () => {
    it("devuelve true cuando CLIENT_ID y CLIENT_SECRET están configurados", async () => {
      const { MicrosoftProveedor } = await import("./proveedor-microsoft");
      const prov = new MicrosoftProveedor();
      expect(prov.estaConfigurado()).toBe(true);
    });

    it("devuelve false cuando CLIENT_ID está vacío", async () => {
      mockEnv.MICROSOFT_CLIENT_ID = "";
      const { MicrosoftProveedor } = await import("./proveedor-microsoft");
      const prov = new MicrosoftProveedor();
      expect(prov.estaConfigurado()).toBe(false);
    });

    it("devuelve false cuando CLIENT_SECRET está vacío", async () => {
      mockEnv.MICROSOFT_CLIENT_SECRET = "";
      const { MicrosoftProveedor } = await import("./proveedor-microsoft");
      const prov = new MicrosoftProveedor();
      expect(prov.estaConfigurado()).toBe(false);
    });
  });

  describe("generarUrlAutenticacion", () => {
    it("genera URL con parámetros correctos", async () => {
      const { MicrosoftProveedor } = await import("./proveedor-microsoft");
      const prov = new MicrosoftProveedor();
      const url = prov.generarUrlAutenticacion();
      expect(url).toContain("login.microsoftonline.com");
      // Verifica que la URL contiene los parámetros clave
      expect(url).toContain("login.microsoftonline.com");
      expect(url).toContain(`client_id=${MICROSOFT_CLIENT_ID}`);
      expect(url).toContain(`redirect_uri=${encodeURIComponent(MICROSOFT_REDIRECT_URI)}`);
      expect(url).toContain("response_type=code");
      // El scope puede estar codificado, verificamos que exista el parámetro scope
      expect(url).toMatch(/scope=[^&]+/);
      expect(url).toContain(`client_id=${MICROSOFT_CLIENT_ID}`);
      expect(url).toContain(`redirect_uri=${encodeURIComponent(MICROSOFT_REDIRECT_URI)}`);
    });
  });

  describe("guardarTokensDesdeCode", () => {
    it("guarda tokens en la BD tras intercambio exitoso", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            access_token: MICROSOFT_ACCESS,
            refresh_token: MICROSOFT_REFRESH,
            expires_in: 3600,
          }),
      });
      globalThis.fetch = mockFetch;
      prismaMock.cuentaCalendario.upsert.mockResolvedValue(cuentaMicrosoftMock);

      const { MicrosoftProveedor } = await import("./proveedor-microsoft");
      const prov = new MicrosoftProveedor();
      await prov.guardarTokensDesdeCode(MICROSOFT_CODE);

      expect(prismaMock.cuentaCalendario.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { proveedor_usuarioId: { proveedor: "MICROSOFT", usuarioId: "unico" } },
          create: expect.objectContaining({
            proveedor: "MICROSOFT",
            refreshTokenCifrado: expect.stringContaining("cifrado:"),
          }),
        }),
      );
    });

    it("lanza error si Microsoft no devuelve refresh_token", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            access_token: MICROSOFT_ACCESS,
            expires_in: 3600,
          }),
      });
      globalThis.fetch = mockFetch;

      const { MicrosoftProveedor } = await import("./proveedor-microsoft");
      const prov = new MicrosoftProveedor();
      await expect(prov.guardarTokensDesdeCode(MICROSOFT_CODE)).rejects.toMatchObject({
        codigo: "desconocido",
      });
    });
  });

  describe("listarEventos", () => {
    it("lanza no-configurado si no está configurado", async () => {
      mockEnv.MICROSOFT_CLIENT_ID = "";
      mockEnv.MICROSOFT_CLIENT_SECRET = "";
      const { MicrosoftProveedor } = await import("./proveedor-microsoft");
      const prov = new MicrosoftProveedor();
      await expect(prov.listarEventos(new Date(), new Date())).rejects.toMatchObject({
        codigo: "no-configurado",
      });
    });

    it("lanza no-configurado si no hay cuenta conectada", async () => {
      prismaMock.cuentaCalendario.findUnique.mockResolvedValue(null);
      const { MicrosoftProveedor } = await import("./proveedor-microsoft");
      const prov = new MicrosoftProveedor();
      await expect(prov.listarEventos(new Date(), new Date())).rejects.toMatchObject({
        codigo: "no-configurado",
      });
    });
  });

  describe("crearEvento", () => {
    it("lanza no-configurado si no está configurado", async () => {
      mockEnv.MICROSOFT_CLIENT_ID = "";
      mockEnv.MICROSOFT_CLIENT_SECRET = "";
      const { MicrosoftProveedor } = await import("./proveedor-microsoft");
      const prov = new MicrosoftProveedor();
      const datos: DatosEvento = {
        titulo: "Reunión test",
        inicio: new Date(),
        fin: new Date(),
      };
      await expect(prov.crearEvento(datos)).rejects.toMatchObject({
        codigo: "no-configurado",
      });
    });
  });

  describe("refreshTokens", () => {
    it("lanza no-configurado si no hay cuenta", async () => {
      prismaMock.cuentaCalendario.findUnique.mockResolvedValue(null);
      const { MicrosoftProveedor } = await import("./proveedor-microsoft");
      const prov = new MicrosoftProveedor();
      await expect(prov.refreshTokens()).rejects.toMatchObject({
        codigo: "no-configurado",
      });
    });
  });
});
