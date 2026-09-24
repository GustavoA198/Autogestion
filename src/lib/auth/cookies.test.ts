import { beforeEach, describe, expect, it, vi } from "vitest";

describe("cookies de sesion", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("marca secure=true cuando NEXTAUTH_URL es https", async () => {
    vi.stubEnv("NEXTAUTH_URL", "https://mi-app.vercel.app");
    vi.stubEnv("VERCEL", "1");

    const { authOptions } = await import("@/lib/auth/opciones");
    const cookie = authOptions.cookies?.sessionToken;
    expect(cookie?.options.secure).toBe(true);
    expect(cookie?.name).toBe("__Secure-next-auth.session-token");
  });

  it("marca secure=false cuando NEXTAUTH_URL es http", async () => {
    vi.stubEnv("NEXTAUTH_URL", "http://localhost:3000");
    vi.stubEnv("VERCEL", "");

    const { authOptions } = await import("@/lib/auth/opciones");
    const cookie = authOptions.cookies?.sessionToken;
    expect(cookie?.options.secure).toBe(false);
    expect(cookie?.name).toBe("next-auth.session-token");
  });

  it("esProduccion devuelve true para https", async () => {
    vi.stubEnv("NEXTAUTH_URL", "https://produccion.com");
    const { esProduccion } = await import("@/lib/env");
    expect(esProduccion()).toBe(true);
  });

  it("esProduccion devuelve false para http", async () => {
    vi.stubEnv("NEXTAUTH_URL", "http://localhost:3000");
    const { esProduccion } = await import("@/lib/env");
    expect(esProduccion()).toBe(false);
  });

  it("estaEnVercel detecta el entorno", async () => {
    vi.stubEnv("VERCEL", "1");
    const { estaEnVercel } = await import("@/lib/env");
    expect(estaEnVercel()).toBe(true);
  });

  it("urlMigraciones devuelve DIRECT_URL cuando existe", async () => {
    vi.stubEnv("DIRECT_URL", "postgresql://u:p@host:5432/bd");
    const { urlMigraciones } = await import("@/lib/prisma");
    expect(urlMigraciones()).toBe("postgresql://u:p@host:5432/bd");
  });

  it("urlMigraciones recurre a DATABASE_URL sin DIRECT_URL", async () => {
    vi.stubEnv("DATABASE_URL", "postgresql://u:p@localhost:5432/bd");
    const { urlMigraciones } = await import("@/lib/prisma");
    expect(urlMigraciones()).toBe("postgresql://u:p@localhost:5432/bd");
  });
});
