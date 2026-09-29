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
import { escalaDeTiempo } from "@/lib/estadisticas/calculos-tiempo";
import type { DatosTiempo } from "@/lib/estadisticas/consultas";
import { etiquetaSemana } from "@/lib/estadisticas/semanas";
import { formatearMinutos } from "@/lib/notas/formato";

type Props = { datos: DatosTiempo; semanas: number };

export function SeccionTiempo({ datos, semanas }: Props) {
  const escala = escalaDeTiempo(datos.totalMinutos);
  const tiempoPorSemana = datos.porSemana.map((d) => ({ ...d, valor: escala.convertir(d.valor) }));
  const mejor = datos.porSemana.reduce(
    (max, dato) => (dato.valor > max.valor ? dato : max),
    datos.porSemana[0] ?? { semana: "", valor: 0 },
  );

  return (
    <SeccionEstadisticas
      id="tiempo"
      titulo="Tiempo invertido"
      queMide="Las horas que registras en la bitácora, por proyecto y por semana."
    >
      {datos.totalMinutos === 0 ? (
        <EstadoVacio
          icono="reloj"
          titulo="Aún no hay tiempo registrado"
          descripcion="Al crear una entrada de la bitácora puedes indicar cuántos minutos invertiste; aquí verás el resumen."
          accion={<BotonEnlace href="/notas">Nueva entrada en la bitácora</BotonEnlace>}
        />
      ) : (
        <>
          <RejillaKpi>
            <TarjetaKpi
              etiqueta="Tiempo registrado"
              valor={formatearMinutos(datos.totalMinutos)}
              icono="reloj"
              detalle={`Últimas ${semanas} semanas`}
              tonoDetalle="info"
            />
            <TarjetaKpi
              etiqueta="Promedio semanal"
              valor={formatearMinutos(datos.totalMinutos / semanas)}
              icono="grafica"
              detalle="Por semana del periodo"
            />
            <TarjetaKpi
              etiqueta="Proyectos con tiempo"
              valor={String(datos.porProyecto.length)}
              icono="proyectos"
              detalle="Con horas registradas"
            />
            <TarjetaKpi
              etiqueta="Semana con más tiempo"
              valor={formatearMinutos(mejor.valor)}
              icono="calendario"
              detalle={`Semana del ${etiquetaSemana(mejor.semana)}`}
              tonoDetalle="success"
            />
          </RejillaKpi>
          <RejillaGraficas>
            <GraficaInteractiva
              titulo={escala.unidad === "min" ? "Minutos por proyecto" : "Horas por proyecto"}
              descripcion="Tiempo registrado en la bitácora de cada proyecto."
              unidad={escala.unidad}
              unidadSingular={escala.unidadSingular}
              etiquetaCategoria="Proyecto"
              orientacion="horizontal"
              vistas={["barras", "dona"]}
              datos={datos.porProyecto.map((p) => ({
                etiqueta: p.nombre,
                valor: escala.convertir(p.minutos),
              }))}
              mensajeVacio="No hay tiempo registrado en este periodo."
            />
            <GraficaInteractiva
              titulo={escala.unidad === "min" ? "Minutos por semana" : "Horas por semana"}
              descripcion="Tiempo total registrado cada semana, sumando todos los proyectos."
              unidad={escala.unidad}
              unidadSingular={escala.unidadSingular}
              etiquetaCategoria="Semana"
              temporal
              vistas={["barras", "linea"]}
              datos={puntosSemanales(tiempoPorSemana)}
              mensajeVacio="No hay tiempo registrado en este periodo."
            />
          </RejillaGraficas>
        </>
      )}
    </SeccionEstadisticas>
  );
}
