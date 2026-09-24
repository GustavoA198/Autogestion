import { describe, expect, it, vi, beforeEach } from "vitest";

// Mockear child_process antes de importar el modulo
vi.mock("node:child_process", () => ({
  execSync: vi.fn(),
}));

vi.mock("@/lib/env", () => ({
  leerEntornoBaseDatos: () => ({ DATABASE_URL: "postgres://test:test@localhost:5432/test" }),
}));

describe("generarVolcadoSql", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("invoca pg_dump con DATABASE_URL y devuelve buffer gzip", async () => {
    const { execSync } = await import("node:child_process");
    const { generarVolcadoSql } = await import("./volcar");

    // pg_dump devuelve un buffer binario simulando texto SQL
    (execSync as ReturnType<typeof vi.fn>).mockReturnValue(Buffer.from("CREATE TABLE test;"));

    const resultado = await generarVolcadoSql();

    expect(execSync).toHaveBeenCalledTimes(1);
    const llamada = (execSync as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(llamada).toContain("pg_dump");
    expect(llamada).toContain("postgres://test:test@localhost:5432/test");
    expect(Buffer.isBuffer(resultado)).toBe(true);
  });

  it("lanza error claro cuando pg_dump no esta disponible", async () => {
    const { execSync } = await import("node:child_process");
    const { generarVolcadoSql } = await import("./volcar");

    const error = new Error("ENOENT: pg_dump not found");
    (execSync as ReturnType<typeof vi.fn>).mockImplementation(() => {
      throw error;
    });

    await expect(generarVolcadoSql()).rejects.toThrow(
      "pg_dump no disponible; en este entorno (Vercel) el respaldo debe apoyarse en otra via",
    );
  });
});
