// Panel principal con bloques independientes que toleran fallos propios (Promise.allSettled).

import { EstadoError } from "@/componentes/estado-error";
import { EstadoVacio } from "@/componentes/estado-vacio";
import { BotonEnlace, Enlace } from "@/componentes/enlace";
import { GraficaBarras } from "@/componentes/grafica-barras";
import { Icono } from "@/componentes/icono";
import { barrasPorSemana } from "@/componentes/resumen-estadisticas";
import { Tarjeta } from "@/componentes/shell/tarjeta";
import { TarjetaKpi } from "@/componentes/shell/tarjeta-kpi";
import { TituloSeccion } from "@/componentes/shell/titulo-seccion";
import { BloqueRetoma, FranjaSinAvance } from "./dashboard-bitacora";
import { BloquePendientes } from "./dashboard-pendientes";
import { BloqueReuniones } from "./dashboard-reuniones";
import { BloqueTareas, BloqueTareasError } from "./dashboard-tareas-bloque";
import { BloqueVencenPronto } from "./dashboard-vencen-pronto";
import {
  cargarReunionesHoy,
  cargarTareasDelDia,
  cargarTareasVencenPronto,
  cargarProyectosAccesos,
  cargarEstadisticas,
  cargarNotificaciones,
  cargarPendientes,
  cargarProyectosSinAvance,
  cargarUltimaBitacora,
} from "./dashboard-data";

export const dynamic = "force-dynamic";

function BloqueProyectos({ proyectos }: { proyectos: { id: string; nombre: string }[] }) {
  if (proyectos.length === 0) {
    return (
      <Tarjeta titulo="Proyectos">
        <EstadoVacio
          icono="proyectos"
          titulo="Aún no hay proyectos"
          descripcion="Crea un proyecto para tener sus accesos rápidos aquí."
          accion={<BotonEnlace href="/proyectos/nuevo">Nuevo proyecto</BotonEnlace>}
        />
      </Tarjeta>
    );
  }
  return (
    <Tarjeta
      titulo="Proyectos"
      accion={
        <Enlace href="/proyectos" className="text-sm">
          Ver todos
        </Enlace>
      }
    >
      <div className="@container">
        <ul className="grid grid-cols-1 gap-3 @lg:grid-cols-2 @3xl:grid-cols-3">
          {proyectos.map((p) => (
            <li key={p.id} className="min-w-0">
              <Enlace
                href={`/proyectos/${p.id}`}
                discreto
                title={p.nombre}
                className="tarjeta-fila flex min-h-14 cursor-pointer items-center gap-3 px-4 py-3"
              >
                <span className="bg-primary/15 text-primary grid size-9 shrink-0 place-items-center rounded-full">
                  <Icono nombre="proyectos" tamano={16} />
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-bold" title={p.nombre}>
                  {p.nombre}
                </span>
                <Icono nombre="chevron-derecha" tamano={16} className="text-tenue" />
              </Enlace>
            </li>
          ))}
        </ul>
      </div>
    </Tarjeta>
  );
}

function BloqueEstadisticas({
  datosSemana,
  total,
}: {
  datosSemana: { semana: string; cantidad: number }[];
  total: number;
}) {
  return (
    <Tarjeta
      titulo="Ritmo de las últimas 4 semanas"
      accion={
        <Enlace href="/estadisticas" className="text-sm">
          Ver más
        </Enlace>
      }
    >
      {total === 0 ? (
        <EstadoVacio
          icono="grafica"
          titulo="Sin datos todavía"
          descripcion="Completa tareas y aquí verás tu ritmo semanal."
        />
      ) : (
        <GraficaBarras
          datos={barrasPorSemana(datosSemana)}
          titulo="Tareas completadas por semana"
          altoMaximo={140}
        />
      )}
    </Tarjeta>
  );
}

// Aviso destacado cuando hay recordatorios sin atender
function FranjaAvisos({ cantidad }: { cantidad: number }) {
  if (cantidad === 0) return null;
  return (
    <div className="border-warning/30 bg-warning/8 mb-6 flex flex-wrap items-center gap-3 rounded-2xl border px-4 py-3 text-sm">
      <Icono nombre="campana" tamano={18} className="text-warning shrink-0" />
      <p className="min-w-0 flex-1">
        Tienes <strong>{cantidad}</strong> aviso{cantidad !== 1 ? "s" : ""} pendiente
        {cantidad !== 1 ? "s" : ""}.
      </p>
      <Enlace href="/notificaciones">Revisar avisos</Enlace>
    </div>
  );
}

// Extrae el mensaje de error de un resultado, con narrowing correcto
function obtenerError<T extends { ok: boolean; error?: string }>(
  res: PromiseSettledResult<T>,
  mensajeDefault: string,
): string | null {
  if (res.status === "rejected") return mensajeDefault;
  if (!res.value.ok) return res.value.error ?? mensajeDefault;
  return null;
}

export default async function Dashboard() {
  const [
    resReuniones,
    resTareas,
    resVencen,
    resProyectos,
    resEstadisticas,
    resNotificaciones,
    resBitacora,
    resSinAvance,
    resPendientes,
  ] = await Promise.allSettled([
    cargarReunionesHoy(),
    cargarTareasDelDia(),
    cargarTareasVencenPronto(),
    cargarProyectosAccesos(),
    cargarEstadisticas(),
    cargarNotificaciones(),
    cargarUltimaBitacora(),
    cargarProyectosSinAvance(),
    cargarPendientes(),
  ]);

  const reuniones =
    resReuniones.status === "fulfilled" && resReuniones.value.ok
      ? resReuniones.value.reuniones
      : null;
  const reunionesError = obtenerError(resReuniones, "Error al cargar reuniones.");

  const tareas = resTareas.status === "fulfilled" && resTareas.value.ok ? resTareas.value : null;
  const tareasError = obtenerError(resTareas, "Error al cargar tareas.");

  const vencen = resVencen.status === "fulfilled" ? resVencen.value : null;

  const proyectos =
    resProyectos.status === "fulfilled" && resProyectos.value.ok
      ? resProyectos.value.proyectos
      : null;
  const proyectosError = obtenerError(resProyectos, "Error al cargar proyectos.");

  const estadisticas =
    resEstadisticas.status === "fulfilled" && resEstadisticas.value.ok
      ? resEstadisticas.value
      : null;
  const estadisticasError = obtenerError(resEstadisticas, "Error al cargar estadísticas.");

  const notificaciones =
    resNotificaciones.status === "fulfilled" && resNotificaciones.value.ok
      ? resNotificaciones.value.cantidad
      : 0;
  const urgentes =
    resNotificaciones.status === "fulfilled" && resNotificaciones.value.ok
      ? resNotificaciones.value.urgentes
      : 0;

  const bitacora = resBitacora.status === "fulfilled" ? resBitacora.value : null;
  const sinAvance = resSinAvance.status === "fulfilled" ? resSinAvance.value : null;
  const pendientes = resPendientes.status === "fulfilled" ? resPendientes.value : null;

  const totalTareasHoy = tareas ? tareas.recurrentes.length + tareas.puntuales.length : 0;
  const vencenOk = vencen?.ok ? vencen : null;

  return (
    <>
      <TituloSeccion
        modulo="Panel"
        titulo="Tu día de un vistazo"
        descripcion="Agenda, tareas y avisos para arrancar la jornada sin buscar nada."
        accion={
          <BotonEnlace href="/tareas/nueva" variante="secundario">
            <Icono nombre="mas" tamano={16} />
            Nueva tarea
          </BotonEnlace>
        }
      />
      <FranjaAvisos cantidad={notificaciones} />
      <FranjaSinAvance resultado={sinAvance} />
      <div className="mb-6">
        <BloqueRetoma resultado={bitacora} />
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-4">
        <TarjetaKpi
          etiqueta="Tareas para hoy"
          valor={tareas ? String(totalTareasHoy) : "—"}
          icono="lista"
          detalle={
            tareas
              ? `${tareas.recurrentes.length} ${tareas.recurrentes.length === 1 ? "fija" : "fijas"} · ${tareas.puntuales.length} ${tareas.puntuales.length === 1 ? "puntual" : "puntuales"}`
              : undefined
          }
          tonoDetalle="info"
          tono="info"
        />
        <TarjetaKpi
          etiqueta="Vencen en 5 días o menos"
          valor={vencenOk ? String(vencenOk.proximas) : "—"}
          icono="reloj"
          detalle={
            vencenOk
              ? vencenOk.vencidas > 0
                ? `${vencenOk.vencidas} ${vencenOk.vencidas === 1 ? "vencida" : "vencidas"}`
                : "Ninguna vencida"
              : undefined
          }
          tonoDetalle={vencenOk && vencenOk.vencidas > 0 ? "error" : "success"}
          tono={vencenOk && vencenOk.vencidas > 0 ? "error" : "warning"}
        />
        <TarjetaKpi
          etiqueta="Avisos pendientes"
          valor={String(notificaciones)}
          icono="campana"
          detalle={
            urgentes > 0
              ? `${urgentes} ${urgentes === 1 ? "urgente" : "urgentes"}`
              : notificaciones > 0
                ? "Requieren atención"
                : "Todo al día"
          }
          tonoDetalle={urgentes > 0 ? "error" : notificaciones > 0 ? "warning" : "success"}
          tono={urgentes > 0 ? "error" : notificaciones > 0 ? "warning" : "success"}
        />
        <TarjetaKpi
          etiqueta="Completadas (4 sem)"
          valor={estadisticas ? String(estadisticas.total) : "—"}
          icono="check-circulo"
          detalle="Tareas terminadas"
          tonoDetalle="success"
          tono="success"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3 [&>*]:min-w-0">
        <div className="min-w-0 xl:col-span-2">
          <BloqueReuniones reuniones={reuniones} error={reunionesError} />
        </div>
        {tareasError ? (
          <BloqueTareasError mensaje={tareasError} />
        ) : tareas ? (
          <BloqueTareas recurrentes={tareas.recurrentes} puntuales={tareas.puntuales} />
        ) : null}

        <div className="min-w-0 xl:col-span-2">
          <BloqueVencenPronto resultado={vencen} />
        </div>
        <div className="min-w-0">
          <BloquePendientes resultado={pendientes} />
        </div>

        <div className="min-w-0 xl:col-span-2">
          {proyectosError ? (
            <Tarjeta titulo="Proyectos">
              <EstadoError mensaje={proyectosError} />
            </Tarjeta>
          ) : proyectos ? (
            <BloqueProyectos proyectos={proyectos} />
          ) : null}
        </div>
        {estadisticasError ? (
          <Tarjeta titulo="Estadísticas">
            <EstadoError mensaje={estadisticasError} />
          </Tarjeta>
        ) : estadisticas ? (
          <BloqueEstadisticas datosSemana={estadisticas.datosSemana} total={estadisticas.total} />
        ) : null}
      </div>
    </>
  );
}
