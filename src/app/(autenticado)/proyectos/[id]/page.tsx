import Link from "next/link";
import { notFound } from "next/navigation";
import { Tarjeta } from "@/componentes/shell/tarjeta";
import { TituloSeccion } from "@/componentes/shell/titulo-seccion";
import { obtenerProyecto } from "@/lib/proyectos/operaciones";
import { EnlaceDocumentacion } from "../enlace-documentacion";
import { BotonEliminar } from "./boton-eliminar";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/proyectos/[id]">) {
  const { id } = await params;
  const proyecto = await obtenerProyecto(id);
  return { title: `${proyecto?.nombre ?? "Proyecto"} · Autogestión` };
}

// Cada sección mostrará solo lo asociado a este proyecto cuando existan sus módulos
const SECCIONES = [
  { titulo: "Credenciales", vacio: "Este proyecto aún no tiene credenciales asociadas." },
  { titulo: "Contactos", vacio: "Este proyecto aún no tiene contactos asociados." },
  { titulo: "Tareas y reuniones", vacio: "Este proyecto aún no tiene tareas ni reuniones." },
  { titulo: "Notas", vacio: "Este proyecto aún no tiene notas." },
];

export default async function FichaProyecto({ params }: PageProps<"/proyectos/[id]">) {
  const { id } = await params;
  const proyecto = await obtenerProyecto(id);
  if (!proyecto) notFound();

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
            <BotonEliminar id={proyecto.id} nombre={proyecto.nombre} />
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
