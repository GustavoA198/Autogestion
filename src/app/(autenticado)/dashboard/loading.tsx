// Esqueleto de carga del panel con la misma rejilla que la página final.
import { TarjetaEsqueleto, TarjetaKpiEsqueleto } from "@/componentes/shell/tarjeta-esqueleto";

export default function Loading() {
  return (
    <output aria-live="polite" aria-busy="true" className="block">
      <span className="sr-only">Cargando el panel</span>
      <div className="space-y-2 pb-6">
        <span className="skeleton block h-3 w-16" />
        <span className="skeleton block h-8 w-64" />
        <span className="skeleton block h-4 w-96 max-w-full" />
      </div>
      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <TarjetaKpiEsqueleto key={i} />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="lg:col-span-2">
          <TarjetaEsqueleto titulo="Agenda" filas={4} />
        </div>
        <TarjetaEsqueleto titulo="Tareas del día" filas={4} />
        <div className="lg:col-span-2">
          <TarjetaEsqueleto titulo="Proyectos" filas={3} />
        </div>
        <TarjetaEsqueleto titulo="Estadísticas" filas={3} />
      </div>
    </output>
  );
}
