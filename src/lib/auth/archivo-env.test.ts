import { describe, expect, it } from "vitest";
import { actualizarEnv, leerVariable } from "@/lib/auth/archivo-env";

describe("actualizarEnv", () => {
  it("reemplaza una variable existente y conserva comentarios y demás líneas", () => {
    const contenido = "# comentario\nA=1\nB=2\n";
    expect(actualizarEnv(contenido, { A: "nuevo" })).toBe("# comentario\nA=nuevo\nB=2\n");
  });

  it("agrega las variables que no existen al final", () => {
    expect(actualizarEnv("A=1\n", { B: "2" })).toBe("A=1\nB=2\n");
  });

  it("crea el contenido desde cero", () => {
    expect(actualizarEnv("", { A: "1", B: "2" })).toBe("A=1\nB=2\n");
  });

  it("respeta los saltos de línea CRLF", () => {
    expect(actualizarEnv("A=1\r\nB=2\r\n", { A: "9" })).toBe("A=9\r\nB=2\r\n");
  });

  it("no altera variables con nombre parecido", () => {
    expect(actualizarEnv("AUTH_USUARIO_EXTRA=x\n", { AUTH_USUARIO: "y" })).toBe(
      "AUTH_USUARIO_EXTRA=x\nAUTH_USUARIO=y\n",
    );
  });
});

describe("leerVariable", () => {
  it("devuelve el valor de una variable", () => {
    expect(leerVariable("A=1\nNEXTAUTH_SECRET=abc\n", "NEXTAUTH_SECRET")).toBe("abc");
  });

  it("devuelve undefined si no existe o está vacía", () => {
    expect(leerVariable("A=1\n", "B")).toBeUndefined();
    expect(leerVariable("B=\n", "B")).toBeUndefined();
  });
});
