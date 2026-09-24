import type { HTMLAttributes, ReactNode } from "react";

type Propiedades = HTMLAttributes<HTMLDivElement> & {
  titulo?: string;
  accion?: ReactNode;
};

export function Tarjeta({ titulo, accion, children, className, ...resto }: Propiedades) {
  const clases = ["card card-border bg-base-200 shadow-sm", className].filter(Boolean).join(" ");
  return (
    <section className={clases} {...resto}>
      {(titulo || accion) && (
        <header className="flex items-center justify-between gap-2 px-4 pt-4">
          {titulo ? <h2 className="card-title text-base">{titulo}</h2> : <span />}
          {accion}
        </header>
      )}
      <div className="card-body">{children}</div>
    </section>
  );
}
