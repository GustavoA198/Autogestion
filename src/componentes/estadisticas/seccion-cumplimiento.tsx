import { GraficaInteractiva } from "@/componentes/estadisticas/grafica-interactiva";
import {
  categoriasSemanales,
  puntosSemanales,
  RejillaGraficas,
  RejillaKpi,
  SeccionEstadisticas,
} from "@/componentes/estadisticas/secciones-comunes";
import { TarjetaKpi } from "@/componentes/shell/tarjeta-kpi";
import type { DatosCumplimiento } from "@/lib/estadisticas/consultas";
import { etiquetaSemana } from "@/lib/estadisticas/semanas";

type Props = { datos: DatosCumplimiento; semanas: string[] };

export function SeccionCumplimiento({ datos, semanas }: Props) {
  const mejor = datos.completadas.reduce(
    (max, dato) => (dato.valor > max.valor ? dato : max),
    datos.completadas[0] ?? { semana: "", valor: 0 },
  );
  const { porcentaje, aTiempo, conVencimiento } = datos.resumen;

  return (
    <SeccionEstadisticas
      id="cumplimiento"
      titulo="Cumplimiento"
      queMide="Cuántas tareas completas cada semana y si las terminas dentro de su fecha de vencimiento."
    >
      <RejillaKpi>
        <TarjetaKpi
          etiqueta="Completadas"
          valor={String(datos.total)}
          icono="check-circulo"
          detalle={`Últimas ${semanas.length} semanas`}
          tonoDetalle="info"
        />
        <TarjetaKpi
          etiqueta="Promedio semanal"
          valor={String(datos.promedio).replace(".", ",")}
          icono="grafica"
          detalle="Tareas por semana"
        />
        <TarjetaKpi
          etiqueta="Entregadas a tiempo"
          valor={porcentaje === null ? "—" : `${porcentaje}%`}
          icono="bandera"
          detalle={
            porcentaje === null
              ? "Ninguna completada tenía fecha"
              : `${aTiempo} de ${conVencimiento} con fecha`
          }
          tonoDetalle={porcentaje === null ? "neutral" : porcentaje >= 80 ? "success" : "warning"}
        />
        <TarjetaKpi
          etiqueta="Mejor semana"
          valor={String(mejor.valor)}
          icono="reloj"
          detalle={mejor.valor > 0 ? `Semana del ${etiquetaSemana(mejor.semana)}` : "Sin actividad"}
          tonoDetalle={mejor.valor > 0 ? "success" : "neutral"}
        />
      </RejillaKpi>
      <RejillaGraficas>
        <GraficaInteractiva
          titulo="Tareas completadas por semana"
          descripcion="Incluye las marcadas como hechas cada día y las que pasaron a estado Completada."
          unidad="tareas"
          unidadSingular="tarea"
          etiquetaCategoria="Semana"
          temporal
          vistas={["barras", "linea"]}
          datos={puntosSemanales(datos.completadas)}
          mensajeVacio="No se completaron tareas en este periodo."
        />
        <GraficaInteractiva
          titulo="Puntualidad por semana"
          descripcion="Completadas dentro y fuera de su fecha de vencimiento; no cuenta las tareas sin fecha."
          unidad="tareas"
          unidadSingular="tarea"
          etiquetaCategoria="Semana"
          temporal
          vistas={["barras", "linea"]}
          vistaInicial="linea"
          categorias={categoriasSemanales(semanas)}
          series={[
            {
              nombre: "A tiempo",
              tono: "success",
              valores: datos.puntualidad.map((p) => p.aTiempo),
            },
            {
              nombre: "Fuera de plazo",
              tono: "error",
              valores: datos.puntualidad.map((p) => p.tarde),
            },
          ]}
          mensajeVacio="Ninguna tarea con fecha de vencimiento se completó en este periodo."
        />
      </RejillaGraficas>
    </SeccionEstadisticas>
  );
}
