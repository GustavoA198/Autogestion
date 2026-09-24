// Skeleton de carga para el dashboard.
import { Tarjeta } from "@/componentes/shell/tarjeta";

export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Titulo */}
      <div className="space-y-2">
        <div className="h-4 w-24 bg-base-300 rounded" />
        <div className="h-8 w-48 bg-base-300 rounded" />
        <div className="h-4 w-72 bg-base-300 rounded" />
      </div>

      {/* Fila 1 */}
      <div className="grid gap-6 md:grid-cols-2">
        <Tarjeta titulo="Reuniones de hoy">
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="flex gap-3">
                <div className="h-4 w-12 bg-base-300 rounded shrink-0" />
                <div className="h-4 w-full bg-base-300 rounded" />
              </div>
            ))}
          </div>
        </Tarjeta>

        <Tarjeta titulo="Tareas del día">
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-5 w-5 bg-base-300 rounded shrink-0" />
                <div className="h-4 flex-1 bg-base-300 rounded" />
              </div>
            ))}
          </div>
        </Tarjeta>
      </div>

      {/* Fila 2 */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Tarjeta titulo="Proyectos">
          <div className="grid gap-2 grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-14 bg-base-300 rounded" />
            ))}
          </div>
        </Tarjeta>

        <Tarjeta titulo="Estadísticas (4 sem)">
          <div className="h-32 bg-base-300 rounded" />
        </Tarjeta>

        <Tarjeta titulo="Avisos pendientes">
          <div className="h-4 w-32 bg-base-300 rounded" />
        </Tarjeta>
      </div>
    </div>
  );
}
