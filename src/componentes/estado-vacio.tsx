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
    <div className="card card-border bg-base-200 shadow-sm" role="status" aria-live="polite">
      <div className="card-body items-center gap-3 py-12 text-center">
        <span className="bg-base-300 text-primary rounded-full p-4">
          <Icono nombre={icono} tamano={28} />
        </span>
        <h2 className="card-title text-lg">{titulo}</h2>
        <p className="max-w-sm text-sm opacity-70">{descripcion}</p>
        {accion}
      </div>
    </div>
  );
}
