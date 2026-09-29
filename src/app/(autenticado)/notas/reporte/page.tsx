import Link from "next/link";
import { BotonEnlace } from "@/componentes/enlace";
import { Clipboard } from "@/componentes/clipboard";
import { EstadoVacio } from "@/componentes/estado-vacio";
import { Icono } from "@/componentes/icono";
import { Tarjeta } from "@/componentes/shell/tarjeta";
import { TituloSeccion } from "@/componentes/shell/titulo-seccion";
import { formatearMinutos } from "@/lib/notas/formato";
import { listarNotasEnRango } from "@/lib/notas/operaciones";
import {
  claveDeFecha,
  fechaDeClave,
  hoyComoFecha,
  lunesDeSemana,
  rangoSemana,
  sumarDias,
} from "@/lib/notas/periodo";
import { formatearRango, generarReporteSemanal } from "@/lib/notas/reporte";
import { tareasCompletadasEnSemana } from "@/lib/notas/reporte-datos";
import { leerEntornoTiempo } from "@/lib/tareas/tiempo";

export const dynamic = "force-dynamic";

const CLASES_NAVEGACION = "btn btn-outline";

export default async function ReporteSemanal({ searchParams }: PageProps<"/notas/reporte">) {
  const consulta = await searchParams;
  const { TZ } = leerEntornoTiempo();
  const lunesActual = lunesDeSemana(hoyComoFecha(TZ));

  // ?semana= admite cualquier día de la semana; sin valor válido se usa la semana actual
  const pedida = typeof consulta.semana === "string" ? fechaDeClave(consulta.semana) : null;
  const lunes = pedida ? lunesDeSemana(pedida) : lunesActual;
  const rango = rangoSemana(lunes);
  const esActual = lunes.getTime() === lunesActual.getTime();

  const [notas, tareasCompletadas] = await Promise.all([
    listarNotasEnRango(rango.desde, rango.hasta),
    tareasCompletadasEnSemana(rango),
  ]);
  const reporte = generarReporteSemanal({ rango, notas, tareasCompletadas });

  const anterior = `/notas/reporte?semana=${claveDeFecha(sumarDias(lunes, -7))}`;
  const siguiente = esActual ? null : `/notas/reporte?semana=${claveDeFecha(sumarDias(lunes, 7))}`;

  return (
    <>
      <TituloSeccion
        modulo="Bitácora"
        titulo="Reporte semanal"
        descripcion="Lo que avanzaste en la semana, por proyecto, listo para copiar y compartir."
        accion={
          <BotonEnlace href="/notas" variante="secundario">
            Volver a la bitácora
          </BotonEnlace>
        }
      />
      <div className="space-y-5">
        <nav
          aria-label="Semana del reporte"
          className="tarjeta flex flex-wrap items-center justify-between gap-3 p-4"
        >
          <Link href={anterior} className={CLASES_NAVEGACION}>
            <Icono nombre="chevron-izquierda" tamano={16} />
            Semana anterior
          </Link>
          <p className="text-center font-bold" aria-live="polite">
            {formatearRango(rango)}
            {esActual ? <span className="text-suave font-normal"> · esta semana</span> : null}
          </p>
          {siguiente ? (
            <Link href={siguiente} className={CLASES_NAVEGACION}>
              Semana siguiente
              <Icono nombre="chevron-derecha" tamano={16} />
            </Link>
          ) : (
            <span className={`${CLASES_NAVEGACION} btn-disabled`} aria-disabled="true">
              Semana siguiente
              <Icono nombre="chevron-derecha" tamano={16} />
            </span>
          )}
        </nav>

        {reporte.vacio ? (
          <EstadoVacio
            icono="libreta"
            titulo="Sin actividad esta semana"
            descripcion="No hay entradas de bitácora ni tareas completadas en este rango. Prueba con otra semana."
            accion={<BotonEnlace href="/notas">Ir a la bitácora</BotonEnlace>}
          />
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-suave flex items-center gap-1.5 text-sm">
                <Icono nombre="reloj" tamano={16} />
                Tiempo total de la semana:{" "}
                <strong>
                  {reporte.totalMinutos > 0
                    ? formatearMinutos(reporte.totalMinutos)
                    : "sin registrar"}
                </strong>
              </p>
              <Clipboard texto={reporte.texto} etiqueta="Copiar el reporte semanal" />
            </div>
            <ul className="space-y-5">
              {reporte.proyectos.map((p) => (
                <li key={p.proyectoId ?? "sin-proyecto"}>
                  <Tarjeta
                    titulo={p.nombre}
                    accion={
                      p.minutos > 0 ? (
                        <span className="text-suave flex items-center gap-1 font-mono text-sm">
                          <Icono nombre="reloj" tamano={14} />
                          {formatearMinutos(p.minutos)}
                        </span>
                      ) : undefined
                    }
                  >
                    {p.entradas.length > 0 ? (
                      <div>
                        <h3 className="text-sm font-bold">Entradas</h3>
                        <ul className="mt-1 space-y-1 text-sm">
                          {p.entradas.map((e, i) => (
                            <li key={i} className="break-words">
                              <span className="font-bold">{e.dia}:</span> {e.resumen}
                              {e.minutos ? (
                                <span className="text-suave"> ({formatearMinutos(e.minutos)})</span>
                              ) : null}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {p.tareas.length > 0 ? (
                      <div>
                        <h3 className="text-sm font-bold">Tareas completadas</h3>
                        <ul className="mt-1 list-inside list-disc space-y-1 text-sm">
                          {p.tareas.map((t, i) => (
                            <li key={i} className="break-words">
                              {t}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {p.proximoPaso ? (
                      <p className="tarjeta-fila p-4 text-sm break-words">
                        <span className="font-bold">Próximo paso:</span> {p.proximoPaso}
                      </p>
                    ) : null}
                  </Tarjeta>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </>
  );
}
