import type { TableHTMLAttributes } from "react";

type Propiedades = TableHTMLAttributes<HTMLTableElement> & {
  titulo?: string;
  descripcion?: string;
  // En móvil cada fila se muestra como tarjeta; las celdas usan data-etiqueta como rótulo
  apilada?: boolean | "ancha";
  // Dentro de otra tarjeta la tabla no dibuja su propio marco
  sinMarco?: boolean;
};

// La tabla hace scroll horizontal dentro de su tarjeta para no desbordar la página
export function Tabla({
  titulo,
  descripcion,
  apilada = true,
  sinMarco = false,
  children,
  className,
  ...resto
}: Propiedades) {
  return (
    <div className={sinMarco ? "overflow-hidden" : "tarjeta overflow-hidden"}>
      {(titulo || descripcion) && (
        <div className="px-4 pt-4 pb-3 sm:px-6 sm:pt-6">
          {titulo ? <h3 className="text-lg font-bold tracking-tight">{titulo}</h3> : null}
          {descripcion ? <p className="text-suave text-sm">{descripcion}</p> : null}
        </div>
      )}
      <div className="overflow-x-auto">
        <table
          className={[
            "table md:w-max md:min-w-full",
            apilada === "ancha" ? "tabla-apilada-ancha" : apilada ? "tabla-apilada" : "",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
          {...resto}
        >
          {children}
        </table>
      </div>
    </div>
  );
}
