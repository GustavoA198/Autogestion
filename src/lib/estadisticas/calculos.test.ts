import { describe, expect, it } from "vitest";
import { fechaInicioSemana, agruparPorSemana, agruparPorProyecto } from "./calculos";
import type { TareaCompletadaConTarea } from "./calculos";

const makeTareaCompletada = (
  fecha: string,
  tareaId = "tarea-1",
  proyectoId: string | null = "proy-1",
): TareaCompletadaConTarea => {
  // 12h UTC para que la fecha caiga en el dia correcto en cualquier zona
  const utcMediodia = new Date(fecha + "T12:00:00Z");
  return {
    tareaId,
    fecha: utcMediodia,
    completadoEn: new Date(),
    tarea: { proyectoId },
  } as TareaCompletadaConTarea;
};

describe("fechaInicioSemana", () => {
  it("domingo de la misma semana devuelve el lunes", () => {
    const domingo = new Date("2026-09-27T12:00:00Z"); // 27 sep es domingo
    const inicio = fechaInicioSemana(domingo, "America/Bogota");
    expect(inicio.toISOString().slice(0, 10)).toBe("2026-09-21");
  });

  it("miercoles devuelve el lunes de esa semana", () => {
    const miercoles = new Date("2026-09-23T12:00:00Z");
    const inicio = fechaInicioSemana(miercoles, "America/Bogota");
    expect(inicio.toISOString().slice(0, 10)).toBe("2026-09-21");
  });

  it("lunes devuelve el mismo lunes", () => {
    const lunes = new Date("2026-09-21T12:00:00Z");
    const inicio = fechaInicioSemana(lunes, "America/Bogota");
    expect(inicio.toISOString().slice(0, 10)).toBe("2026-09-21");
  });

  it("zona horaria diferente cambia el borde de semana", () => {
    // Un mismo UTC puede ser domingo en Tokyo y lunes en Bogota
    const utc = new Date("2026-09-28T03:00:00Z"); // 28 sep 03:00 UTC
    const bogota = fechaInicioSemana(utc, "America/Bogota");
    const tokio = fechaInicioSemana(utc, "Asia/Tokyo");
    // En Bogota es 27 sep (domingo) -> semana empieza 21
    // En Tokyo es 28 sep (lunes) -> semana empieza 28
    expect(bogota.toISOString().slice(0, 10)).toBe("2026-09-21");
    expect(tokio.toISOString().slice(0, 10)).toBe("2026-09-28");
  });
});

describe("agruparPorSemana", () => {
  it("sin completadas devuelve array vacio", () => {
    expect(agruparPorSemana([], "America/Bogota")).toEqual([]);
  });

  it("una sola completada devuelve una semana con cantidad 1", () => {
    const completadas = [makeTareaCompletada("2026-09-23")];
    const resultado = agruparPorSemana(completadas, "America/Bogota");
    expect(resultado).toHaveLength(1);
    expect(resultado[0].semana).toBe("2026-09-21");
    expect(resultado[0].cantidad).toBe(1);
  });

  it("varias completadas en la misma semana agrupan", () => {
    const completadas = [
      makeTareaCompletada("2026-09-21"),
      makeTareaCompletada("2026-09-23"),
      makeTareaCompletada("2026-09-24"),
    ];
    const resultado = agruparPorSemana(completadas, "America/Bogota");
    expect(resultado).toHaveLength(1);
    expect(resultado[0].cantidad).toBe(3);
  });

  it("completadas en semanas distintas crean entradas separadas", () => {
    const completadas = [makeTareaCompletada("2026-09-21"), makeTareaCompletada("2026-09-28")];
    const resultado = agruparPorSemana(completadas, "America/Bogota");
    expect(resultado).toHaveLength(2);
    expect(resultado[0].semana).toBe("2026-09-21");
    expect(resultado[1].semana).toBe("2026-09-28");
  });

  it("completadas en borde de semana交界 mes", () => {
    const completadas = [
      makeTareaCompletada("2026-09-21"), // semana: 2026-09-21
      makeTareaCompletada("2026-09-20"), // semana: 2026-09-14
    ];
    const resultado = agruparPorSemana(completadas, "America/Bogota");
    expect(resultado).toHaveLength(2);
  });
});

describe("agruparPorProyecto", () => {
  const proyectos = [
    { id: "proy-1", nombre: "Proyecto A" },
    { id: "proy-2", nombre: "Proyecto B" },
  ];

  it("proyecto sin completadas devuelve cantidad 0", () => {
    const resultado = agruparPorProyecto([], proyectos);
    expect(resultado.find((r) => r.proyectoId === "proy-1")?.cantidad).toBe(0);
    expect(resultado.find((r) => r.proyectoId === "proy-2")?.cantidad).toBe(0);
  });

  it("completadas de un proyecto devuelve su cantidad", () => {
    const completadas = [
      makeTareaCompletada("2026-09-21", "t1", "proy-1"),
      makeTareaCompletada("2026-09-22", "t2", "proy-1"),
    ];
    const resultado = agruparPorProyecto(completadas, proyectos);
    expect(resultado.find((r) => r.proyectoId === "proy-1")?.cantidad).toBe(2);
    expect(resultado.find((r) => r.proyectoId === "proy-2")?.cantidad).toBe(0);
  });

  it("tarea sin proyecto agrupa en null", () => {
    const completadas = [makeTareaCompletada("2026-09-21", "t1", null)];
    const resultado = agruparPorProyecto(completadas, proyectos);
    expect(resultado.find((r) => r.proyectoId === null)).toBeUndefined();
  });
});
