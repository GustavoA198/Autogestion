import { GraficaBarras } from "@/componentes/grafica-barras";
import { TarjetaKpi } from "@/componentes/shell/tarjeta-kpi";

type DatoSemana = { semana: string; cantidad: number };
type DatoProyecto = {
  proyectoId: string | null;
  nombre: string;
  cantidad: number;
};

type Props = {
  datosSemana: DatoSemana[];
  datosProyecto: DatoProyecto[];
  total: number;
  periodoSemanas: number;
};

function formatearSemana(fechaStr: string): string {
  const fecha = new Date(fechaStr);
  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "short",
  }).format(fecha);
}

export function ResumenEstadisticas({
  datosSemana,
  datosProyecto,
  total,
  periodoSemanas,
}: Props) {
  const barrasSemana = datosSemana.map((d) => ({
    etiqueta: formatearSemana(d.semana),
    cantidad: d.cantidad,
    ariaLabel: `Semana del ${formatearSemana(d.semana)}: ${d.cantidad} tarea${d.cantidad !== 1 ? "s" : ""} completada${d.cantidad !== 1 ? "s" : ""}`,
  }));

  const barrasProyecto = datosProyecto
    .filter((d) => d.cantidad > 0)
    .map((d) => ({
      etiqueta: d.nombre.length > 12 ? d.nombre.slice(0, 12) + "…" : d.nombre,
      cantidad: d.cantidad,
      ariaLabel: `${d.nombre}: ${d.cantidad} tarea${d.cantidad !== 1 ? "s" : ""} completada${d.cantidad !== 1 ? "s" : ""}`,
    }));

  return (
    <section className="grid gap-6" aria-label="Estadísticas de productividad">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <TarjetaKpi
          etiqueta="Total completadas"
          valor={String(total)}
          icono="lista"
          detalle={`últimas ${periodoSemanas} sem`}
          tonoDetalle="info"
        />
        <TarjetaKpi
          etiqueta="Promedio semanal"
          valor={
            datosSemana.length > 0
              ? (total / datosSemana.length).toFixed(1)
              : "0"
          }
          icono="panel"
          tonoDetalle="neutral"
        />
        <TarjetaKpi
          etiqueta="Mejor semana"
          valor={
            datosSemana.length > 0
              ? String(Math.max(...datosSemana.map((d) => d.cantidad)))
              : "0"
          }
          icono="panel"
          tonoDetalle="success"
        />
        <TarjetaKpi
          etiqueta="Proyectos activos"
          valor={String(datosProyecto.filter((d) => d.cantidad > 0).length)}
          icono="proyectos"
          tonoDetalle="neutral"
        />
      </div>

      {barrasSemana.length > 0 ? (
        <div className="card card-border bg-base-200 shadow-sm">
          <div className="card-body gap-4">
            <h3 className="card-title text-base">Tareas por semana</h3>
            <GraficaBarras datos={barrasSemana} altoMaximo={160} />
          </div>
        </div>
      ) : null}

      {barrasProyecto.length > 0 ? (
        <div className="card card-border bg-base-200 shadow-sm">
          <div className="card-body gap-4">
            <h3 className="card-title text-base">Tareas por proyecto</h3>
            <GraficaBarras datos={barrasProyecto} altoMaximo={120} />
          </div>
        </div>
      ) : null}
    </section>
  );
}
