import { notFound } from "next/navigation";
import { BotonContinuar } from "@/componentes/boton-continuar";
import { Boton } from "@/componentes/boton";
import { BotonEnlace } from "@/componentes/enlace";
import { Entrada } from "@/componentes/entrada";
import { EstadoVacio } from "@/componentes/estado-vacio";
import { FiltroPeriodoNotas } from "@/componentes/filtro-periodo-notas";
import { Icono } from "@/componentes/icono";
import { Tarjeta } from "@/componentes/shell/tarjeta";
import { TituloSeccion } from "@/componentes/shell/titulo-seccion";
import { formatearMinutos, sumarMinutos } from "@/lib/notas/formato";
import {
  buscarNotasEnProyecto,
  listarNotasDeProyecto,
  obtenerUltimaNota,
} from "@/lib/notas/operaciones";
import { ETIQUETA_PERIODO, leerPeriodo, rangoDePeriodo } from "@/lib/notas/periodo";
import { obtenerProyecto } from "@/lib/proyectos/operaciones";
import { leerEntornoTiempo } from "@/lib/tareas/tiempo";
import { NotaFila } from "./nota-fila";

export const dynamic = "force-dynamic";

function agruparPorDia<T extends { fecha: Date }>(notas: T[]) {
  const grupos = new Map<string, T[]>();
  for (const nota of notas) {
    const clave = nota.fecha.toISOString().split("T")[0];
    if (!grupos.has(clave)) grupos.set(clave, []);
    grupos.get(clave)!.push(nota);
  }
  return grupos;
}

// La clave es una fecha pura: se formatea en UTC para no correrla de día
function formatFecha(iso: string): string {
  const fecha = new Date(iso + "T00:00:00Z");
  return fecha.toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

function primero(valor: string | string[] | undefined): string | undefined {
  const texto = Array.isArray(valor) ? valor[0] : valor;
  return texto || undefined;
}

export default async function NotasProyecto({
  params,
  searchParams,
}: PageProps<"/proyectos/[id]/notas">) {
  const { id: proyectoId } = await params;
  const consulta = await searchParams;
  const busqueda = primero(consulta.busqueda);
  const periodo = leerPeriodo(consulta.periodo);
  const { TZ } = leerEntornoTiempo();
  const rango = rangoDePeriodo(periodo, TZ);

  const proyecto = await obtenerProyecto(proyectoId);
  if (!proyecto) notFound();

  const [notas, ultima] = await Promise.all([
    busqueda
      ? buscarNotasEnProyecto(proyectoId, busqueda, rango)
      : listarNotasDeProyecto(proyectoId, rango),
    obtenerUltimaNota(proyectoId),
  ]);

  const grupos = agruparPorDia(notas);
  const minutosTotales = sumarMinutos(notas);
  const hayFiltros = Boolean(busqueda) || periodo !== "todo";
  const rutaBitacora = `/proyectos/${proyectoId}/notas`;

  return (
    <>
      <TituloSeccion
        modulo="Bitácora"
        titulo={`Notas de ${proyecto.nombre}`}
        descripcion={
          busqueda
            ? `Resultados para "${busqueda}"`
            : `Entradas: ${ETIQUETA_PERIODO[periodo].toLowerCase()}`
        }
        accion={
          <>
            <BotonContinuar proyectoId={proyectoId} ultimaNotaId={ultima?.id} />
            <BotonEnlace href={`${rutaBitacora}/nueva`} variante="secundario">
              <Icono nombre="mas" tamano={16} />
              Nueva entrada
            </BotonEnlace>
          </>
        }
      />
      <div className="space-y-5">
        <div className="tarjeta flex flex-col gap-4 p-4 sm:p-6">
          <form
            method="get"
            role="search"
            aria-label="Buscar en la bitácora"
            className="flex flex-col gap-3 sm:flex-row sm:items-end"
          >
            {periodo !== "todo" ? <input type="hidden" name="periodo" value={periodo} /> : null}
            <div className="flex-1">
              <Entrada
                etiqueta="Buscar en las notas"
                name="busqueda"
                type="search"
                defaultValue={busqueda}
                placeholder="Palabra o frase"
              />
            </div>
            <div className="flex gap-2">
              <Boton type="submit" variante="secundario">
                <Icono nombre="busqueda" tamano={16} />
                Buscar
              </Boton>
              {hayFiltros ? (
                <BotonEnlace href={rutaBitacora} variante="fantasma">
                  Limpiar
                </BotonEnlace>
              ) : null}
            </div>
          </form>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <FiltroPeriodoNotas ruta={rutaBitacora} actual={periodo} parametros={{ busqueda }} />
            <p className="text-suave flex items-center gap-1.5 text-sm" aria-live="polite">
              <Icono nombre="reloj" tamano={16} />
              {notas.length} {notas.length === 1 ? "entrada" : "entradas"} ·{" "}
              {minutosTotales > 0
                ? `${formatearMinutos(minutosTotales)} invertidos`
                : "sin tiempo registrado"}
            </p>
          </div>
        </div>

        {grupos.size === 0 ? (
          <EstadoVacio
            icono="libreta"
            titulo={hayFiltros ? "Ninguna entrada coincide" : "Bitácora vacía"}
            descripcion={
              hayFiltros
                ? "Prueba con otra palabra, cambia el período o limpia los filtros."
                : "Este proyecto aún no tiene entradas en la bitácora."
            }
            accion={
              hayFiltros ? undefined : (
                <BotonEnlace href={`${rutaBitacora}/nueva`}>Nueva entrada</BotonEnlace>
              )
            }
          />
        ) : (
          [...grupos.entries()].map(([dia, notasDelDia]) => (
            <Tarjeta key={dia} titulo={formatFecha(dia)} className="[&_h2]:first-letter:uppercase">
              <ul className="lista-filas">
                {notasDelDia.map((nota) => (
                  <NotaFila
                    key={nota.id}
                    notaId={nota.id}
                    proyectoId={proyectoId}
                    texto={nota.texto}
                    proximoPaso={nota.proximoPaso}
                    minutos={nota.minutos}
                    actualizadoEn={nota.actualizadoEn}
                  />
                ))}
              </ul>
            </Tarjeta>
          ))
        )}
      </div>
    </>
  );
}
