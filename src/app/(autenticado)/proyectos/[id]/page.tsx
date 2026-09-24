import Link from "next/link";
import { notFound } from "next/navigation";
import { Tarjeta } from "@/componentes/shell/tarjeta";
import { TituloSeccion } from "@/componentes/shell/titulo-seccion";
import { resumirEliminacionProyecto as resumirCredenciales } from "@/lib/credenciales/operaciones";
import { resumirEliminacionProyecto as resumirContactos } from "@/lib/contactos/operaciones";
import { obtenerProyecto } from "@/lib/proyectos/operaciones";
import { EnlaceDocumentacion } from "../enlace-documentacion";
import { BotonEliminar } from "./boton-eliminar";
import { SeccionCredenciales } from "./seccion-credenciales";
import { SeccionContactos } from "./seccion-contactos";
import { SeccionNotas } from "./seccion-notas";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/proyectos/[id]">) {
  const { id } = await params;
  const proyecto = await obtenerProyecto(id);
  return { title: `${proyecto?.nombre ?? "Proyecto"} · Autogestion` };
}

export default async function FichaProyecto({ params }: PageProps<"/proyectos/[id]">) {
  const { id } = await params;
  const proyecto = await obtenerProyecto(id);
  if (!proyecto) notFound();
  const [resumenCredenciales, resumenContactos] = await Promise.all([
    resumirCredenciales(proyecto.id),
    resumirContactos(proyecto.id),
  ]);

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
            <BotonEliminar
              id={proyecto.id}
              nombre={proyecto.nombre}
              resumenCredenciales={resumenCredenciales}
              resumenContactos={resumenContactos}
            />
          </>
        }
      />
      <div className="space-y-6">
        <Tarjeta titulo="Documentacion">
          {proyecto.enlaceDocumentacion ? (
            <EnlaceDocumentacion url={proyecto.enlaceDocumentacion} />
          ) : (
            <p className="text-sm opacity-70">Este proyecto no tiene enlace de documentacion.</p>
          )}
        </Tarjeta>
        <SeccionNotas proyectoId={proyecto.id} />
        <div className="grid gap-6 md:grid-cols-2">
          <SeccionCredenciales proyectoId={proyecto.id} />
          <SeccionContactos proyectoId={proyecto.id} />
        </div>
      </div>
    </>
  );
}
