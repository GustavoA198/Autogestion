import type { ReactNode } from "react";
import { Icono, type NombreIcono } from "@/componentes/icono";

type Propiedades = {
  icono?: NombreIcono;
  titulo: string;
  descripcion: string;
  accion?: ReactNode;
};

export function EstadoVacio({ icono = "panel", titulo, descripcion, accion }: Propiedades) {
  return (
    <div
      className="estado-vacio border-linea-tarjeta bg-base-100 rounded-box flex flex-col items-center gap-2 border border-dashed px-6 py-12 text-center"
      role="status"
      aria-live="polite"
    >
      <span className="bg-primary/15 text-primary mb-1 grid size-14 place-items-center rounded-full">
        <Icono nombre={icono} tamano={26} />
      </span>
      <h2 className="text-lg font-bold">{titulo}</h2>
      <p className="text-suave max-w-sm text-sm">{descripcion}</p>
      {accion ? <div className="mt-2">{accion}</div> : null}
    </div>
  );
}
