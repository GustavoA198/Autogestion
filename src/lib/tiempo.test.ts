import { describe, expect, it } from "vitest";
import { tiempoRelativo } from "@/lib/tiempo";

const ahora = new Date("2026-06-15T12:00:00Z");
const hace = (segundos: number) => new Date(ahora.getTime() - segundos * 1000);

describe("tiempoRelativo", () => {
  it.each([
    [10, "ahora"],
    [5 * 60, "hace 5 minutos"],
    [3 * 3600, "hace 3 horas"],
    [24 * 3600, "ayer"],
    [3 * 24 * 3600, "hace 3 días"],
    [65 * 24 * 3600, "hace 2 meses"],
    [800 * 24 * 3600, "hace 2 años"],
  ])("con %i segundos transcurridos dice %s", (segundos, esperado) => {
    expect(tiempoRelativo(hace(segundos), ahora)).toBe(esperado);
  });

  it("trata una fecha futura como ahora", () => {
    expect(tiempoRelativo(new Date(ahora.getTime() + 60_000), ahora)).toBe("ahora");
  });
});
