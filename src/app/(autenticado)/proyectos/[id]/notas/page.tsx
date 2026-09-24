import Link from "next/link";
import { notFound } from "next/navigation";
import { Tarjeta } from "@/componentes/shell/tarjeta";
import { TituloSeccion } from "@/componentes/shell/titulo-seccion";
import { buscarNotasEnProyecto, listarNotasDeProyecto } from "@/lib/notas/operaciones";
import { obtenerProyecto } from "@/lib/proyectos/operaciones";
import { NotaFila } from "./nota-fila";

export const dynamic = "force-dynamic";

function agruparPorDia(
  notas: { id: string; fecha: Date; texto: string; actualizadoEn: Date; proyectoId: string }[],
) {
  const grupos = new Map<string, typeof notas>();
  for (const nota of notas) {
    const clave = nota.fecha.toISOString().split("T")[0];
    if (!grupos.has(clave)) grupos.set(clave, []);
    grupos.get(clave)!.push(nota);
  }
  return grupos;
}

function formatFecha(iso: string): string {
  const fecha = new Date(iso + "T12:00:00");
  return fecha.toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function primero(valor: string | string[] | undefined): string | undefined {
  const texto = Array.isArray(valor) ? valor[0] : valor;
  return texto || undefined;
}

export async function generateMetadata({ params }: PageProps<"/proyectos/[id]/notas">) {
  const { id } = await params;
  const proyecto = await obtenerProyecto(id);
  return { title: `${proyecto?.nombre ?? "Proyecto"} · Bitácora · Autogestión` };
}

export default async function NotasProyecto({
  params,
  searchParams,
}: PageProps<"/proyectos/[id]/notas">) {
  const { id: proyectoId } = await params;
  const consulta = await searchParams;
  const busqueda = primero(consulta.busqueda);

  const proyecto = await obtenerProyecto(proyectoId);
  if (!proyecto) notFound();

  const notas = busqueda
    ? buscarNotasEnProyecto(proyectoId, busqueda)
    : listarNotasDeProyecto(proyectoId);

  const grupos = agruparPorDia(await notas);

  return (
    <>
      <TituloSeccion
        modulo="Bitácora"
        titulo={`Notas de ${proyecto.nombre}`}
        descripcion={busqueda ? `Resultados para "${busqueda}"` : "Todas las entradas"}
        accion={
          <Link href={`/proyectos/${proyectoId}/notas/nueva`} className="btn btn-primary">
            Nueva entrada
          </Link>
        }
      />
      <div className="space-y-6">
        <form method="get" className="flex max-w-sm gap-2">
          <input
            name="busqueda"
            type="search"
            placeholder="Buscar en notas..."
            defaultValue={busqueda}
            className="input input-bordered flex-1"
          />
          <button type="submit" className="btn btn-outline">
            Buscar
          </button>
          {busqueda ? (
            <Link href={`/proyectos/${proyectoId}/notas`} className="btn btn-ghost">
              Limpiar
            </Link>
          ) : null}
        </form>

        {grupos.size === 0 ? (
          <Tarjeta titulo="Bitácora">
            <p className="text-sm opacity-70">
              {busqueda
                ? "Ninguna entrada coincide con la búsqueda."
                : "Este proyecto aún no tiene entradas en la bitácora."}
            </p>
          </Tarjeta>
        ) : (
          [...grupos.entries()].map(([dia, notasDelDia]) => (
            <Tarjeta key={dia} titulo={formatFecha(dia)}>
              <ul className="divide-base-300 divide-y">
                {notasDelDia.map((nota) => (
                  <NotaFila
                    key={nota.id}
                    notaId={nota.id}
                    proyectoId={proyectoId}
                    texto={nota.texto}
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
