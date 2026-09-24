import { Icono, type NombreIcono } from "@/componentes/icono";
import { Insignia } from "@/componentes/insignia";

type TonoDetalle = "info" | "success" | "warning" | "error" | "neutral";

type Propiedades = {
  etiqueta: string;
  valor: string;
  icono?: NombreIcono;
  detalle?: string;
  tonoDetalle?: TonoDetalle;
};

export function TarjetaKpi({
  etiqueta,
  valor,
  icono = "panel",
  detalle,
  tonoDetalle = "neutral",
}: Propiedades) {
  return (
    <article className="card card-border bg-base-200 shadow-sm">
      <div className="card-body gap-2">
        <header className="flex items-center justify-between">
          <p className="flex items-center gap-2 text-sm tracking-widest uppercase opacity-70">
            <Icono nombre={icono} tamano={16} /> {etiqueta}
          </p>
        </header>
        <p className="text-3xl font-semibold">{valor}</p>
        {detalle ? (
          <Insignia tono={tonoDetalle} contorno>
            {detalle}
          </Insignia>
        ) : null}
      </div>
    </article>
  );
}
