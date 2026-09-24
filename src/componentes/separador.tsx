type Propiedades = {
  orientacion?: "horizontal" | "vertical";
  clase?: string;
};

export function Separador({ orientacion = "horizontal", clase }: Propiedades) {
  const clases = ["divider", orientacion === "vertical" ? "divider-vertical" : "", clase]
    .filter(Boolean)
    .join(" ");
  return <hr role="separator" className={clases} />;
}
