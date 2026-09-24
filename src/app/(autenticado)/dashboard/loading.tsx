// Skeleton de carga para el dashboard.
import { Tarjeta } from "@/componentes/shell/tarjeta";

export default function Loading() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Titulo */}
      <div className="space-y-2">
        <div className="bg-base-300 h-4 w-24 rounded" />
        <div className="bg-base-300 h-8 w-48 rounded" />
        <div className="bg-base-300 h-4 w-72 rounded" />
      </div>

      {/* Fila 1 */}
      <div className="grid gap-6 md:grid-cols-2">
        <Tarjeta titulo="Reuniones de hoy">
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="flex gap-3">
                <div className="bg-base-300 h-4 w-12 shrink-0 rounded" />
                <div className="bg-base-300 h-4 w-full rounded" />
              </div>
            ))}
          </div>
        </Tarjeta>

        <Tarjeta titulo="Tareas del día">
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="bg-base-300 h-5 w-5 shrink-0 rounded" />
                <div className="bg-base-300 h-4 flex-1 rounded" />
              </div>
            ))}
          </div>
        </Tarjeta>
      </div>

      {/* Fila 2 */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Tarjeta titulo="Proyectos">
          <div className="grid grid-cols-2 gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-base-300 h-14 rounded" />
            ))}
          </div>
        </Tarjeta>

        <Tarjeta titulo="Estadísticas (4 sem)">
          <div className="bg-base-300 h-32 rounded" />
        </Tarjeta>

        <Tarjeta titulo="Avisos pendientes">
          <div className="bg-base-300 h-4 w-32 rounded" />
        </Tarjeta>
      </div>
    </div>
  );
}
