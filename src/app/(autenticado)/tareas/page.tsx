import Link from "next/link";
import { EstadoVacio } from "@/componentes/estado-vacio";
import { Tarjeta } from "@/componentes/shell/tarjeta";
import { TituloSeccion } from "@/componentes/shell/titulo-seccion";
import { listarTareas } from "@/lib/tareas/operaciones";
import { leerEntornoTiempo } from "@/lib/tareas/tiempo";
import { correspondeHoy } from "@/lib/tareas/recurrencia";
import { TareaFila } from "./tarea-fila";

export const dynamic = "force-dynamic";

export const metadata = { title: "Tareas · Autogestión" };

export default async function Tareas({ searchParams }: PageProps<"/tareas">) {
  const consulta = await searchParams;
  const vista = consulta.vista === "todas" ? "todas" : "hoy";
  const { TZ } = leerEntornoTiempo();
  const ahora = new Date();

  const todasLasTareas = await listarTareas();

  const tareasDeHoy = todasLasTareas.filter((t) =>
    correspondeHoy(
      {
        tipoFrecuencia: t.tipoFrecuencia,
        diaSemana: t.diaSemana,
        diaMes: t.diaMes,
        fechaPuntual: t.fechaPuntual,
      },
      ahora,
      TZ,
    ),
  );

  const recurrentesHoy = tareasDeHoy.filter((t) => t.tipoFrecuencia !== "PUNTUAL");
  const puntualesHoy = tareasDeHoy.filter((t) => t.tipoFrecuencia === "PUNTUAL");

  const botonCrear = (
    <Link href="/tareas/nueva" className="btn btn-primary">
      Nueva tarea
    </Link>
  );

  return (
    <>
      <TituloSeccion
        modulo="Autogestión"
        titulo="Tareas"
        descripcion="Tareas recurrentes y puntuales. Filtra por hoy o consulta el listado completo."
        accion={botonCrear}
      />

      <div className="mb-4 flex gap-2">
        <Link
          href="/tareas?vista=hoy"
          className={`btn btn-sm ${vista === "hoy" ? "btn-primary" : "btn-outline"}`}
        >
          Hoy
        </Link>
        <Link
          href="/tareas?vista=todas"
          className={`btn btn-sm ${vista === "todas" ? "btn-primary" : "btn-outline"}`}
        >
          Todas
        </Link>
      </div>

      {vista === "hoy" && (
        <div className="space-y-6">
          {tareasDeHoy.length === 0 ? (
            <EstadoVacio
              icono="lista"
              titulo="No hay tareas para hoy"
              descripcion="Crea una tarea diaria, semanal o mensual, o una tarea puntual para hoy."
              accion={botonCrear}
            />
          ) : (
            <>
              {recurrentesHoy.length > 0 && (
                <Tarjeta titulo="Recurrentes de hoy">
                  <ul className="divide-base-300 divide-y">
                    {recurrentesHoy.map((tarea) => (
                      <TareaFila key={tarea.id} tarea={tarea} marcable />
                    ))}
                  </ul>
                </Tarjeta>
              )}
              {puntualesHoy.length > 0 && (
                <Tarjeta titulo="Puntuales de hoy">
                  <ul className="divide-base-300 divide-y">
                    {puntualesHoy.map((tarea) => (
                      <TareaFila key={tarea.id} tarea={tarea} marcable />
                    ))}
                  </ul>
                </Tarjeta>
              )}
            </>
          )}
        </div>
      )}

      {vista === "todas" && (
        <div className="space-y-4">
          {todasLasTareas.length === 0 ? (
            <EstadoVacio
              icono="lista"
              titulo="No hay tareas todavía"
              descripcion="Crea tu primera tarea para empezar a organizar tu trabajo."
              accion={botonCrear}
            />
          ) : (
            <Tarjeta
              titulo={`${todasLasTareas.length} tarea${todasLasTareas.length !== 1 ? "s" : ""}`}
            >
              <ul className="divide-base-300 divide-y">
                {todasLasTareas.map((tarea) => (
                  <TareaFila key={tarea.id} tarea={tarea} />
                ))}
              </ul>
            </Tarjeta>
          )}
        </div>
      )}
    </>
  );
}
