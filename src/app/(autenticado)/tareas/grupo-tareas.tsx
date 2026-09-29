import { useId, type ReactNode } from "react";

type Propiedades = {
  titulo: string;
  cantidad: number;
  children: ReactNode;
};

// Grupo de tareas: encabezado con contador y una tarjeta por fila, sin contenedor extra
export function GrupoTareas({ titulo, cantidad, children }: Propiedades) {
  const idTitulo = useId();
  return (
    <section aria-labelledby={idTitulo} className="space-y-3">
      <header className="flex flex-wrap items-center gap-2.5">
        <h2 id={idTitulo} className="text-lg leading-snug font-bold tracking-tight">
          {titulo}
        </h2>
        <span className="badge badge-info">
          {cantidad} {cantidad === 1 ? "tarea" : "tareas"}
        </span>
      </header>
      <ul className="lista-tarjetas">{children}</ul>
    </section>
  );
}
