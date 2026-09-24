import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("node:child_process", () => ({
  execSync: vi.fn(),
}));

describe("restaurarDesdeSql", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lanza error si DATABASE_URL_RESTORE no esta definida", async () => {
    const originalEnv = process.env;
    process.env = { ...originalEnv, DATABASE_URL_RESTORE: "" };

    const { restaurarDesdeSql } = await import("./restaurar");

    await expect(restaurarDesdeSql(Buffer.from("CREATE TABLE test;"))).rejects.toThrow(
      "DATABASE_URL_RESTORE no está configurada.",
    );

    process.env = originalEnv;
  });

  it("invoca psql con DATABASE_URL_RESTORE y el SQL sin comprimir", async () => {
    const { execSync } = await import("node:child_process");
    const originalEnv = process.env;
    process.env = {
      ...originalEnv,
      DATABASE_URL_RESTORE: "postgres://test:test@localhost:5432/restore",
    };

    const { restaurarDesdeSql } = await import("./restaurar");

    (execSync as ReturnType<typeof vi.fn>).mockReturnValue(Buffer.from(""));

    const sql = Buffer.from("CREATE TABLE test;");
    await restaurarDesdeSql(sql);

    expect(execSync).toHaveBeenCalledTimes(1);
    const llamada = (execSync as ReturnType<typeof vi.fn>).mock.calls[0] as [string, object];
    expect(llamada[0]).toContain("psql");
    expect(llamada[0]).toContain("postgres://test:test@localhost:5432/restore");
    expect(llamada[1]).toHaveProperty("input");
    expect((llamada[1] as { input: Buffer }).input).toEqual(sql);

    process.env = originalEnv;
  });

  it("descomprime gzip y pasa a psql si el archivo tiene magic number gzip", async () => {
    const { execSync } = await import("node:child_process");
    const originalEnv = process.env;
    process.env = {
      ...originalEnv,
      DATABASE_URL_RESTORE: "postgres://test:test@localhost:5432/restore",
    };

    const { restaurarDesdeSql } = await import("./restaurar");

    // Gzip magic number seguido de datos
    const gzipMagic = Buffer.from([0x1f, 0x8b]);
    const sqlContent = Buffer.from("CREATE TABLE test;");
    const sql = Buffer.concat([gzipMagic, sqlContent]);

    (execSync as ReturnType<typeof vi.fn>).mockReturnValue(Buffer.from(""));

    await restaurarDesdeSql(sql);

    expect(execSync).toHaveBeenCalledTimes(1);

    process.env = originalEnv;
  });
});
