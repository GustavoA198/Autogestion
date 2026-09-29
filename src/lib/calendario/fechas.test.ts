import { describe, expect, it } from "vitest";
import {
  claveDia,
  compararDias,
  crearDia,
  diaCivilDe,
  diaCivilUTC,
  diaDeSemana,
  diaDesdeClave,
  diasEnMes,
  diferenciaDias,
  esBisiesto,
  formatoDatetimeLocal,
  inicioDeSemana,
  inicioDelDia,
  minutosDelDia,
  mismoDia,
  partesEnZona,
  primerDiaDelMes,
  sumarDias,
  sumarMeses,
  zonaValida,
} from "./fechas";

const BOGOTA = "America/Bogota";
const HORAS = 3_600_000;

describe("calendario civil", () => {
  it("reconoce años bisiestos incluyendo las reglas de siglo", () => {
    expect(esBisiesto(2024)).toBe(true);
    expect(esBisiesto(2026)).toBe(false);
    expect(esBisiesto(1900)).toBe(false);
    expect(esBisiesto(2000)).toBe(true);
  });

  it.each([
    [2026, 1, 31],
    [2026, 2, 28],
    [2028, 2, 29],
    [2026, 4, 30],
    [2026, 9, 30],
    [2026, 12, 31],
  ])("el mes %i-%i tiene %i días", (anio, mes, esperado) => {
    expect(diasEnMes(anio, mes)).toBe(esperado);
  });

  it("normaliza desbordes de día y de mes", () => {
    expect(crearDia(2026, 9, 31)).toEqual({ anio: 2026, mes: 10, dia: 1 });
    expect(crearDia(2026, 13, 1)).toEqual({ anio: 2027, mes: 1, dia: 1 });
    expect(crearDia(2028, 2, 30)).toEqual({ anio: 2028, mes: 3, dia: 1 });
  });

  it("suma días cruzando meses, años y el 29 de febrero", () => {
    expect(sumarDias({ anio: 2026, mes: 9, dia: 24 }, 7)).toEqual({ anio: 2026, mes: 10, dia: 1 });
    expect(sumarDias({ anio: 2026, mes: 12, dia: 31 }, 1)).toEqual({ anio: 2027, mes: 1, dia: 1 });
    expect(sumarDias({ anio: 2028, mes: 2, dia: 28 }, 1)).toEqual({ anio: 2028, mes: 2, dia: 29 });
    expect(sumarDias({ anio: 2027, mes: 2, dia: 28 }, 1)).toEqual({ anio: 2027, mes: 3, dia: 1 });
    expect(sumarDias({ anio: 2026, mes: 1, dia: 1 }, -1)).toEqual({ anio: 2025, mes: 12, dia: 31 });
  });

  it("suma meses recortando al último día del mes destino", () => {
    expect(sumarMeses({ anio: 2026, mes: 1, dia: 31 }, 1)).toEqual({ anio: 2026, mes: 2, dia: 28 });
    expect(sumarMeses({ anio: 2028, mes: 1, dia: 31 }, 1)).toEqual({ anio: 2028, mes: 2, dia: 29 });
    expect(sumarMeses({ anio: 2026, mes: 10, dia: 31 }, 1)).toEqual({
      anio: 2026,
      mes: 11,
      dia: 30,
    });
    expect(sumarMeses({ anio: 2026, mes: 1, dia: 15 }, -1)).toEqual({
      anio: 2025,
      mes: 12,
      dia: 15,
    });
    expect(sumarMeses({ anio: 2026, mes: 12, dia: 15 }, 1)).toEqual({
      anio: 2027,
      mes: 1,
      dia: 15,
    });
    expect(sumarMeses({ anio: 2026, mes: 3, dia: 31 }, -1)).toEqual({
      anio: 2026,
      mes: 2,
      dia: 28,
    });
  });

  it("calcula diferencias y comparaciones entre días", () => {
    const a = { anio: 2026, mes: 9, dia: 24 };
    const b = { anio: 2026, mes: 10, dia: 23 };
    expect(diferenciaDias(a, b)).toBe(29);
    expect(diferenciaDias(b, a)).toBe(-29);
    expect(compararDias(a, b)).toBe(-1);
    expect(compararDias(b, a)).toBe(1);
    expect(compararDias(a, { ...a })).toBe(0);
    expect(mismoDia(a, { ...a })).toBe(true);
    expect(mismoDia(a, b)).toBe(false);
  });

  it("la semana empieza en lunes: 24 sep 2026 es jueves", () => {
    const jueves = { anio: 2026, mes: 9, dia: 24 };
    expect(diaDeSemana(jueves)).toBe(3);
    expect(inicioDeSemana(jueves)).toEqual({ anio: 2026, mes: 9, dia: 21 });
    // El domingo pertenece a la semana que termina, no a la siguiente
    expect(diaDeSemana({ anio: 2026, mes: 9, dia: 27 })).toBe(6);
    expect(inicioDeSemana({ anio: 2026, mes: 9, dia: 27 })).toEqual({
      anio: 2026,
      mes: 9,
      dia: 21,
    });
    expect(inicioDeSemana({ anio: 2026, mes: 9, dia: 28 })).toEqual({
      anio: 2026,
      mes: 9,
      dia: 28,
    });
  });

  it("inicio de semana cruza el cambio de año", () => {
    expect(inicioDeSemana({ anio: 2027, mes: 1, dia: 1 })).toEqual({
      anio: 2026,
      mes: 12,
      dia: 28,
    });
  });

  it("primer día del mes", () => {
    expect(primerDiaDelMes({ anio: 2026, mes: 9, dia: 24 })).toEqual({
      anio: 2026,
      mes: 9,
      dia: 1,
    });
  });

  it("convierte a clave y de vuelta, rechazando fechas inexistentes", () => {
    const dia = { anio: 2026, mes: 9, dia: 4 };
    expect(claveDia(dia)).toBe("2026-09-04");
    expect(diaDesdeClave("2026-09-04")).toEqual(dia);
    expect(diaDesdeClave("2026-02-30")).toBeNull();
    expect(diaDesdeClave("2026-9-4")).toBeNull();
    expect(diaDesdeClave("basura")).toBeNull();
  });

  it("las claves de día se ordenan como las fechas", () => {
    const claves = [
      claveDia({ anio: 2026, mes: 10, dia: 2 }),
      claveDia({ anio: 2026, mes: 9, dia: 30 }),
      claveDia({ anio: 2025, mes: 12, dia: 31 }),
    ];
    expect([...claves].sort()).toEqual(["2025-12-31", "2026-09-30", "2026-10-02"]);
  });
});

describe("zonas horarias", () => {
  it("valida nombres de zona IANA", () => {
    expect(zonaValida("America/Bogota")).toBe(true);
    expect(zonaValida("Zona/Inexistente")).toBe(false);
  });

  it("America/Bogota es UTC-5 sin horario de verano", () => {
    expect(partesEnZona(new Date("2026-09-24T05:00:00Z"), BOGOTA)).toMatchObject({
      anio: 2026,
      mes: 9,
      dia: 24,
      hora: 0,
      minuto: 0,
    });
    expect(diaCivilDe(new Date("2026-09-24T04:59:59Z"), BOGOTA)).toEqual({
      anio: 2026,
      mes: 9,
      dia: 23,
    });
    expect(minutosDelDia(new Date("2026-09-24T21:30:00Z"), BOGOTA)).toBe(16 * 60 + 30);
  });

  it("la medianoche no aparece como hora 24", () => {
    expect(partesEnZona(new Date("2026-09-24T05:00:00Z"), BOGOTA).hora).toBe(0);
    expect(partesEnZona(new Date("2026-07-01T00:00:00Z"), "Europe/Madrid").hora).toBe(2);
  });

  it("el mismo instante cae en días distintos según la zona", () => {
    const instante = new Date("2026-09-24T03:00:00Z");
    expect(diaCivilDe(instante, BOGOTA)).toEqual({ anio: 2026, mes: 9, dia: 23 });
    expect(diaCivilDe(instante, "UTC")).toEqual({ anio: 2026, mes: 9, dia: 24 });
    expect(diaCivilDe(instante, "Pacific/Auckland")).toEqual({ anio: 2026, mes: 9, dia: 24 });
    expect(diaCivilDe(instante, "Pacific/Kiritimati")).toEqual({ anio: 2026, mes: 9, dia: 24 });
    expect(diaCivilDe(instante, "Pacific/Pago_Pago")).toEqual({ anio: 2026, mes: 9, dia: 23 });
  });

  it("zonas con desfase de media hora", () => {
    expect(partesEnZona(new Date("2026-09-24T10:00:00Z"), "Asia/Kolkata")).toMatchObject({
      hora: 15,
      minuto: 30,
    });
    expect(inicioDelDia({ anio: 2026, mes: 9, dia: 24 }, "Asia/Kolkata").toISOString()).toBe(
      "2026-09-23T18:30:00.000Z",
    );
  });

  it("inicio del día en Bogotá es las 05:00 UTC", () => {
    expect(inicioDelDia({ anio: 2026, mes: 9, dia: 24 }, BOGOTA).toISOString()).toBe(
      "2026-09-24T05:00:00.000Z",
    );
  });

  it("el inicio del día es el mismo instante que el día siguiente menos 24 horas sin horario de verano", () => {
    const hoy = inicioDelDia({ anio: 2026, mes: 9, dia: 24 }, BOGOTA).getTime();
    const manana = inicioDelDia({ anio: 2026, mes: 9, dia: 25 }, BOGOTA).getTime();
    expect(manana - hoy).toBe(24 * HORAS);
  });

  it("horario de verano de Nueva York: el día del cambio dura 23 y 25 horas", () => {
    const zona = "America/New_York";
    const largo = (dia: number, mes: number) =>
      (inicioDelDia({ anio: 2026, mes, dia: dia + 1 }, zona).getTime() -
        inicioDelDia({ anio: 2026, mes, dia }, zona).getTime()) /
      HORAS;
    expect(largo(8, 3)).toBe(23);
    expect(largo(1, 11)).toBe(25);
    expect(largo(9, 3)).toBe(24);
  });

  it("horario de verano de Madrid: el último domingo de octubre dura 25 horas", () => {
    const zona = "Europe/Madrid";
    const inicio = inicioDelDia({ anio: 2026, mes: 10, dia: 25 }, zona);
    const fin = inicioDelDia({ anio: 2026, mes: 10, dia: 26 }, zona);
    expect(inicio.toISOString()).toBe("2026-10-24T22:00:00.000Z");
    expect((fin.getTime() - inicio.getTime()) / HORAS).toBe(25);
  });

  it("cambio de hora a medianoche en Santiago: el día empieza a la 01:00", () => {
    const zona = "America/Santiago";
    const inicio = inicioDelDia({ anio: 2026, mes: 9, dia: 6 }, zona);
    expect(inicio.toISOString()).toBe("2026-09-06T04:00:00.000Z");
    expect(diaCivilDe(inicio, zona)).toEqual({ anio: 2026, mes: 9, dia: 6 });
    expect(diaCivilDe(new Date(inicio.getTime() - 60_000), zona)).toEqual({
      anio: 2026,
      mes: 9,
      dia: 5,
    });
  });

  it("cambio de hora a medianoche en La Habana: toma la primera medianoche repetida", () => {
    const zona = "America/Havana";
    const inicio = inicioDelDia({ anio: 2026, mes: 11, dia: 1 }, zona);
    expect(inicio.toISOString()).toBe("2026-11-01T04:00:00.000Z");
    const siguiente = inicioDelDia({ anio: 2026, mes: 11, dia: 2 }, zona);
    expect((siguiente.getTime() - inicio.getTime()) / HORAS).toBe(25);
  });

  it("desfase de 14 horas en Kiritimati", () => {
    expect(inicioDelDia({ anio: 2026, mes: 9, dia: 24 }, "Pacific/Kiritimati").toISOString()).toBe(
      "2026-09-23T10:00:00.000Z",
    );
  });

  it("el inicio del día siempre cae en el día pedido", () => {
    const zonas = ["America/Bogota", "Europe/Madrid", "America/New_York", "Australia/Sydney"];
    for (const zona of zonas) {
      for (let dia = 0; dia < 400; dia += 7) {
        const civil = sumarDias({ anio: 2026, mes: 1, dia: 1 }, dia);
        const inicio = inicioDelDia(civil, zona);
        expect(diaCivilDe(inicio, zona)).toEqual(civil);
        expect(diaCivilDe(inicio.getTime() - 1, zona)).toEqual(sumarDias(civil, -1));
      }
    }
  });

  it("un evento de día completo guardado en UTC conserva su fecha en cualquier zona", () => {
    const guardado = new Date("2026-09-25T00:00:00Z");
    expect(diaCivilUTC(guardado)).toEqual({ anio: 2026, mes: 9, dia: 25 });
    // Interpretarlo en la zona local lo correría un día: por eso los eventos de día completo usan UTC
    expect(diaCivilDe(guardado, BOGOTA)).toEqual({ anio: 2026, mes: 9, dia: 24 });
  });

  it("formatea el valor para un campo datetime-local en la zona indicada", () => {
    expect(formatoDatetimeLocal(new Date("2026-09-24T15:05:00Z"), BOGOTA)).toBe("2026-09-24T10:05");
    expect(formatoDatetimeLocal(new Date("2026-09-24T03:00:00Z"), BOGOTA)).toBe("2026-09-23T22:00");
  });
});
