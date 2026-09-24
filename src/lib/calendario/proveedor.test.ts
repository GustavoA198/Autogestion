import { describe, expect, it, beforeEach } from "vitest";
import type { DatosEvento, ProveedorCalendario } from "./proveedor";
import { ErrorCalendario } from "./proveedor";

// Proveedor simulado para pruebas que no depende de googleapis
class MockProveedorCalendario implements ProveedorCalendario {
  private _configurado = true;
  private _accessoRevocado = false;
  private _sinConexion = false;
  private _eventos: EventoCalendario[] = [];

  configurado(valor: boolean) {
    this._configurado = valor;
    return this;
  }

  accessoRevocado() {
    this._accessoRevocado = true;
    return this;
  }

  sinConexion() {
    this._sinConexion = true;
    return this;
  }

  eventosSimulados(eventos: EventoCalendario[]) {
    this._eventos = eventos;
    return this;
  }

  estaConfigurado() {
    return this._configurado;
  }

  async listarEventos(fechaInicio: Date, fechaFin: Date): Promise<EventoCalendario[]> {
    void fechaInicio;
    void fechaFin;
    if (!this._configurado) {
      throw new ErrorCalendario("No configurado", "no-configurado");
    }
    if (this._sinConexion) {
      throw new ErrorCalendario("Sin conexión", "sin-conexion");
    }
    if (this._accessoRevocado) {
      throw new ErrorCalendario("Acceso revocado", "accesso-revocado");
    }
    return [...this._eventos];
  }

  async crearEvento(datos: DatosEvento): Promise<EventoCalendario> {
    if (!this._configurado) {
      throw new ErrorCalendario("No configurado", "no-configurado");
    }
    if (this._sinConexion) {
      throw new ErrorCalendario("Sin conexión", "sin-conexion");
    }
    return {
      idExterno: "mock-id-" + Date.now(),
      titulo: datos.titulo,
      descripcion: datos.descripcion,
      inicio: datos.inicio,
      fin: datos.fin,
      enlaceReunion: datos.enlaceReunion,
    };
  }

  async refreshTokens(): Promise<void> {
    if (!this._configurado) {
      throw new ErrorCalendario("No configurado", "no-configurado");
    }
    if (this._accessoRevocado) {
      throw new ErrorCalendario("Acceso revocado", "accesso-revocado");
    }
  }
}

type EventoCalendario = {
  idExterno: string;
  titulo: string;
  descripcion?: string;
  inicio: Date;
  fin: Date;
  enlaceReunion?: string;
};

describe("MockProveedorCalendario", () => {
  let proveedor: MockProveedorCalendario;

  beforeEach(() => {
    proveedor = new MockProveedorCalendario();
  });

  describe("listarEventos", () => {
    it("devuelve eventos simulados", async () => {
      const eventos: EventoCalendario[] = [
        {
          idExterno: "e1",
          titulo: "Reunión 1",
          inicio: new Date("2026-09-25T10:00:00"),
          fin: new Date("2026-09-25T11:00:00"),
        },
        {
          idExterno: "e2",
          titulo: "Reunión 2",
          inicio: new Date("2026-09-26T14:00:00"),
          fin: new Date("2026-09-26T15:00:00"),
        },
      ];
      proveedor.eventosSimulados(eventos);
      const resultado = await proveedor.listarEventos(new Date(), new Date());
      expect(resultado).toHaveLength(2);
      expect(resultado[0].titulo).toBe("Reunión 1");
      expect(resultado[1].titulo).toBe("Reunión 2");
    });

    it("lanza ErrorCalendario no-configurado si no está configurado", async () => {
      proveedor.configurado(false);
      await expect(proveedor.listarEventos(new Date(), new Date())).rejects.toThrow(
        "No configurado",
      );
      await expect(proveedor.listarEventos(new Date(), new Date())).rejects.toMatchObject({
        codigo: "no-configurado",
      });
    });

    it("lanza ErrorCalendario sin-conexion cuando no hay red", async () => {
      proveedor.sinConexion();
      await expect(proveedor.listarEventos(new Date(), new Date())).rejects.toMatchObject({
        codigo: "sin-conexion",
      });
    });

    it("lanza ErrorCalendario acceso-revocado cuando el token fue revocado", async () => {
      proveedor.accessoRevocado();
      await expect(proveedor.listarEventos(new Date(), new Date())).rejects.toMatchObject({
        codigo: "accesso-revocado",
      });
    });
  });

  describe("crearEvento", () => {
    it("crea un evento con datos y devuelve con idExterno", async () => {
      proveedor.configurado(true);
      const datos: DatosEvento = {
        titulo: "Nueva reunión",
        descripcion: "Descripción",
        inicio: new Date("2026-09-25T10:00:00"),
        fin: new Date("2026-09-25T11:00:00"),
      };
      const resultado = await proveedor.crearEvento(datos);
      expect(resultado.titulo).toBe("Nueva reunión");
      expect(resultado.idExterno).toMatch(/^mock-id-/);
    });

    it("lanza error controlado si no está configurado", async () => {
      proveedor.configurado(false);
      await expect(
        proveedor.crearEvento({ titulo: "Test", inicio: new Date(), fin: new Date() }),
      ).rejects.toMatchObject({ codigo: "no-configurado" });
    });
  });

  describe("refreshTokens", () => {
    it("resuelve sin error cuando está configurado y token válido", async () => {
      proveedor.configurado(true);
      await expect(proveedor.refreshTokens()).resolves.toBeUndefined();
    });

    it("lanza accesso-revocado cuando el refresh falla", async () => {
      proveedor.accessoRevocado();
      await expect(proveedor.refreshTokens()).rejects.toMatchObject({ codigo: "accesso-revocado" });
    });

    it("lanza no-configurado cuando no está configurado", async () => {
      proveedor.configurado(false);
      await expect(proveedor.refreshTokens()).rejects.toMatchObject({ codigo: "no-configurado" });
    });
  });

  describe("estaConfigurado", () => {
    it("devuelve true cuando está configurado", () => {
      proveedor.configurado(true);
      expect(proveedor.estaConfigurado()).toBe(true);
    });

    it("devuelve false cuando no está configurado", () => {
      proveedor.configurado(false);
      expect(proveedor.estaConfigurado()).toBe(false);
    });
  });
});
