import type { ReactNode } from "react";
import { Icono } from "@/componentes/icono";

type Propiedades = {
  titulo?: string;
  mensaje: string;
  accion?: ReactNode;
};

export function EstadoError({ titulo = "Algo no salió bien", mensaje, accion }: Propiedades) {
  return (
    <div
      className="border-error/30 bg-error/10 rounded-box flex items-start gap-3 border p-4 sm:p-5"
      role="alert"
    >
      <Icono nombre="error" tamano={22} className="text-error mt-0.5" />
      <div className="flex flex-col items-start gap-1.5">
        <h2 className="font-bold">{titulo}</h2>
        <p className="text-suave text-sm">{mensaje}</p>
        {accion ? <div className="mt-1.5">{accion}</div> : null}
      </div>
    </div>
  );
}
