import { describe, expect, it } from "vitest";
import { correspondeHoy, filtrarTareasDeHoy } from "./recurrencia";

// Crea fecha en hora local (no UTC) para que coincida con la zona horaria del test
function local(anio: number, mes: number, dia: number, hora = 12): Date {
  return new Date(anio, mes - 1, dia, hora, 0, 0);
}

describe("correspondeHoy", () => {
  const TZ = "America/Bogota";

  describe("DIARIA", () => {
    it("siempre corresponde sin importar la fecha", () => {
      const tarea = { tipoFrecuencia: "DIARIA", diaSemana: null, diaMes: null, fechaPuntual: null };
      expect(correspondeHoy(tarea, local(2026, 1, 1), TZ)).toBe(true);
      expect(correspondeHoy(tarea, local(2026, 6, 15), TZ)).toBe(true);
      expect(correspondeHoy(tarea, local(2027, 12, 31), TZ)).toBe(true);
    });
  });

  describe("SEMANAL", () => {
    it("corresponde cuando diaSemana coincide", () => {
      // 2026-01-04 es domingo
      const tarea = { tipoFrecuencia: "SEMANAL", diaSemana: 0, diaMes: null, fechaPuntual: null };
      expect(correspondeHoy(tarea, local(2026, 1, 4), TZ)).toBe(true);
      expect(correspondeHoy(tarea, local(2026, 1, 11), TZ)).toBe(true);
      expect(correspondeHoy(tarea, local(2026, 1, 18), TZ)).toBe(true);
    });

    it("no corresponde cuando diaSemana no coincide", () => {
      // 2026-01-05 es lunes
      const tarea = { tipoFrecuencia: "SEMANAL", diaSemana: 0, diaMes: null, fechaPuntual: null };
      expect(correspondeHoy(tarea, local(2026, 1, 5), TZ)).toBe(false);
      expect(correspondeHoy(tarea, local(2026, 1, 12), TZ)).toBe(false);
    });

    it("funciona para todos los dias de la semana", () => {
      // 2026-01-05 lun(1), 06 mar(2), 07 mié(3), 08 jue(4), 09 vie(5), 10 sáb(6)
      for (let dia = 1; dia <= 6; dia++) {
        const tarea = {
          tipoFrecuencia: "SEMANAL",
          diaSemana: dia,
          diaMes: null,
          fechaPuntual: null,
        };
        expect(correspondeHoy(tarea, local(2026, 1, 4 + dia), TZ)).toBe(true);
      }
    });

    it("devuelve false si diaSemana es null", () => {
      const tarea = {
        tipoFrecuencia: "SEMANAL",
        diaSemana: null,
        diaMes: null,
        fechaPuntual: null,
      };
      expect(correspondeHoy(tarea, local(2026, 1, 4), TZ)).toBe(false);
    });
  });

  describe("MENSUAL", () => {
    it("corresponde cuando diaMes coincide exactamente", () => {
      const tarea = { tipoFrecuencia: "MENSUAL", diaSemana: null, diaMes: 15, fechaPuntual: null };
      expect(correspondeHoy(tarea, local(2026, 1, 15), TZ)).toBe(true);
      expect(correspondeHoy(tarea, local(2026, 2, 15), TZ)).toBe(true);
      expect(correspondeHoy(tarea, local(2026, 3, 15), TZ)).toBe(true);
    });

    it("no corresponde cuando diaMes no coincide", () => {
      const tarea = { tipoFrecuencia: "MENSUAL", diaSemana: null, diaMes: 15, fechaPuntual: null };
      expect(correspondeHoy(tarea, local(2026, 1, 14), TZ)).toBe(false);
      expect(correspondeHoy(tarea, local(2026, 1, 16), TZ)).toBe(false);
    });

    describe("meses cortos (dia 29/30/31)", () => {
      it("febrero 2026 tiene 28 dias: diaMes 29/30/31 corresponde al 28", () => {
        const tarea29 = {
          tipoFrecuencia: "MENSUAL",
          diaSemana: null,
          diaMes: 29,
          fechaPuntual: null,
        };
        const tarea30 = {
          tipoFrecuencia: "MENSUAL",
          diaSemana: null,
          diaMes: 30,
          fechaPuntual: null,
        };
        const tarea31 = {
          tipoFrecuencia: "MENSUAL",
          diaSemana: null,
          diaMes: 31,
          fechaPuntual: null,
        };
        expect(correspondeHoy(tarea29, local(2026, 2, 28), TZ)).toBe(true);
        expect(correspondeHoy(tarea30, local(2026, 2, 28), TZ)).toBe(true);
        expect(correspondeHoy(tarea31, local(2026, 2, 28), TZ)).toBe(true);
        expect(correspondeHoy(tarea29, local(2026, 2, 27), TZ)).toBe(false);
      });

      it("abril 2026 tiene 30 dias: diaMes 31 corresponde al 30 (ultimo dia)", () => {
        const tarea31 = {
          tipoFrecuencia: "MENSUAL",
          diaSemana: null,
          diaMes: 31,
          fechaPuntual: null,
        };
        expect(correspondeHoy(tarea31, local(2026, 4, 30), TZ)).toBe(true);
        expect(correspondeHoy(tarea31, local(2026, 4, 29), TZ)).toBe(false);
      });

      it("diaMes 30 en febrero 2026 corresponde al 28", () => {
        const tarea30 = {
          tipoFrecuencia: "MENSUAL",
          diaSemana: null,
          diaMes: 30,
          fechaPuntual: null,
        };
        expect(correspondeHoy(tarea30, local(2026, 2, 28), TZ)).toBe(true);
      });
    });

    it("devuelve false si diaMes es null", () => {
      const tarea = {
        tipoFrecuencia: "MENSUAL",
        diaSemana: null,
        diaMes: null,
        fechaPuntual: null,
      };
      expect(correspondeHoy(tarea, local(2026, 1, 15), TZ)).toBe(false);
    });
  });

  describe("PUNTUAL", () => {
    it("corresponde solo en la fecha exacta", () => {
      const tarea = {
        tipoFrecuencia: "PUNTUAL",
        diaSemana: null,
        diaMes: null,
        fechaPuntual: local(2026, 9, 15, 10),
      };
      expect(correspondeHoy(tarea, local(2026, 9, 15, 0), TZ)).toBe(true);
      expect(correspondeHoy(tarea, local(2026, 9, 15, 23), TZ)).toBe(true);
    });

    it("no corresponde en dias diferentes", () => {
      const tarea = {
        tipoFrecuencia: "PUNTUAL",
        diaSemana: null,
        diaMes: null,
        fechaPuntual: local(2026, 9, 15, 10),
      };
      expect(correspondeHoy(tarea, local(2026, 9, 14), TZ)).toBe(false);
      expect(correspondeHoy(tarea, local(2026, 9, 16), TZ)).toBe(false);
    });

    it("funciona con zona horaria America/New_York", () => {
      // 13:00 UTC = 08:00 EST (mismo día); 03:00 UTC = 22:00 día anterior
      const tarea = {
        tipoFrecuencia: "PUNTUAL",
        diaSemana: null,
        diaMes: null,
        fechaPuntual: new Date(Date.UTC(2026, 0, 1, 13)),
      };
      expect(correspondeHoy(tarea, new Date(Date.UTC(2026, 0, 1, 13)), "America/New_York")).toBe(
        true,
      );
      expect(correspondeHoy(tarea, new Date(Date.UTC(2026, 0, 1, 3)), "America/New_York")).toBe(
        false,
      );
    });

    it("devuelve false si fechaPuntual es null", () => {
      const tarea = {
        tipoFrecuencia: "PUNTUAL",
        diaSemana: null,
        diaMes: null,
        fechaPuntual: null,
      };
      expect(correspondeHoy(tarea, local(2026, 9, 15), TZ)).toBe(false);
    });
  });

  describe("zonas horarias", () => {
    it("funciona con UTC", () => {
      const tarea = { tipoFrecuencia: "DIARIA", diaSemana: null, diaMes: null, fechaPuntual: null };
      expect(correspondeHoy(tarea, local(2026, 6, 15), "UTC")).toBe(true);
    });

    it("funciona con Europe/Madrid", () => {
      const tarea = { tipoFrecuencia: "DIARIA", diaSemana: null, diaMes: null, fechaPuntual: null };
      expect(correspondeHoy(tarea, local(2026, 6, 15), "Europe/Madrid")).toBe(true);
    });

    it("puntual con cambio de dia en zona horaria", () => {
      // 2026-01-01 10:00 UTC = 2026-01-01 02:00 en Los Angeles (UTC-8)
      // 2026-01-01 10:00 UTC = 2025-12-31 21:00 en Los Angeles (UTC-8)
      const tarea = {
        tipoFrecuencia: "PUNTUAL",
        diaSemana: null,
        diaMes: null,
        fechaPuntual: new Date(Date.UTC(2026, 0, 1, 10)),
      };
      // Mismo día en LA (02:00)
      expect(correspondeHoy(tarea, new Date(Date.UTC(2026, 0, 1, 10)), "America/Los_Angeles")).toBe(
        true,
      );
      // Día diferente en LA (21:00 del día anterior)
      expect(
        correspondeHoy(tarea, new Date(Date.UTC(2025, 11, 31, 21)), "America/Los_Angeles"),
      ).toBe(false);
    });
  });
});

describe("filtrarTareasDeHoy", () => {
  const TZ = "America/Bogota";

  it("devuelve solo las tareas que corresponden hoy", () => {
    const tareas = [
      { tipoFrecuencia: "DIARIA", diaSemana: null, diaMes: null, fechaPuntual: null },
      { tipoFrecuencia: "SEMANAL", diaSemana: 0, diaMes: null, fechaPuntual: null },
      { tipoFrecuencia: "MENSUAL", diaSemana: null, diaMes: 4, fechaPuntual: null },
    ];
    // 2026-01-04 es domingo, día 4 del mes
    const hoy = local(2026, 1, 4);
    const resultado = filtrarTareasDeHoy(tareas, hoy, TZ);
    expect(resultado).toHaveLength(3);
  });

  it("devuelve array vacio si ninguna corresponde", () => {
    const tareas = [
      { tipoFrecuencia: "SEMANAL", diaSemana: 1, diaMes: null, fechaPuntual: null },
      { tipoFrecuencia: "MENSUAL", diaSemana: null, diaMes: 20, fechaPuntual: null },
    ];
    const hoy = local(2026, 1, 4);
    const resultado = filtrarTareasDeHoy(tareas, hoy, TZ);
    expect(resultado).toHaveLength(0);
  });
});
