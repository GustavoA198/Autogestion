// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Marca, Monograma } from "@/componentes/shell/marca";

afterEach(cleanup);

describe("Marca", () => {
  it("muestra el nombre con tilde y el lema en español", () => {
    render(<Marca />);
    expect(screen.getByText("Autogestión")).toBeTruthy();
    expect(screen.getByText("Tu trabajo, en orden")).toBeTruthy();
  });

  it("el texto de la marca es solo el nombre y el lema", () => {
    const { container } = render(<Marca tamano="grande" />);
    expect(container.textContent).toBe("AutogestiónTu trabajo, en orden");
  });

  it("el monograma es decorativo salvo que se le dé una etiqueta", () => {
    const { container, rerender } = render(<Monograma />);
    expect(container.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
    rerender(<Monograma etiqueta="Autogestión" />);
    expect(screen.getByRole("img", { name: "Autogestión" })).toBeTruthy();
  });
});
