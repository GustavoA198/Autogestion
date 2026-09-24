import type { TableHTMLAttributes } from "react";

type Propiedades = TableHTMLAttributes<HTMLTableElement> & {
  titulo?: string;
  descripcion?: string;
};

export function Tabla({ titulo, descripcion, children, className, ...resto }: Propiedades) {
  return (
    <div className="card card-border bg-base-200 overflow-x-auto shadow-sm">
      {(titulo || descripcion) && (
        <div className="px-4 pt-4">
          {titulo ? <h3 className="font-semibold">{titulo}</h3> : null}
          {descripcion ? <p className="text-sm opacity-70">{descripcion}</p> : null}
        </div>
      )}
      <table className={["table-zebra table", className].filter(Boolean).join(" ")} {...resto}>
        {children}
      </table>
    </div>
  );
}
