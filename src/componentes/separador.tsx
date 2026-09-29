type Propiedades = {
  orientacion?: "horizontal" | "vertical";
  clase?: string;
};

export function Separador({ orientacion = "horizontal", clase }: Propiedades) {
  if (orientacion === "vertical") {
    return (
      <div
        role="separator"
        aria-orientation="vertical"
        className={["bg-base-300 mx-2 inline-block w-px self-stretch", clase]
          .filter(Boolean)
          .join(" ")}
      />
    );
  }
  return <hr className={["border-base-300 my-4 border-t", clase].filter(Boolean).join(" ")} />;
}
