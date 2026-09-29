// Pruebas de las funciones puras que detectan enlaces dentro del texto de un evento.
import { describe, expect, it } from "vitest";
import { dividirEnSegmentos, extraerUrls, htmlATexto, inferirEnlaceReunion } from "./enlaces";

describe("extraerUrls", () => {
  it("quita la puntuación final pegada a la URL", () => {
    const urls = extraerUrls(
      "Únete (https://zoom.us/j/123). O https://a.com/x, luego https://b.com;",
    );
    expect(urls).toEqual(["https://zoom.us/j/123", "https://a.com/x", "https://b.com/"]);
  });

  it("conserva paréntesis balanceados dentro de la URL", () => {
    expect(extraerUrls("ver https://es.wikipedia.org/wiki/Foo_(bar)")).toEqual([
      "https://es.wikipedia.org/wiki/Foo_(bar)",
    ]);
  });

  it("rechaza esquemas peligrosos y no repite URLs", () => {
    expect(extraerUrls("javascript:alert(1) data:text/html,x")).toEqual([]);
    expect(extraerUrls("https://a.com https://a.com")).toEqual(["https://a.com/"]);
  });

  it("devuelve vacío sin texto", () => {
    expect(extraerUrls(null)).toEqual([]);
    expect(extraerUrls("")).toEqual([]);
  });
});

describe("htmlATexto", () => {
  it("conserva saltos de línea y el href de los enlaces", () => {
    const t = htmlATexto(
      'Hola<br>mundo<p>Enlace: <a href="https://x.com/a?b=1&amp;c=2">aquí</a></p>',
    );
    expect(t).toContain("Hola\nmundo");
    expect(t).toContain("aquí (https://x.com/a?b=1&c=2)");
    expect(t).not.toContain("<");
  });

  it("deja intacto el texto plano", () => {
    expect(htmlATexto("a < b y c > d")).toBe("a < b y c > d");
  });

  it("no ejecuta ni conserva etiquetas script", () => {
    expect(htmlATexto("<b>x</b><script>alert(1)</script>")).not.toContain("<");
  });
});

describe("dividirEnSegmentos", () => {
  it("separa texto y enlaces en orden", () => {
    expect(dividirEnSegmentos("Ver https://a.com/x. Fin")).toEqual([
      { texto: "Ver " },
      { texto: "https://a.com/x", url: "https://a.com/x" },
      { texto: ". Fin" },
    ]);
  });

  it("un href javascript: en HTML no genera enlace", () => {
    const seg = dividirEnSegmentos('<a href="javascript:alert(1)">clic</a>');
    expect(seg.every((s) => !s.url)).toBe(true);
  });
});

describe("inferirEnlaceReunion", () => {
  it("reconoce dominios conocidos en la descripción", () => {
    expect(inferirEnlaceReunion("Unirse: https://meet.google.com/abc-defg-hij", null)).toBe(
      "https://meet.google.com/abc-defg-hij",
    );
    expect(inferirEnlaceReunion("https://teams.microsoft.com/l/meetup-join/1", null)).toContain(
      "teams.microsoft.com",
    );
    expect(inferirEnlaceReunion(null, "https://us02web.zoom.us/j/99")).toContain("zoom.us");
    expect(inferirEnlaceReunion("https://empresa.webex.com/meet/x", null)).toContain("webex.com");
  });

  it("prioriza la ubicación y ignora dominios desconocidos o parecidos", () => {
    expect(inferirEnlaceReunion("https://zoom.us/j/1", "https://meet.google.com/x")).toContain(
      "meet.google.com",
    );
    expect(inferirEnlaceReunion("https://ejemplo.com/zoom.us", null)).toBeUndefined();
    expect(inferirEnlaceReunion("https://notzoom.us/j/1", null)).toBeUndefined();
  });

  it("extrae el enlace desde descripción HTML", () => {
    expect(inferirEnlaceReunion('<a href="https://teams.microsoft.com/l/x">Unirse</a>', null)).toBe(
      "https://teams.microsoft.com/l/x",
    );
  });
});
