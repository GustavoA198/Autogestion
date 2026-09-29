import { BotonEnlace } from "@/componentes/enlace";
import { EstadoVacio } from "@/componentes/estado-vacio";
import { GraficaInteractiva } from "@/componentes/estadisticas/grafica-interactiva";
import {
  puntosSemanales,
  RejillaGraficas,
  RejillaKpi,
  SeccionEstadisticas,
} from "@/componentes/estadisticas/secciones-comunes";
import { TarjetaKpi } from "@/componentes/shell/tarjeta-kpi";
import type { DatosReuniones } from "@/lib/estadisticas/consultas";
import { formatearMinutos } from "@/lib/notas/formato";

type Props = { datos: DatosReuniones; semanas: number };

function formatearHoras(horas: number): string {
  return `${new Intl.NumberFormat("es-CO", { maximumFractionDigits: 1 }).format(horas)} h`;
}

export function SeccionReuniones({ datos, semanas }: Props) {
  const promedio = datos.total / semanas;
  const duracionMedia = datos.total === 0 ? 0 : (datos.horas * 60) / datos.total;

  return (
    <SeccionEstadisticas
      id="reuniones"
      titulo="Reuniones"
      queMide="Cuántas reuniones tienes por semana y cuántas horas ocupan; no cuenta las de día completo ni las canceladas."
    >
      {datos.total === 0 ? (
        <EstadoVacio
          icono="calendario"
          titulo="Sin reuniones en este periodo"
          descripcion="Cuando sincronices tu calendario verás aquí el resumen de tus reuniones."
          accion={
            <BotonEnlace href="/calendario" variante="secundario">
              Ir al calendario
            </BotonEnlace>
          }
        />
      ) : (
        <>
          <RejillaKpi>
            <TarjetaKpi
              etiqueta="Reuniones"
              valor={String(datos.total)}
              icono="video"
              detalle={`Últimas ${semanas} semanas`}
              tonoDetalle="info"
            />
            <TarjetaKpi
              etiqueta="Horas en reuniones"
              valor={formatearHoras(datos.horas)}
              icono="reloj"
              detalle="Suma de sus duraciones"
            />
            <TarjetaKpi
              etiqueta="Promedio semanal"
              valor={new Intl.NumberFormat("es-CO", { maximumFractionDigits: 1 }).format(promedio)}
              icono="grafica"
              detalle="Reuniones por semana"
            />
            <TarjetaKpi
              etiqueta="Duración media"
              valor={formatearMinutos(duracionMedia)}
              icono="calendario"
              detalle="Por reunión"
            />
          </RejillaKpi>
          <RejillaGraficas>
            <GraficaInteractiva
              titulo="Reuniones por semana"
              descripcion="Incluye la semana actual completa, aunque algunas reuniones aún no hayan ocurrido."
              unidad="reuniones"
              unidadSingular="reunión"
              etiquetaCategoria="Semana"
              temporal
              vistas={["barras", "linea"]}
              datos={puntosSemanales(datos.porSemana)}
              mensajeVacio="No hay reuniones en este periodo."
            />
            <GraficaInteractiva
              titulo="Horas en reuniones por semana"
              descripcion="Duración total de las reuniones de cada semana."
              unidad="horas"
              unidadSingular="hora"
              etiquetaCategoria="Semana"
              temporal
              vistas={["barras", "linea"]}
              datos={puntosSemanales(datos.horasPorSemana)}
              mensajeVacio="No hay reuniones en este periodo."
            />
            {datos.porProveedor.length > 1 ? (
              <GraficaInteractiva
                titulo="Horas por calendario"
                descripcion="Las reuniones no están ligadas a proyectos; se agrupan por el calendario de origen."
                unidad="horas"
                unidadSingular="hora"
                etiquetaCategoria="Calendario"
                orientacion="horizontal"
                vistas={["barras", "dona"]}
                datos={datos.porProveedor.map((p) => ({
                  etiqueta: p.nombre,
                  detalle: `${p.nombre} (${p.reuniones} ${p.reuniones === 1 ? "reunión" : "reuniones"})`,
                  valor: p.horas,
                }))}
                mensajeVacio="No hay reuniones en este periodo."
              />
            ) : null}
          </RejillaGraficas>
        </>
      )}
    </SeccionEstadisticas>
  );
}
