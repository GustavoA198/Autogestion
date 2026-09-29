import type { ReactNode } from "react";

type Propiedades = {
  modulo: string;
  titulo: string;
  descripcion?: ReactNode;
  accion?: ReactNode;
};

export function TituloSeccion({ modulo, titulo, descripcion, accion }: Propiedades) {
  return (
    <header className="flex flex-col gap-4 pb-6 md:flex-row md:flex-wrap md:items-end md:justify-between">
      <div className="min-w-0 flex-1 space-y-1.5 md:basis-72">
        <p className="text-primary text-xs font-bold tracking-[0.1em] uppercase">{modulo}</p>
        <h1 className="text-2xl font-extrabold tracking-tight first-letter:uppercase md:text-[2rem] md:leading-10">
          {titulo}
        </h1>
        {descripcion ? (
          <p className="text-suave max-w-2xl text-sm md:text-[0.9375rem]">{descripcion}</p>
        ) : null}
      </div>
      {accion ? <div className="flex shrink-0 flex-wrap items-center gap-2">{accion}</div> : null}
    </header>
  );
}
