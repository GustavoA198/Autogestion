import { useId, type HTMLAttributes, type ReactNode } from "react";

export type AcentoTarjeta =
  "rojo" | "naranja" | "amarillo" | "verde" | "gris" | "info" | "primario";

type Propiedades = Omit<HTMLAttributes<HTMLElement>, "title"> & {
  titulo?: string;
  // Rótulo corto sobre el título
  etiqueta?: string;
  descripcion?: string;
  accion?: ReactNode;
  // Franja lateral de color; siempre debe acompañarse de texto o icono
  acento?: AcentoTarjeta;
};

export function Tarjeta({
  titulo,
  etiqueta,
  descripcion,
  accion,
  acento,
  children,
  className,
  ...resto
}: Propiedades) {
  const idTitulo = useId();
  const conCabecera = Boolean(titulo || accion || etiqueta);
  const clases = ["tarjeta", acento ? `tarjeta-acento acento-${acento}` : "", className]
    .filter(Boolean)
    .join(" ");

  const contenido = (
    <>
      {conCabecera && (
        <header className="tarjeta-cabecera px-4 pt-4 sm:px-6 sm:pt-6">
          <div className="min-w-0">
            {etiqueta ? (
              <p className="text-tenue mb-1 text-xs font-bold tracking-wider uppercase">
                {etiqueta}
              </p>
            ) : null}
            {titulo ? (
              <h2 id={idTitulo} className="text-lg leading-snug font-bold tracking-tight">
                {titulo}
              </h2>
            ) : null}
            {descripcion ? <p className="text-suave mt-1 text-sm">{descripcion}</p> : null}
          </div>
          {accion ? <div className="shrink-0 whitespace-nowrap">{accion}</div> : null}
        </header>
      )}
      <div className={`flex flex-col gap-4 ${conCabecera ? "px-4 pt-4 pb-4 sm:px-6 sm:pt-5 sm:pb-6" : "p-4 sm:p-6"}`}>
        {children}
      </div>
    </>
  );

  const nombre = titulo ? idTitulo : undefined;

  return (
    <section className={clases} aria-labelledby={nombre} {...resto}>
      {contenido}
    </section>
  );
}
