import type { SVGProps } from "react";

type PropiedadesMonograma = Omit<SVGProps<SVGSVGElement>, "children"> & {
  tamano?: number;
  etiqueta?: string;
};

// Monograma "A" oscura sobre recuadro lima; los colores son fijos para que la marca no cambie con el tema
export function Monograma({ tamano = 36, etiqueta, className, ...resto }: PropiedadesMonograma) {
  const accesibilidad = etiqueta
    ? { role: "img" as const, "aria-label": etiqueta }
    : { "aria-hidden": true as const, focusable: false as const };

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={tamano}
      height={tamano}
      viewBox="0 0 32 32"
      className={["shrink-0", className].filter(Boolean).join(" ")}
      {...accesibilidad}
      {...resto}
    >
      <rect width="32" height="32" rx="9" fill="#c8f031" />
      <path
        d="M8.5 24.5 16 7.5l7.5 17"
        fill="none"
        stroke="#141c00"
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M12.4 19.6h7.2" fill="none" stroke="#141c00" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

type PropiedadesMarca = {
  tamano?: "normal" | "grande";
  className?: string;
};

export function Marca({ tamano = "normal", className }: PropiedadesMarca) {
  const grande = tamano === "grande";
  return (
    <div className={["flex items-center gap-3", className].filter(Boolean).join(" ")}>
      <Monograma tamano={grande ? 44 : 36} />
      <div className="leading-tight">
        <p
          className={
            grande
              ? "text-2xl font-extrabold tracking-tight"
              : "text-[1.0625rem] font-extrabold tracking-tight"
          }
        >
          Autogestión
        </p>
        <p className={grande ? "text-sm opacity-70" : "text-xs opacity-70"}>Tu trabajo, en orden</p>
      </div>
    </div>
  );
}
