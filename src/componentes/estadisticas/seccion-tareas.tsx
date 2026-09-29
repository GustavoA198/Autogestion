import { GraficaInteractiva } from "@/componentes/estadisticas/grafica-interactiva";
import {
  RejillaGraficas,
  RejillaKpi,
  SeccionEstadisticas,
} from "@/componentes/estadisticas/secciones-comunes";
import type { TonoGrafica } from "@/componentes/estadisticas/tipos";
import { TarjetaKpi } from "@/componentes/shell/tarjeta-kpi";
import type { DatosTareas } from "@/lib/estadisticas/consultas";
import { DIAS_VENCE_PRONTO } from "@/lib/estadisticas/calculos-tareas";
import { ESTADO_LABEL } from "@/lib/tareas/presentacion";

// Cada estado con su tono; el nombre siempre acompaña al color
const TONO_ESTADO: Record<string, TonoGrafica> = {
  NUEVA: "info",
  EN_DESARROLLO: "primary",
  PAUSADA: "secondary",
  BLOQUEADA: "warning",
  COMPLETADA: "success",
  CANCELADA: "neutro",
};

export function SeccionTareas({ datos, semanas }: { datos: DatosTareas; semanas: number }) {
  const { vencidas, pronto, aTiempo, sinFecha } = datos.vencimientos;
  const conAvance = datos.avance.filter((a) => a.promedio !== null);
  const sinSubtareas = datos.avance.filter((a) => a.promedio === null);

  return (
    <SeccionEstadisticas
      id="tareas"
      titulo="Tareas"
      queMide="En qué estado están tus tareas, cuánto llevan avanzado según sus subtareas hechas y cuáles necesitan atención por su fecha."
    >
      <RejillaKpi>
        <TarjetaKpi
          etiqueta="Tareas abiertas"
          valor={String(datos.abiertas)}
          icono="lista"
          detalle="Sin completadas ni canceladas"
        />
        <TarjetaKpi
          etiqueta="Vencidas"
          valor={String(vencidas)}
          icono="alerta"
          detalle={vencidas > 0 ? "Requieren atención" : "Todo al día"}
          tonoDetalle={vencidas > 0 ? "error" : "success"}
          tono={vencidas > 0 ? "error" : "success"}
        />
        <TarjetaKpi
          etiqueta="Vencen pronto"
          valor={String(pronto)}
          icono="reloj"
          detalle={`En ${DIAS_VENCE_PRONTO} días o menos`}
          tonoDetalle={pronto > 0 ? "warning" : "neutral"}
          tono={pronto > 0 ? "warning" : "primary"}
        />
        <TarjetaKpi
          etiqueta="Avance promedio"
          valor={datos.avancePromedio === null ? "—" : `${datos.avancePromedio}%`}
          icono="grafica"
          detalle="Abiertas con subtareas"
          tonoDetalle="info"
        />
      </RejillaKpi>
      <RejillaGraficas>
        <GraficaInteractiva
          titulo="Tareas por estado"
          descripcion={`Abiertas y las cerradas en las últimas ${semanas} semanas.`}
          unidad="tareas"
          unidadSingular="tarea"
          etiquetaCategoria="Estado"
          orientacion="horizontal"
          vistas={["barras", "dona"]}
          datos={datos.porEstado.map((c) => ({
            etiqueta: ESTADO_LABEL[c.estado] ?? c.estado,
            valor: c.cantidad,
            tono: TONO_ESTADO[c.estado] ?? "neutro",
          }))}
          mensajeVacio="No hay tareas abiertas ni cerradas en el periodo."
        />
        <GraficaInteractiva
          titulo="Avance por proyecto"
          descripcion="Promedio de subtareas hechas en las tareas abiertas que tienen subtareas, por proyecto."
          unidad="%"
          etiquetaCategoria="Proyecto"
          orientacion="horizontal"
          maximo={100}
          vistas={["barras"]}
          datos={conAvance.map((a) => ({
            etiqueta: a.nombre,
            detalle: `${a.nombre} (${a.tareas} ${a.tareas === 1 ? "tarea abierta con subtareas" : "tareas abiertas con subtareas"})`,
            valor: a.promedio ?? 0,
          }))}
          mensajeVacio="Ninguna tarea abierta tiene subtareas todavía."
          pie={
            sinSubtareas.length > 0 ? (
              <p className="text-suave text-sm">
                <span className="font-bold">Sin subtareas:</span>{" "}
                {sinSubtareas.map((a) => a.nombre).join(", ")}.
              </p>
            ) : undefined
          }
        />
        <GraficaInteractiva
          titulo="Vencidas frente a a tiempo"
          descripcion="Tareas abiertas según su fecha de vencimiento."
          unidad="tareas"
          unidadSingular="tarea"
          etiquetaCategoria="Situación"
          orientacion="horizontal"
          vistas={["barras", "dona"]}
          datos={[
            { etiqueta: "Vencidas", valor: vencidas, tono: "error" },
            {
              etiqueta: `Vencen en ${DIAS_VENCE_PRONTO} días o menos`,
              valor: pronto,
              tono: "warning",
            },
            { etiqueta: "A tiempo", valor: aTiempo, tono: "success" },
            { etiqueta: "Sin fecha", valor: sinFecha, tono: "neutro" },
          ]}
          mensajeVacio="No hay tareas abiertas para clasificar."
        />
      </RejillaGraficas>
    </SeccionEstadisticas>
  );
}
