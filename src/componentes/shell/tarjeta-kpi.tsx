import { Icono, type NombreIcono } from "@/componentes/icono";
import { Insignia } from "@/componentes/insignia";

type TonoDetalle = "info" | "success" | "warning" | "error" | "neutral";
type TonoKpi = "primary" | "error" | "warning" | "success" | "info";

type Propiedades = {
  etiqueta: string;
  valor: string;
  icono?: NombreIcono;
  detalle?: string;
  tonoDetalle?: TonoDetalle;
  // Tono del icono: el color nunca es el único indicador, siempre va con la etiqueta y el detalle
  tono?: TonoKpi;
};

const CLASES_ICONO: Record<TonoKpi, string> = {
  primary: "bg-primary/15 text-primary",
  error: "bg-error/15 text-error",
  warning: "bg-warning/15 text-warning",
  success: "bg-success/15 text-success",
  info: "bg-info/15 text-info",
};

export function TarjetaKpi({
  etiqueta,
  valor,
  icono = "panel",
  detalle,
  tonoDetalle = "neutral",
  tono = "primary",
}: Propiedades) {
  return (
    <article className="tarjeta flex min-w-0 flex-col gap-2 p-4 sm:gap-3 sm:p-6">
      <header className="flex items-center justify-between gap-3">
        <p className="text-suave min-w-0 text-xs font-bold sm:text-sm">{etiqueta}</p>
        <span
          className={`${CLASES_ICONO[tono]} grid size-9 shrink-0 place-items-center rounded-full sm:size-10`}
        >
          <Icono nombre={icono} tamano={20} />
        </span>
      </header>
      <p className="text-3xl leading-none font-extrabold tracking-tight tabular-nums sm:text-4xl">
        {valor}
      </p>
      {detalle ? (
        <div>
          <Insignia tono={tonoDetalle} contorno className="badge-ajustable">
            {detalle}
          </Insignia>
        </div>
      ) : null}
    </article>
  );
}
