import Link from "next/link";
import { notFound } from "next/navigation";
import { Tarjeta } from "@/componentes/shell/tarjeta";
import { TituloSeccion } from "@/componentes/shell/titulo-seccion";
import { resumirEliminacionProyecto } from "@/lib/credenciales/operaciones";
import { obtenerProyecto } from "@/lib/proyectos/operaciones";
import { EnlaceDocumentacion } from "../enlace-documentacion";
import { BotonEliminar } from "./boton-eliminar";
import { SeccionCredenciales } from "./seccion-credenciales";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/proyectos/[id]">) {
  const { id } = await params;
  const proyecto = await obtenerProyecto(id);
  return { title: `${proyecto?.nombre ?? "Proyecto"} · Autogestión` };
}

// Marcadores hasta que existan sus módulos; cada uno mostrará solo lo asociado a este proyecto
const SECCIONES = [
  { titulo: "Contactos", vacio: "Este proyecto aún no tiene contactos asociados." },
  { titulo: "Tareas y reuniones", vacio: "Este proyecto aún no tiene tareas ni reuniones." },
  { titulo: "Notas", vacio: "Este proyecto aún no tiene notas." },
];

export default async function FichaProyecto({ params }: PageProps<"/proyectos/[id]">) {
  const { id } = await params;
  const proyecto = await obtenerProyecto(id);
  if (!proyecto) notFound();
  const resumen = await resumirEliminacionProyecto(proyecto.id);

  return (
    <>
      <TituloSeccion
        modulo="Proyecto"
        titulo={proyecto.nombre}
        descripcion={proyecto.descripcion ?? undefined}
        accion={
          <>
            <Link href={`/proyectos/${proyecto.id}/editar`} className="btn btn-outline">
              Editar
            </Link>
            <BotonEliminar id={proyecto.id} nombre={proyecto.nombre} resumen={resumen} />
          </>
        }
      />
      <div className="space-y-6">
        <Tarjeta titulo="Documentación">
          {proyecto.enlaceDocumentacion ? (
            <EnlaceDocumentacion url={proyecto.enlaceDocumentacion} />
          ) : (
            <p className="text-sm opacity-70">Este proyecto no tiene enlace de documentación.</p>
          )}
        </Tarjeta>
        <div className="grid gap-6 md:grid-cols-2">
          <SeccionCredenciales proyectoId={proyecto.id} />
          {SECCIONES.map((seccion) => (
            <Tarjeta key={seccion.titulo} titulo={seccion.titulo}>
              <p className="text-sm opacity-70">{seccion.vacio}</p>
            </Tarjeta>
          ))}
        </div>
      </div>
    </>
  );
}
