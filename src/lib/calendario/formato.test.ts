import { describe, expect, it } from "vitest";
import {
  diasDeDiaCompleto,
  etiquetaDia,
  etiquetaHora,
  fechaCorta,
  fechaDeReunion,
  fechaLarga,
  formatoHora,
  rangoCorto,
  rangoHoras,
  tituloMes,
  tituloRango,
} from "./formato";
import { claveDia } from "./fechas";
import { rangoDeVista } from "./rango";

const HOY = { anio: 2026, mes: 9, dia: 24 };
const BOGOTA = "America/Bogota";

describe("títulos y etiquetas en español", () => {
  it("título del mes", () => {
    expect(tituloMes(HOY)).toBe("septiembre de 2026");
    expect(tituloMes({ anio: 2027, mes: 1, dia: 5 })).toBe("enero de 2027");
  });

  it("fecha larga con y sin año", () => {
    expect(fechaLarga(HOY)).toBe("jueves 24 de septiembre");
    expect(fechaLarga(HOY, HOY)).toBe("jueves 24 de septiembre");
    expect(fechaLarga(HOY, { anio: 2025, mes: 1, dia: 1 })).toBe("jueves 24 de septiembre de 2026");
    expect(fechaLarga(HOY, HOY, true)).toBe("jueves 24 de septiembre de 2026");
  });

  it("fecha corta", () => {
    expect(fechaCorta(HOY)).toBe("24 sep");
    expect(fechaCorta(HOY, true)).toBe("24 sep 2026");
  });

  it("rango corto dentro del mes, entre meses y entre años", () => {
    expect(rangoCorto({ anio: 2026, mes: 9, dia: 21 }, { anio: 2026, mes: 9, dia: 27 })).toBe(
      "21–27 sep 2026",
    );
    expect(rangoCorto({ anio: 2026, mes: 9, dia: 28 }, { anio: 2026, mes: 10, dia: 4 })).toBe(
      "28 sep – 4 oct 2026",
    );
    expect(rangoCorto({ anio: 2026, mes: 12, dia: 28 }, { anio: 2027, mes: 1, dia: 3 })).toBe(
      "28 dic 2026 – 3 ene 2027",
    );
    expect(rangoCorto(HOY, HOY)).toBe("24 sep 2026");
  });

  it("etiqueta de día: Hoy, Mañana, Ayer o fecha larga", () => {
    expect(etiquetaDia(HOY, HOY)).toBe("Hoy");
    expect(etiquetaDia({ anio: 2026, mes: 9, dia: 25 }, HOY)).toBe("Mañana");
    expect(etiquetaDia({ anio: 2026, mes: 9, dia: 23 }, HOY)).toBe("Ayer");
    expect(etiquetaDia({ anio: 2026, mes: 9, dia: 26 }, HOY)).toBe("sábado 26 de septiembre");
    expect(etiquetaDia({ anio: 2027, mes: 1, dia: 4 }, HOY)).toBe("lunes 4 de enero de 2027");
  });

  it("etiqueta de día cruzando fin de mes", () => {
    const fin = { anio: 2026, mes: 9, dia: 30 };
    expect(etiquetaDia({ anio: 2026, mes: 10, dia: 1 }, fin)).toBe("Mañana");
  });

  it("título de la barra según la vista", () => {
    const de = (vista: "agenda" | "dia" | "semana" | "mes") =>
      tituloRango(vista, HOY, HOY, rangoDeVista(vista, HOY));
    expect(de("mes")).toBe("septiembre de 2026");
    expect(de("dia")).toBe("jueves 24 de septiembre");
    expect(de("semana")).toBe("21–27 sep 2026");
    expect(de("agenda")).toBe("24 sep – 23 oct 2026");
  });

  it("el título del día agrega el año cuando no es el actual", () => {
    const ancla = { anio: 2027, mes: 1, dia: 4 };
    expect(tituloRango("dia", ancla, HOY, rangoDeVista("dia", ancla))).toBe(
      "lunes 4 de enero de 2027",
    );
  });

  it("etiqueta de hora con dos dígitos", () => {
    expect(etiquetaHora(0)).toBe("00:00");
    expect(etiquetaHora(9)).toBe("09:00");
    expect(etiquetaHora(23)).toBe("23:00");
  });
});

describe("horas de una reunión", () => {
  it("formatea la hora en la zona indicada, no en UTC", () => {
    expect(formatoHora(new Date("2026-09-24T21:00:00Z"), BOGOTA)).toBe("16:00");
    expect(formatoHora(new Date("2026-09-24T21:00:00Z"), "UTC")).toBe("21:00");
    expect(formatoHora(new Date("2026-09-24T05:00:00Z"), BOGOTA)).toBe("00:00");
  });

  it("rango horario de una reunión con hora y de una de día completo", () => {
    const normal = {
      inicio: new Date("2026-09-24T21:00:00Z"),
      fin: new Date("2026-09-24T22:00:00Z"),
      diaCompleto: false,
    };
    expect(rangoHoras(normal, BOGOTA)).toBe("16:00 – 17:00");
    expect(rangoHoras({ ...normal, diaCompleto: true }, BOGOTA)).toBe("Todo el día");
  });
});

describe("eventos de día completo", () => {
  const unDia = {
    inicio: new Date("2026-09-25T00:00:00Z"),
    fin: new Date("2026-09-26T00:00:00Z"),
    diaCompleto: true,
  };

  it("usa la fecha UTC guardada, sin correrse un día en Bogotá", () => {
    expect(claveDia(diasDeDiaCompleto(unDia).desde)).toBe("2026-09-25");
    expect(claveDia(diasDeDiaCompleto(unDia).hasta)).toBe("2026-09-26");
    expect(fechaDeReunion(unDia, BOGOTA)).toBe("viernes 25 de septiembre de 2026");
  });

  it("varios días: el fin es exclusivo", () => {
    const tresDias = { ...unDia, fin: new Date("2026-09-28T00:00:00Z") };
    expect(claveDia(diasDeDiaCompleto(tresDias).hasta)).toBe("2026-09-28");
    expect(fechaDeReunion(tresDias, BOGOTA)).toBe(
      "viernes 25 de septiembre al domingo 27 de septiembre de 2026",
    );
  });

  it("si el fin es igual o anterior al inicio ocupa igualmente un día", () => {
    const sinFin = { ...unDia, fin: unDia.inicio };
    expect(claveDia(diasDeDiaCompleto(sinFin).hasta)).toBe("2026-09-26");
  });

  it("una reunión con hora se ubica en el día local, no en el UTC", () => {
    const tarde = {
      inicio: new Date("2026-09-25T03:30:00Z"),
      fin: new Date("2026-09-25T04:30:00Z"),
      diaCompleto: false,
    };
    expect(fechaDeReunion(tarde, BOGOTA)).toBe("jueves 24 de septiembre de 2026");
    expect(fechaDeReunion(tarde, "UTC")).toBe("viernes 25 de septiembre de 2026");
  });
});
