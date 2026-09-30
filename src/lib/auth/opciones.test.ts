import { beforeEach, describe, expect, it, vi } from "vitest";

const { registrarIntento, reiniciarIntentos, verificarCredenciales } = vi.hoisted(() => ({
  registrarIntento: vi.fn(),
  reiniciarIntentos: vi.fn(),
  verificarCredenciales: vi.fn(),
}));

vi.mock("@/lib/auth/limitador", async (original) => ({
  ...(await original<typeof import("@/lib/auth/limitador")>()),
  registrarIntento,
  reiniciarIntentos,
}));

vi.mock("@/lib/usuarios/operaciones", async (original) => ({
  ...(await original<typeof import("@/lib/usuarios/operaciones")>()),
  verificarCredenciales,
}));

import { ERROR_ACCESO_BLOQUEADO, autorizar } from "@/lib/auth/opciones";

const CLAVE = "clave-de-prueba-123";
const USUARIO = { id: "ck9x2m7p000001a2b3c", nombre: "gustavo" };
const SOLICITUD = { headers: { "x-forwarded-for": "203.0.113.7" } };

// La base es la única fuente de verdad: solo acepta el usuario y la clave de la constante
function aceptaSoloLasCorrectas() {
  verificarCredenciales.mockImplementation(async (nombre: string, clave: string) =>
    nombre === "gustavo" && clave === CLAVE ? { ok: true, usuario: USUARIO } : { ok: false },
  );
}

describe("autorizar", () => {
  beforeEach(() => {
    vi.stubEnv("NEXTAUTH_SECRET", "x".repeat(32));
    vi.stubEnv("NEXTAUTH_URL", "http://localhost:3000");
    registrarIntento.mockReset().mockResolvedValue(false);
    reiniciarIntentos.mockReset();
    verificarCredenciales.mockReset();
    aceptaSoloLasCorrectas();
  });

  it("autoriza al usuario correcto y reinicia el contador de intentos", async () => {
    const usuario = await autorizar({ usuario: "gustavo", clave: CLAVE }, SOLICITUD);

    expect(usuario).toEqual({ id: USUARIO.id, name: "gustavo" });
    expect(reiniciarIntentos).toHaveBeenCalledWith("203.0.113.7");
  });

  it("cuenta el intento con la IP de la solicitud", async () => {
    await autorizar({ usuario: "gustavo", clave: CLAVE }, SOLICITUD);
    expect(registrarIntento).toHaveBeenCalledWith("203.0.113.7");
  });

  it("rechaza una contraseña incorrecta sin reiniciar el contador", async () => {
    expect(await autorizar({ usuario: "gustavo", clave: "incorrecta-123" }, SOLICITUD)).toBeNull();
    expect(reiniciarIntentos).not.toHaveBeenCalled();
  });

  it("rechaza un usuario incorrecto aunque la contraseña sea correcta", async () => {
    expect(await autorizar({ usuario: "otro", clave: CLAVE }, SOLICITUD)).toBeNull();
    expect(reiniciarIntentos).not.toHaveBeenCalled();
  });

  it.each([
    ["sin credenciales", undefined],
    ["campos vacíos", { usuario: "", clave: "" }],
    ["tipos incorrectos", { usuario: 1, clave: { a: 1 } }],
    ["clave demasiado larga", { usuario: "gustavo", clave: "x".repeat(500) }],
  ])("rechaza una entrada inválida (%s) sin tocar la base", async (_nombre, credenciales) => {
    expect(await autorizar(credenciales, SOLICITUD)).toBeNull();
    expect(verificarCredenciales).not.toHaveBeenCalled();
  });

  it("lanza un error de bloqueo y no consulta la base cuando el límite está superado", async () => {
    registrarIntento.mockResolvedValue(true);

    await expect(autorizar({ usuario: "gustavo", clave: CLAVE }, SOLICITUD)).rejects.toThrow(
      ERROR_ACCESO_BLOQUEADO,
    );
    expect(verificarCredenciales).not.toHaveBeenCalled();
    expect(reiniciarIntentos).not.toHaveBeenCalled();
  });

  it("no autoriza si falla el registro de intentos", async () => {
    registrarIntento.mockRejectedValue(new Error("base de datos caída"));

    await expect(autorizar({ usuario: "gustavo", clave: CLAVE }, SOLICITUD)).rejects.toThrow();
  });
});
