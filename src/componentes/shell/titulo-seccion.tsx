import type { ReactNode } from "react";

type Propiedades = {
  modulo: string;
  titulo: string;
  descripcion?: ReactNode;
  accion?: ReactNode;
};

export function TituloSeccion({ modulo, titulo, descripcion, accion }: Propiedades) {
  return (
    <header className="flex flex-col gap-4 pb-6 md:flex-row md:items-end md:justify-between">
      <div className="space-y-2">
        <p className="text-primary flex items-center gap-2 text-xs tracking-widest uppercase">
          <span className="bg-primary inline-flex h-2 w-2 rounded-full" aria-hidden="true" />
          {modulo}
        </p>
        <h1 className="text-2xl leading-tight font-semibold md:text-3xl">{titulo}</h1>
        {descripcion ? <p className="max-w-2xl text-sm opacity-70">{descripcion}</p> : null}
      </div>
      {accion ? <div className="flex items-center gap-2">{accion}</div> : null}
    </header>
  );
}
