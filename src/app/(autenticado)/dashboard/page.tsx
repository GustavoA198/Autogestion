// Dashboard principal con bloques independientes.
// Cada bloque tolera fallos propios gracias a Promise.allSettled.

import Link from "next/link";
import { Metadata } from "next";
import { Tarjeta } from "@/componentes/shell/tarjeta";
import { TituloSeccion } from "@/componentes/shell/titulo-seccion";
import { EstadoVacio } from "@/componentes/estado-vacio";
import { EstadoError } from "@/componentes/estado-error";
import { ResumenEstadisticas } from "@/componentes/resumen-estadisticas";
import { BloqueTareas, BloqueTareasError } from "./dashboard-tareas-bloque";
import {
  cargarReunionesHoy,
  cargarTareasDelDia,
  cargarProyectosAccesos,
  cargarEstadisticas,
  cargarNotificaciones,
} from "./dashboard-data";

export const metadata: Metadata = { title: "Panel · Autogestión" };
export const dynamic = "force-dynamic";

function formatearHora(date: Date): string {
  return new Intl.DateTimeFormat("es-CO", { hour: "2-digit", minute: "2-digit" }).format(date);
}

async function BloqueReuniones() {
  const res = await cargarReunionesHoy();
  if (!res.ok) {
    return (
      <Tarjeta titulo="Reuniones de hoy">
        <EstadoError mensaje={res.error} />
      </Tarjeta>
    );
  }
  if (res.reuniones.length === 0) {
    return (
      <Tarjeta titulo="Reuniones de hoy">
        <EstadoVacio
          icono="calendario"
          titulo="Sin reuniones"
          descripcion="No hay reuniones registradas para hoy."
          accion={
            <Link href="/calendario" className="btn btn-ghost btn-sm">
              Ir al calendario
            </Link>
          }
        />
      </Tarjeta>
    );
  }
  return (
    <Tarjeta
      titulo="Reuniones de hoy"
      accion={
        <Link href="/calendario" className="btn btn-ghost btn-xs">
          Ver calendario
        </Link>
      }
    >
      <ul className="space-y-2">
        {res.reuniones.map((r) => (
          <li key={r.idExterno} className="flex items-start gap-3 text-sm">
            <span className="text-base-content/60 mt-0.5 shrink-0 font-mono text-xs">
              {formatearHora(r.inicio)}
            </span>
            <div className="flex min-w-0 flex-col">
              <span className="truncate font-medium">{r.titulo}</span>
              {r.enlaceReunion && (
                <a
                  href={r.enlaceReunion}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link link-primary text-xs"
                >
                  Unirse
                </a>
              )}
            </div>
          </li>
        ))}
      </ul>
    </Tarjeta>
  );
}

async function BloqueNotificaciones({ cantidad }: { cantidad: number }) {
  return (
    <Tarjeta titulo="Avisos pendientes">
      {cantidad === 0 ? (
        <p className="text-base-content/60 text-sm">No hay avisos pendientes.</p>
      ) : (
        <div className="flex items-center gap-2">
          <span className="badge badge-warning">{cantidad}</span>
          <span className="text-sm">
            aviso{cantidad !== 1 ? "s" : ""} pendiente{cantidad !== 1 ? "s" : ""}
          </span>
          <Link href="/notificaciones" className="btn btn-ghost btn-xs ml-auto">
            Ver
          </Link>
        </div>
      )}
    </Tarjeta>
  );
}

async function BloqueProyectos({ proyectos }: { proyectos: { id: string; nombre: string }[] }) {
  if (proyectos.length === 0) {
    return (
      <Tarjeta titulo="Accesos rápidos">
        <EstadoVacio
          icono="proyectos"
          titulo="Sin proyectos"
          descripcion="Crea un proyecto para ver accesos rápidos aquí."
          accion={
            <Link href="/proyectos/nuevo" className="btn btn-primary btn-sm">
              Nuevo proyecto
            </Link>
          }
        />
      </Tarjeta>
    );
  }
  return (
    <Tarjeta
      titulo="Proyectos"
      accion={
        <Link href="/proyectos" className="btn btn-ghost btn-xs">
          Ver todos
        </Link>
      }
    >
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {proyectos.map((p) => (
          <li key={p.id}>
            <Link
              href={`/proyectos/${p.id}`}
              className="rounded-btn bg-base-200 hover:bg-base-300 flex flex-col gap-1 p-3 transition-colors"
            >
              <span className="truncate text-sm font-medium">{p.nombre}</span>
              <div className="text-base-content/60 flex gap-3 text-xs">
                <span>credenciales</span>
                <span>·</span>
                <span>contactos</span>
                <span>·</span>
                <span>notas</span>
                <span>·</span>
                <span>tareas</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </Tarjeta>
  );
}

async function BloqueEstadisticas({
  datosSemana,
  datosProyecto,
  total,
}: {
  datosSemana: { semana: string; cantidad: number }[];
  datosProyecto: { proyectoId: string | null; nombre: string; cantidad: number }[];
  total: number;
}) {
  if (total === 0) {
    return (
      <Tarjeta titulo="Estadísticas">
        <EstadoVacio
          icono="grafica"
          titulo="Sin datos"
          descripcion="Completa tareas para ver estadísticas."
        />
      </Tarjeta>
    );
  }
  return (
    <Tarjeta titulo="Estadísticas (4 sem)">
      <ResumenEstadisticas
        datosSemana={datosSemana}
        datosProyecto={datosProyecto}
        total={total}
        periodoSemanas={4}
      />
    </Tarjeta>
  );
}

export default async function Dashboard() {
  const [resReuniones, resTareas, resProyectos, resEstadisticas, resNotificaciones] =
    await Promise.allSettled([
      cargarReunionesHoy(),
      cargarTareasDelDia(),
      cargarProyectosAccesos(),
      cargarEstadisticas(),
      cargarNotificaciones(),
    ]);

  // Helper para extraer error de un resultado, con narrowing correcto
  function obtenerError<T extends { ok: boolean; error?: string }>(
    res: PromiseSettledResult<T>,
    mensajeDefault: string,
  ): string | null {
    if (res.status === "rejected") return mensajeDefault;
    if (!res.value.ok) return res.value.error ?? mensajeDefault;
    return null;
  }

  // Extraer resultados de PromiseSettled
  const reuniones =
    resReuniones.status === "fulfilled" && resReuniones.value.ok
      ? resReuniones.value.reuniones
      : null;
  const reunionesError = obtenerError(resReuniones, "Error al cargar reuniones.");

  const tareas = resTareas.status === "fulfilled" && resTareas.value.ok ? resTareas.value : null;
  const tareasError = obtenerError(resTareas, "Error al cargar tareas.");

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

  return (
    <>
      <TituloSeccion
        modulo="Centro de mando"
        titulo="Panel del día"
        descripcion="Resumen del estado operativo: reuniones, tareas y accesos rápidos."
      />
      <div className="grid gap-6">
        {/* Fila 1: reuniones + tareas */}
        <div className="grid gap-6 md:grid-cols-2">
          {reunionesError ? (
            <Tarjeta titulo="Reuniones de hoy">
              <EstadoError
                mensaje={reunionesError}
                accion={
                  <Link href="/calendario" className="btn btn-ghost btn-sm">
                    Conectar calendario
                  </Link>
                }
              />
            </Tarjeta>
          ) : reuniones !== null ? (
            <BloqueReunionesWrapper reuniones={reuniones} />
          ) : (
            <Tarjeta titulo="Reuniones de hoy">
              <div className="skeleton h-16 w-full" />
            </Tarjeta>
          )}

          {tareasError ? (
            <BloqueTareasError mensaje={tareasError} />
          ) : tareas !== null ? (
            <BloqueTareas recurrentes={tareas.recurrentes} puntuales={tareas.puntuales} />
          ) : (
            <Tarjeta titulo="Tareas del día">
              <div className="skeleton h-16 w-full" />
            </Tarjeta>
          )}
        </div>

        {/* Fila 2: proyectos + estadisticas + notificaciones */}
        <div className="grid gap-6 lg:grid-cols-3">
          {proyectosError ? (
            <Tarjeta titulo="Proyectos">
              <EstadoError mensaje={proyectosError} />
            </Tarjeta>
          ) : proyectos !== null ? (
            <BloqueProyectos proyectos={proyectos} />
          ) : (
            <Tarjeta titulo="Proyectos">
              <div className="skeleton h-24 w-full" />
            </Tarjeta>
          )}

          {estadisticasError ? (
            <Tarjeta titulo="Estadísticas">
              <EstadoError mensaje={estadisticasError} />
            </Tarjeta>
          ) : estadisticas !== null ? (
            <BloqueEstadisticas
              datosSemana={estadisticas.datosSemana}
              datosProyecto={estadisticas.datosProyecto}
              total={estadisticas.total}
            />
          ) : (
            <Tarjeta titulo="Estadísticas">
              <div className="skeleton h-24 w-full" />
            </Tarjeta>
          )}

          <BloqueNotificaciones cantidad={notificaciones} />
        </div>
      </div>
    </>
  );
}

// Wrapper para que el bloque de reuniones funcione como async server component
async function BloqueReunionesWrapper({
  reuniones,
}: {
  reuniones: {
    idExterno: string;
    titulo: string;
    descripcion?: string;
    inicio: Date;
    fin: Date;
    enlaceReunion?: string;
  }[];
}) {
  if (reuniones.length === 0) {
    return (
      <Tarjeta titulo="Reuniones de hoy">
        <EstadoVacio
          icono="calendario"
          titulo="Sin reuniones"
          descripcion="No hay reuniones registradas para hoy."
          accion={
            <Link href="/calendario" className="btn btn-ghost btn-sm">
              Ir al calendario
            </Link>
          }
        />
      </Tarjeta>
    );
  }
  return (
    <Tarjeta
      titulo="Reuniones de hoy"
      accion={
        <Link href="/calendario" className="btn btn-ghost btn-xs">
          Ver calendario
        </Link>
      }
    >
      <ul className="space-y-2">
        {reuniones.map((r) => (
          <li key={r.idExterno} className="flex items-start gap-3 text-sm">
            <span className="text-base-content/60 mt-0.5 shrink-0 font-mono text-xs">
              {formatearHora(r.inicio)}
            </span>
            <div className="flex min-w-0 flex-col">
              <span className="truncate font-medium">{r.titulo}</span>
              {r.enlaceReunion && (
                <a
                  href={r.enlaceReunion}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link link-primary text-xs"
                >
                  Unirse
                </a>
              )}
            </div>
          </li>
        ))}
      </ul>
    </Tarjeta>
  );
}
