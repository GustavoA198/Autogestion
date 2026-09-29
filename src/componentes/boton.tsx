import type { ButtonHTMLAttributes } from "react";

type Variante = "primario" | "secundario" | "peligro" | "fantasma" | "acento";
type Tamano = "pequeno" | "mediano" | "grande";

const VARIANTES: Record<Variante, string> = {
  primario: "btn-primary",
  secundario: "btn-outline",
  peligro: "btn-error",
  acento: "btn-accent",
  fantasma: "btn-ghost",
};

const TAMANOS: Record<Tamano, string> = {
  pequeno: "btn-sm",
  mediano: "",
  grande: "btn-lg",
};

type Propiedades = ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: Variante;
  tamano?: Tamano;
  cargando?: boolean;
};

// Clases compartidas por botones y enlaces con aspecto de botón
export function clasesBoton(
  variante: Variante = "primario",
  tamano: Tamano = "mediano",
  className?: string,
): string {
  return ["btn", VARIANTES[variante], TAMANOS[tamano], className].filter(Boolean).join(" ");
}

export type { Variante as VarianteBoton, Tamano as TamanoBoton };

export function Boton({
  variante = "primario",
  tamano = "mediano",
  cargando = false,
  disabled,
  type = "button",
  className,
  children,
  ...resto
}: Propiedades) {
  const clases = clasesBoton(variante, tamano, className);
  return (
    <button
      type={type}
      disabled={disabled || cargando}
      className={clases}
      aria-busy={cargando || undefined}
      {...resto}
    >
      {cargando ? <span className="loading loading-spinner loading-sm" aria-hidden="true" /> : null}
      {children}
    </button>
  );
}
