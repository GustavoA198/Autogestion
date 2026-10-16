import { describe, expect, it } from "vitest";
import { hrefDeDireccion } from "@/lib/enlaces";

describe("hrefDeDireccion", () => {
  it("antepone https cuando no hay esquema", () => {
    expect(hrefDeDireccion("db.example.com")).toBe("https://db.example.com/");
  });

  it("conserva las direcciones http y https", () => {
    expect(hrefDeDireccion("https://x.com/a")).toBe("https://x.com/a");
    expect(hrefDeDireccion("http://localhost:3000/panel")).toBe("http://localhost:3000/panel");
  });

  it("admite host con puerto y ruta sin esquema", () => {
    expect(hrefDeDireccion("db.example.com:5432")).toBe("https://db.example.com:5432/");
    expect(hrefDeDireccion("localhost:3000/panel")).toBe("https://localhost:3000/panel");
  });

  it.each(["javascript:alert(1)", "JAVASCRIPT:alert(1)", "data:text/html,x", "mailto:a@b.com"])(
    "devuelve undefined para el esquema %s",
    (texto) => {
      expect(hrefDeDireccion(texto)).toBeUndefined();
    },
  );

  it("devuelve undefined si el texto tiene espacios o está vacío", () => {
    expect(hrefDeDireccion("servidor de pruebas")).toBeUndefined();
    expect(hrefDeDireccion("   ")).toBeUndefined();
    expect(hrefDeDireccion(null)).toBeUndefined();
    expect(hrefDeDireccion(undefined)).toBeUndefined();
  });
});
