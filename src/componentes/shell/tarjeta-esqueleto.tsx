import { Tarjeta } from "@/componentes/shell/tarjeta";

type Propiedades = {
  titulo?: string;
  filas?: number;
  alto?: string;
};

// Esqueleto de carga con la misma superficie que la tarjeta final para evitar saltos de diseño
export function TarjetaEsqueleto({ titulo, filas = 3, alto = "h-11" }: Propiedades) {
  return (
    <Tarjeta titulo={titulo} aria-hidden={titulo ? undefined : true}>
      {Array.from({ length: filas }).map((_, i) => (
        <span key={i} className={`skeleton ${alto} ${i === filas - 1 ? "w-3/4" : "w-full"}`} />
      ))}
    </Tarjeta>
  );
}

// Esqueleto de una tarjeta de indicador (KPI)
export function TarjetaKpiEsqueleto() {
  return (
    <div className="tarjeta flex flex-col gap-2 p-4 sm:gap-3 sm:p-6" aria-hidden="true">
      <div className="flex items-center justify-between gap-3">
        <span className="skeleton h-4 w-20 sm:w-32" />
        <span className="skeleton size-9 rounded-full sm:size-10" />
      </div>
      <span className="skeleton h-9 w-16" />
      <span className="skeleton h-6 w-28 rounded-full" />
    </div>
  );
}
