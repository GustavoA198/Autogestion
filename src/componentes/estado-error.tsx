import type { ReactNode } from "react";

type Propiedades = {
  titulo?: string;
  mensaje: string;
  accion?: ReactNode;
};

export function EstadoError({ titulo = "Algo no salió bien", mensaje, accion }: Propiedades) {
  return (
    <div className="alert alert-error" role="alert">
      <div className="flex flex-col items-start gap-2">
        <h2 className="font-semibold">{titulo}</h2>
        <p className="text-sm">{mensaje}</p>
        {accion}
      </div>
    </div>
  );
}
