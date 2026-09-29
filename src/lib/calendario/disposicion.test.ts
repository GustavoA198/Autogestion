import { describe, expect, it } from "vitest";
import {
  MINUTOS_MINIMOS_VISUALES,
  disponerColumnas,
  horaInicialDeDesplazamiento,
  listaDelDia,
  posicionEnDia,
  posicionHorizontal,
  reunionesPorDia,
  type TramoDia,
} from "./disposicion";
import { sumarDias, type DiaCivil } from "./fechas";
import { diasDelRango, rangoDeVista } from "./rango";

const BOGOTA = "America/Bogota";
const DIA = { anio: 2026, mes: 9, dia: 24 };

type Prueba = { id: string; inicio: Date; fin: Date; diaCompleto: boolean };

function reunion(id: string, inicioIso: string, finIso: string, diaCompleto = false): Prueba {
  return { id, inicio: new Date(inicioIso), fin: new Date(finIso), diaCompleto };
}

function tramo(id: string, inicioMin: number, finMin: number): TramoDia<string> {
  return {
    reunion: id,
    dia: DIA,
    inicioMin,
    finMin,
    continuaAntes: false,
    continuaDespues: false,
  };
}

describe("reunionesPorDia", () => {
  it("ubica una reunión de la tarde en Bogotá en el día local y con minutos locales", () => {
    // 21:00Z = 16:00 en Bogotá
    const r = reunion("a", "2026-09-24T21:00:00Z", "2026-09-24T22:00:00Z");
    const [dia] = reunionesPorDia([r], [DIA], BOGOTA);
    expect(dia.clave).toBe("2026-09-24");
    expect(dia.conHora).toHaveLength(1);
    expect(dia.conHora[0]).toMatchObject({ inicioMin: 16 * 60, finMin: 17 * 60 });
    expect(dia.conHora[0].continuaAntes).toBe(false);
    expect(dia.conHora[0].continuaDespues).toBe(false);
  });

  it("una reunión a las 22:30 en Bogotá (03:30Z del día siguiente) sigue en su día local", () => {
    const r = reunion("noche", "2026-09-25T03:30:00Z", "2026-09-25T04:30:00Z");
    const [hoy, manana] = reunionesPorDia([r], [DIA, sumarDias(DIA, 1)], BOGOTA);
    expect(hoy.conHora).toHaveLength(1);
    expect(hoy.conHora[0].inicioMin).toBe(22 * 60 + 30);
    expect(manana.conHora).toHaveLength(0);
  });

  it("la misma reunión cambia de día al cambiar la zona horaria", () => {
    const r = reunion("noche", "2026-09-25T03:30:00Z", "2026-09-25T04:30:00Z");
    const dias = [DIA, sumarDias(DIA, 1)];
    const [enBogotaHoy, enBogotaManana] = reunionesPorDia([r], dias, BOGOTA);
    const [enUtcHoy, enUtcManana] = reunionesPorDia([r], dias, "UTC");
    const [enTokioHoy, enTokioManana] = reunionesPorDia([r], dias, "Asia/Tokyo");
    expect([enBogotaHoy.conHora.length, enBogotaManana.conHora.length]).toEqual([1, 0]);
    expect([enUtcHoy.conHora.length, enUtcManana.conHora.length]).toEqual([0, 1]);
    expect([enTokioHoy.conHora.length, enTokioManana.conHora.length]).toEqual([0, 1]);
    expect(enTokioManana.conHora[0].inicioMin).toBe(12 * 60 + 30);
  });

  it("un evento que cruza la medianoche genera un tramo en cada día", () => {
    // 22:00 a 01:30 hora de Bogotá
    const r = reunion("cruza", "2026-09-25T03:00:00Z", "2026-09-25T06:30:00Z");
    const [hoy, manana, pasado] = reunionesPorDia(
      [r],
      [DIA, sumarDias(DIA, 1), sumarDias(DIA, 2)],
      BOGOTA,
    );
    expect(hoy.conHora[0]).toMatchObject({
      inicioMin: 22 * 60,
      finMin: 1440,
      continuaAntes: false,
      continuaDespues: true,
    });
    expect(manana.conHora[0]).toMatchObject({
      inicioMin: 0,
      finMin: 90,
      continuaAntes: true,
      continuaDespues: false,
    });
    expect(pasado.conHora).toHaveLength(0);
  });

  it("un evento que termina justo a medianoche no aparece en el día siguiente", () => {
    const r = reunion("hasta-medianoche", "2026-09-25T03:00:00Z", "2026-09-25T05:00:00Z");
    const [hoy, manana] = reunionesPorDia([r], [DIA, sumarDias(DIA, 1)], BOGOTA);
    expect(hoy.conHora[0]).toMatchObject({
      inicioMin: 22 * 60,
      finMin: 1440,
      continuaDespues: false,
    });
    expect(manana.conHora).toHaveLength(0);
  });

  it("un evento que empieza justo a medianoche pertenece al día que empieza", () => {
    const r = reunion("desde-medianoche", "2026-09-24T05:00:00Z", "2026-09-24T06:00:00Z");
    const [ayer, hoy] = reunionesPorDia([r], [sumarDias(DIA, -1), DIA], BOGOTA);
    expect(ayer.conHora).toHaveLength(0);
    expect(hoy.conHora[0]).toMatchObject({ inicioMin: 0, finMin: 60, continuaAntes: false });
  });

  it("un evento de varios días ocupa todos los días intermedios completos", () => {
    const r = reunion("largo", "2026-09-23T15:00:00Z", "2026-09-26T15:00:00Z");
    const dias = diasDelRango({ desde: sumarDias(DIA, -1), hasta: sumarDias(DIA, 4) });
    const porDia = reunionesPorDia([r], dias, BOGOTA);
    expect(porDia.map((d) => d.conHora.length)).toEqual([1, 1, 1, 1, 0]);
    expect(porDia[0].conHora[0]).toMatchObject({ inicioMin: 10 * 60, continuaDespues: true });
    expect(porDia[1].conHora[0]).toMatchObject({ inicioMin: 0, finMin: 1440 });
    expect(porDia[2].conHora[0]).toMatchObject({ inicioMin: 0, finMin: 1440 });
    expect(porDia[3].conHora[0]).toMatchObject({ finMin: 10 * 60, continuaAntes: true });
  });

  it("un evento de duración cero se muestra en su día", () => {
    const r = reunion("instante", "2026-09-24T15:00:00Z", "2026-09-24T15:00:00Z");
    const [dia] = reunionesPorDia([r], [DIA], BOGOTA);
    expect(dia.conHora).toHaveLength(1);
    expect(dia.conHora[0]).toMatchObject({ inicioMin: 600, finMin: 600 });
  });

  it("un fin anterior al inicio se trata como duración cero", () => {
    const r = reunion("roto", "2026-09-24T15:00:00Z", "2026-09-24T14:00:00Z");
    const [dia] = reunionesPorDia([r], [DIA], BOGOTA);
    expect(dia.conHora[0].finMin).toBeGreaterThanOrEqual(dia.conHora[0].inicioMin);
  });

  it("los eventos de día completo van a su franja usando la fecha UTC guardada, sin corrimiento", () => {
    const r = reunion("feriado", "2026-09-25T00:00:00Z", "2026-09-26T00:00:00Z", true);
    const dias = [DIA, sumarDias(DIA, 1), sumarDias(DIA, 2)];
    const porDia = reunionesPorDia([r], dias, BOGOTA);
    expect(porDia.map((d) => d.todoElDia.length)).toEqual([0, 1, 0]);
    expect(porDia.every((d) => d.conHora.length === 0)).toBe(true);
    // El resultado no depende de la zona del navegador
    for (const zona of ["Pacific/Auckland", "Pacific/Pago_Pago", "Europe/Madrid", "UTC"]) {
      expect(reunionesPorDia([r], dias, zona).map((d) => d.todoElDia.length)).toEqual([0, 1, 0]);
    }
  });

  it("un evento de día completo de varios días aparece en cada uno y respeta el fin exclusivo", () => {
    const r = reunion("viaje", "2026-09-24T00:00:00Z", "2026-09-27T00:00:00Z", true);
    const dias = diasDelRango({ desde: sumarDias(DIA, -1), hasta: sumarDias(DIA, 4) });
    expect(reunionesPorDia([r], dias, BOGOTA).map((d) => d.todoElDia.length)).toEqual([
      0, 1, 1, 1, 0,
    ]);
  });

  it("un evento de día completo con fin igual al inicio ocupa un día", () => {
    const r = reunion("un-dia", "2026-09-24T00:00:00Z", "2026-09-24T00:00:00Z", true);
    const dias = [DIA, sumarDias(DIA, 1)];
    expect(reunionesPorDia([r], dias, BOGOTA).map((d) => d.todoElDia.length)).toEqual([1, 0]);
  });

  it("en horario de verano de Nueva York el minuto local es el de pared", () => {
    // 2026-03-08: a las 02:00 los relojes saltan a las 03:00
    const dia = { anio: 2026, mes: 3, dia: 8 };
    const r = reunion("post-cambio", "2026-03-08T14:00:00Z", "2026-03-08T15:00:00Z");
    const [resultado] = reunionesPorDia([r], [dia], "America/New_York");
    // 14:00Z = 10:00 EDT (UTC-4) tras el cambio
    expect(resultado.conHora[0]).toMatchObject({ inicioMin: 10 * 60, finMin: 11 * 60 });
  });

  it("el día de retroceso horario en Madrid abarca las 25 horas sin duplicar ni perder eventos", () => {
    const dia = { anio: 2026, mes: 10, dia: 25 };
    const eventos = [
      reunion("antes", "2026-10-24T22:30:00Z", "2026-10-24T23:00:00Z"),
      reunion("tarde", "2026-10-25T23:00:00Z", "2026-10-25T23:30:00Z"),
      reunion("dentro", "2026-10-25T12:00:00Z", "2026-10-25T13:00:00Z"),
    ];
    const [resultado] = reunionesPorDia(eventos, [dia], "Europe/Madrid");
    const ids = resultado.conHora.map((t) => t.reunion.id).sort();
    // "tarde" empieza a las 00:00 del 26 en Madrid, así que queda fuera del 25
    expect(ids).toEqual(["antes", "dentro"]);
    expect(resultado.conHora.find((t) => t.reunion.id === "dentro")?.inicioMin).toBe(13 * 60);
  });

  it("una semana completa reparte cada reunión en un solo día", () => {
    const semana = diasDelRango(rangoDeVista("semana", DIA));
    const eventos = [
      reunion("lun", "2026-09-21T15:00:00Z", "2026-09-21T16:00:00Z"),
      reunion("jue", "2026-09-24T15:00:00Z", "2026-09-24T16:00:00Z"),
      reunion("dom", "2026-09-27T15:00:00Z", "2026-09-27T16:00:00Z"),
      reunion("fuera", "2026-09-28T15:00:00Z", "2026-09-28T16:00:00Z"),
    ];
    const porDia = reunionesPorDia(eventos, semana, BOGOTA);
    expect(porDia.map((d) => d.conHora.length)).toEqual([1, 0, 0, 1, 0, 0, 1]);
  });

  it("acepta fechas como texto ISO, como llegan tras serializar", () => {
    const r = {
      id: "t",
      inicio: "2026-09-24T15:00:00.000Z",
      fin: "2026-09-24T16:00:00.000Z",
      diaCompleto: false,
    };
    const [dia] = reunionesPorDia([r], [DIA], BOGOTA);
    expect(dia.conHora[0].inicioMin).toBe(600);
  });
});

describe("disponerColumnas", () => {
  it("sin solapamiento cada tramo ocupa todo el ancho", () => {
    const colocados = disponerColumnas([tramo("a", 60, 120), tramo("b", 180, 240)]);
    expect(colocados.map((c) => [c.columna, c.columnas, c.ocupa])).toEqual([
      [0, 1, 1],
      [0, 1, 1],
    ]);
  });

  it("tramos consecutivos que se tocan no se consideran solapados", () => {
    const colocados = disponerColumnas([tramo("a", 60, 120), tramo("b", 120, 180)]);
    expect(colocados.every((c) => c.columnas === 1)).toBe(true);
  });

  it("dos tramos que se pisan comparten el ancho", () => {
    const colocados = disponerColumnas([tramo("a", 60, 180), tramo("b", 120, 240)]);
    expect(colocados.map((c) => [c.reunion, c.columna, c.columnas])).toEqual([
      ["a", 0, 2],
      ["b", 1, 2],
    ]);
  });

  it("tres tramos simultáneos usan tres columnas", () => {
    const colocados = disponerColumnas([
      tramo("a", 60, 180),
      tramo("b", 60, 180),
      tramo("c", 60, 180),
    ]);
    expect(colocados.map((c) => c.columna).sort()).toEqual([0, 1, 2]);
    expect(colocados.every((c) => c.columnas === 3)).toBe(true);
  });

  it("una cadena A-B, B-C sin solapar A con C reutiliza la columna", () => {
    const colocados = disponerColumnas([
      tramo("a", 60, 120),
      tramo("b", 90, 150),
      tramo("c", 130, 200),
    ]);
    const porId = Object.fromEntries(colocados.map((c) => [c.reunion, c]));
    expect(porId.a.columna).toBe(0);
    expect(porId.b.columna).toBe(1);
    expect(porId.c.columna).toBe(0);
    expect(colocados.every((c) => c.columnas === 2)).toBe(true);
  });

  it("el tramo largo va primero y los cortos se acomodan a su lado", () => {
    const colocados = disponerColumnas([
      tramo("corto1", 60, 90),
      tramo("largo", 60, 300),
      tramo("corto2", 100, 130),
    ]);
    const porId = Object.fromEntries(colocados.map((c) => [c.reunion, c]));
    expect(porId.largo.columna).toBe(0);
    expect(porId.corto1.columna).toBe(1);
    expect(porId.corto2.columna).toBe(1);
  });

  it("un tramo se expande a la derecha cuando las columnas vecinas están libres en su hora", () => {
    const colocados = disponerColumnas([
      tramo("largo", 60, 300),
      tramo("corto", 60, 120),
      tramo("medio", 60, 200),
    ]);
    const porId = Object.fromEntries(colocados.map((c) => [c.reunion, c]));
    expect(porId.largo.columnas).toBe(3);
    expect(porId.largo.ocupa).toBe(1);
    expect(porId.corto.columna).toBe(2);

    const libre = disponerColumnas([
      tramo("a", 60, 300),
      tramo("b", 60, 120),
      tramo("c", 200, 260),
    ]);
    const porIdLibre = Object.fromEntries(libre.map((c) => [c.reunion, c]));
    expect(porIdLibre.a.columna).toBe(0);
    expect(porIdLibre.b.columna).toBe(1);
    expect(porIdLibre.c.columna).toBe(1);
    expect(porIdLibre.b.ocupa).toBe(1);

    const expandido = disponerColumnas([
      tramo("a", 60, 300),
      tramo("b", 60, 100),
      tramo("c", 70, 120),
      tramo("d", 150, 200),
    ]);
    const porIdExpandido = Object.fromEntries(expandido.map((c) => [c.reunion, c]));
    expect(porIdExpandido.d.columna).toBe(1);
    expect(porIdExpandido.d.columnas).toBe(3);
    // La columna 2 está libre entre las 02:30 y las 03:20, así que "d" ocupa dos columnas
    expect(porIdExpandido.d.ocupa).toBe(2);
    expect(posicionHorizontal(porIdExpandido.d).ancho).toBeCloseTo((2 / 3) * 100);
  });

  it("el tramo de la primera columna ocupa todo el ancho si las demás columnas están libres en su hora", () => {
    const colocados = disponerColumnas([
      tramo("a", 60, 120),
      tramo("b", 60, 90),
      tramo("c", 100, 120),
    ]);
    const porId = Object.fromEntries(colocados.map((c) => [c.reunion, c]));
    expect(porId.a.columna).toBe(0);
    expect(porId.b.columna).toBe(1);
    expect(porId.c.columna).toBe(1);
    expect(porId.a.columnas).toBe(2);
    expect(porId.a.ocupa).toBe(1);
  });

  it("grupos independientes en el mismo día no comparten ancho", () => {
    const colocados = disponerColumnas([
      tramo("a", 60, 120),
      tramo("b", 90, 150),
      tramo("c", 600, 660),
    ]);
    const porId = Object.fromEntries(colocados.map((c) => [c.reunion, c]));
    expect(porId.a.columnas).toBe(2);
    expect(porId.c.columnas).toBe(1);
  });

  it("los tramos muy cortos ocupan al menos el mínimo visual y chocan con el siguiente", () => {
    const colocados = disponerColumnas([tramo("a", 60, 65), tramo("b", 75, 120)]);
    expect(colocados[0].visualFin - 60).toBe(MINUTOS_MINIMOS_VISUALES);
    expect(colocados.every((c) => c.columnas === 2)).toBe(true);
  });

  it("el mínimo visual no sobrepasa el final del día", () => {
    const [ultimo] = disponerColumnas([tramo("a", 1435, 1440)]);
    expect(ultimo.visualFin).toBe(1440);
  });

  it("no depende del orden de entrada", () => {
    const a = tramo("a", 60, 180);
    const b = tramo("b", 90, 150);
    const c = tramo("c", 200, 260);
    const uno = disponerColumnas([a, b, c]).map((t) => [t.reunion, t.columna, t.columnas]);
    const otro = disponerColumnas([c, b, a]).map((t) => [t.reunion, t.columna, t.columnas]);
    expect(uno.sort()).toEqual(otro.sort());
  });

  it("una lista vacía devuelve una lista vacía", () => {
    expect(disponerColumnas([])).toEqual([]);
  });
});

describe("posiciones", () => {
  it("vertical como porcentaje del día", () => {
    const [colocado] = disponerColumnas([tramo("a", 360, 480)]);
    const { arriba, alto } = posicionEnDia(colocado);
    expect(arriba).toBeCloseTo(25);
    expect(alto).toBeCloseTo(8.3333, 3);
  });

  it("horizontal según columna y expansión", () => {
    expect(posicionHorizontal({ columna: 1, columnas: 3, ocupa: 2 })).toEqual({
      izquierda: (1 / 3) * 100,
      ancho: (2 / 3) * 100,
    });
    expect(posicionHorizontal({ columna: 0, columnas: 1, ocupa: 1 })).toEqual({
      izquierda: 0,
      ancho: 100,
    });
  });
});

describe("listaDelDia", () => {
  it("pone primero los de día completo y luego los de hora en orden cronológico", () => {
    const dia = {
      dia: DIA as DiaCivil,
      clave: "2026-09-24",
      todoElDia: ["feriado"],
      conHora: [tramo("tarde", 900, 960), tramo("manana", 480, 540)],
    };
    expect(listaDelDia(dia).map((e) => e.reunion)).toEqual(["feriado", "manana", "tarde"]);
    expect(listaDelDia(dia)[0].tramo).toBeNull();
  });
});

describe("horaInicialDeDesplazamiento", () => {
  it("sin reuniones y sin hoy abre al inicio de la jornada", () => {
    expect(
      horaInicialDeDesplazamiento({ incluyeHoy: false, minutosAhora: 0, primerInicioMin: null }),
    ).toBe(6.5);
  });

  it("sin hoy sube hasta la primera reunión del rango", () => {
    expect(
      horaInicialDeDesplazamiento({
        incluyeHoy: false,
        minutosAhora: 0,
        primerInicioMin: 7.5 * 60,
      }),
    ).toBe(7);
    expect(
      horaInicialDeDesplazamiento({ incluyeHoy: false, minutosAhora: 0, primerInicioMin: 0 }),
    ).toBe(0);
  });

  it("sin hoy una reunión muy tarde no deja el borde fuera del día", () => {
    expect(
      horaInicialDeDesplazamiento({ incluyeHoy: false, minutosAhora: 0, primerInicioMin: 23 * 60 }),
    ).toBe(14);
  });

  it("hoy sin reuniones sitúa la hora actual una hora y media abajo del borde", () => {
    expect(
      horaInicialDeDesplazamiento({
        incluyeHoy: true,
        minutosAhora: 11 * 60,
        primerInicioMin: null,
      }),
    ).toBe(9.5);
  });

  it("hoy retrocede hasta la primera reunión de la mañana sin perder la hora actual", () => {
    expect(
      horaInicialDeDesplazamiento({
        incluyeHoy: true,
        minutosAhora: 11 * 60,
        primerInicioMin: 7.5 * 60,
      }),
    ).toBe(7);
  });

  it("hoy no retrocede más de seis horas antes de la posición de la hora actual", () => {
    expect(
      horaInicialDeDesplazamiento({
        incluyeHoy: true,
        minutosAhora: 15 * 60,
        primerInicioMin: 1 * 60,
      }),
    ).toBe(7.5);
  });

  it("hoy antes de la primera reunión se queda con la hora actual", () => {
    expect(
      horaInicialDeDesplazamiento({
        incluyeHoy: true,
        minutosAhora: 9 * 60,
        primerInicioMin: 15 * 60,
      }),
    ).toBe(7.5);
  });

  it("nunca es negativa", () => {
    expect(
      horaInicialDeDesplazamiento({ incluyeHoy: true, minutosAhora: 30, primerInicioMin: null }),
    ).toBe(0);
  });
});
