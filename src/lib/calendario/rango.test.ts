import { describe, expect, it } from "vitest";
import { claveDia } from "./fechas";
import {
  DIAS_AGENDA,
  MAX_DIAS_CONSULTA,
  diasDelRango,
  esVista,
  navegar,
  rangoConsulta,
  rangoDeVista,
  validarRangoConsulta,
  type Vista,
} from "./rango";

const HOY = { anio: 2026, mes: 9, dia: 24 };

describe("esVista", () => {
  it("acepta solo las cuatro vistas", () => {
    for (const vista of ["agenda", "dia", "semana", "mes"]) expect(esVista(vista)).toBe(true);
    for (const valor of ["Agenda", "", null, undefined, 3, "year"])
      expect(esVista(valor)).toBe(false);
  });
});

describe("rangoDeVista", () => {
  it("día: un solo día", () => {
    expect(rangoDeVista("dia", HOY)).toEqual({
      desde: HOY,
      hasta: { anio: 2026, mes: 9, dia: 25 },
    });
  });

  it("semana: de lunes a domingo, con el 24 de septiembre en la semana 21-27", () => {
    const rango = rangoDeVista("semana", HOY);
    expect(rango.desde).toEqual({ anio: 2026, mes: 9, dia: 21 });
    expect(rango.hasta).toEqual({ anio: 2026, mes: 9, dia: 28 });
    expect(diasDelRango(rango)).toHaveLength(7);
  });

  it("semana: un domingo se queda en la semana que termina ese día", () => {
    const rango = rangoDeVista("semana", { anio: 2026, mes: 9, dia: 27 });
    expect(rango.desde).toEqual({ anio: 2026, mes: 9, dia: 21 });
  });

  it("semana que cruza el cambio de año", () => {
    const rango = rangoDeVista("semana", { anio: 2027, mes: 1, dia: 1 });
    expect(rango.desde).toEqual({ anio: 2026, mes: 12, dia: 28 });
    expect(rango.hasta).toEqual({ anio: 2027, mes: 1, dia: 4 });
  });

  it("mes: siempre 42 días empezando en el lunes de la primera semana", () => {
    const rango = rangoDeVista("mes", HOY);
    expect(rango.desde).toEqual({ anio: 2026, mes: 8, dia: 31 });
    expect(diasDelRango(rango)).toHaveLength(42);
    expect(claveDia(diasDelRango(rango)[41])).toBe("2026-10-11");
  });

  it.each([
    // febrero de 2026 tiene 28 días y empieza en domingo
    [{ anio: 2026, mes: 2, dia: 10 }, "2026-01-26"],
    // febrero de 2028 es bisiesto y empieza un martes
    [{ anio: 2028, mes: 2, dia: 29 }, "2028-01-31"],
    // febrero de 2027 empieza en lunes: la cuadrícula empieza el mismo día
    [{ anio: 2027, mes: 2, dia: 1 }, "2027-02-01"],
    // meses de 31 días que empiezan en domingo
    [{ anio: 2026, mes: 3, dia: 31 }, "2026-02-23"],
    [{ anio: 2026, mes: 11, dia: 30 }, "2026-10-26"],
  ])("mes de %o: la cuadrícula empieza el %s", (ancla, inicioEsperado) => {
    const rango = rangoDeVista("mes", ancla);
    expect(claveDia(rango.desde)).toBe(inicioEsperado);
    expect(diasDelRango(rango)).toHaveLength(42);
  });

  it("mes: incluye el mes completo aunque tenga 31 días y empiece en sábado", () => {
    const dias = diasDelRango(rangoDeVista("mes", { anio: 2026, mes: 8, dia: 15 })).map(claveDia);
    expect(dias).toContain("2026-08-01");
    expect(dias).toContain("2026-08-31");
  });

  it("agenda: 30 días desde el ancla", () => {
    const rango = rangoDeVista("agenda", HOY);
    expect(rango.desde).toEqual(HOY);
    expect(rango.hasta).toEqual({ anio: 2026, mes: 10, dia: 24 });
    expect(diasDelRango(rango)).toHaveLength(DIAS_AGENDA);
  });

  it("agenda: las extensiones amplían hacia atrás y hacia adelante", () => {
    const rango = rangoDeVista("agenda", HOY, { atras: 14, adelante: 30 });
    expect(rango.desde).toEqual({ anio: 2026, mes: 9, dia: 10 });
    expect(rango.hasta).toEqual({ anio: 2026, mes: 11, dia: 23 });
  });
});

describe("navegar", () => {
  it.each<[Vista, -1 | 1, string]>([
    ["dia", 1, "2026-09-25"],
    ["dia", -1, "2026-09-23"],
    ["semana", 1, "2026-10-01"],
    ["semana", -1, "2026-09-17"],
    ["mes", 1, "2026-10-24"],
    ["mes", -1, "2026-08-24"],
    ["agenda", 1, "2026-10-24"],
    ["agenda", -1, "2026-08-25"],
  ])("%s con sentido %i lleva a %s", (vista, sentido, esperado) => {
    expect(claveDia(navegar(vista, HOY, sentido))).toBe(esperado);
  });

  it("mes: desde el 31 recorta al último día del mes destino", () => {
    expect(claveDia(navegar("mes", { anio: 2026, mes: 1, dia: 31 }, 1))).toBe("2026-02-28");
    expect(claveDia(navegar("mes", { anio: 2028, mes: 1, dia: 31 }, 1))).toBe("2028-02-29");
    expect(claveDia(navegar("mes", { anio: 2026, mes: 12, dia: 31 }, 1))).toBe("2027-01-31");
  });

  it("ir y volver devuelve la fecha original en día, semana y agenda", () => {
    for (const vista of ["dia", "semana", "agenda"] as const) {
      expect(navegar(vista, navegar(vista, HOY, 1), -1)).toEqual(HOY);
    }
  });
});

describe("rangoConsulta", () => {
  it("convierte el rango visible a instantes de Bogotá con un día de margen", () => {
    const { desde, hasta } = rangoConsulta(rangoDeVista("dia", HOY), "America/Bogota");
    expect(desde.toISOString()).toBe("2026-09-23T05:00:00.000Z");
    expect(hasta.toISOString()).toBe("2026-09-26T05:00:00.000Z");
  });

  it("acepta un margen distinto y respeta la zona", () => {
    const { desde, hasta } = rangoConsulta(rangoDeVista("dia", HOY), "Europe/Madrid", 0);
    expect(desde.toISOString()).toBe("2026-09-23T22:00:00.000Z");
    expect(hasta.toISOString()).toBe("2026-09-24T22:00:00.000Z");
  });

  it("la consulta del mes cubre 42 días más el margen", () => {
    const { desde, hasta } = rangoConsulta(rangoDeVista("mes", HOY), "America/Bogota");
    const dias = (hasta.getTime() - desde.getTime()) / 86_400_000;
    expect(dias).toBe(44);
  });
});

describe("validarRangoConsulta", () => {
  it("acepta fechas ISO en orden", () => {
    const rango = validarRangoConsulta("2026-09-24T05:00:00.000Z", "2026-09-25T05:00:00.000Z");
    expect(rango?.desde.toISOString()).toBe("2026-09-24T05:00:00.000Z");
    expect(rango?.hasta.toISOString()).toBe("2026-09-25T05:00:00.000Z");
  });

  it.each([
    ["no es fecha", "2026-09-25T05:00:00.000Z"],
    ["2026-09-24T05:00:00.000Z", "tampoco"],
    ["2026-09-25T05:00:00.000Z", "2026-09-24T05:00:00.000Z"],
    ["2026-09-24T05:00:00.000Z", "2026-09-24T05:00:00.000Z"],
  ])("rechaza %s → %s", (desde, hasta) => {
    expect(validarRangoConsulta(desde, hasta)).toBeNull();
  });

  it("rechaza tipos que no son cadena", () => {
    expect(validarRangoConsulta(1, 2)).toBeNull();
    expect(validarRangoConsulta(null, undefined)).toBeNull();
  });

  it("rechaza rangos mayores al máximo permitido", () => {
    const desde = new Date("2026-01-01T00:00:00Z");
    const dentro = new Date(desde.getTime() + MAX_DIAS_CONSULTA * 86_400_000);
    const fuera = new Date(desde.getTime() + (MAX_DIAS_CONSULTA + 1) * 86_400_000);
    expect(validarRangoConsulta(desde.toISOString(), dentro.toISOString())).not.toBeNull();
    expect(validarRangoConsulta(desde.toISOString(), fuera.toISOString())).toBeNull();
  });
});
