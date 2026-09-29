import { notFound } from "next/navigation";
import { BotonContinuar } from "@/componentes/boton-continuar";
import { BotonEnlace } from "@/componentes/enlace";
import { Icono } from "@/componentes/icono";
import { Tarjeta } from "@/componentes/shell/tarjeta";
import { TituloSeccion } from "@/componentes/shell/titulo-seccion";
import { resumirEliminacionProyecto as resumirCredenciales } from "@/lib/credenciales/operaciones";
import { resumirEliminacionProyecto as resumirContactos } from "@/lib/contactos/operaciones";
import { obtenerUltimaNota } from "@/lib/notas/operaciones";
import { obtenerProyecto } from "@/lib/proyectos/operaciones";
import { EnlaceDocumentacion } from "../enlace-documentacion";
import { BotonEliminarProyecto } from "./boton-eliminar";
import { SeccionCredenciales } from "./seccion-credenciales";
import { SeccionContactos } from "./seccion-contactos";
import { SeccionNotas } from "./seccion-notas";
import { SeccionTareas } from "./seccion-tareas";

export const dynamic = "force-dynamic";

export default async function FichaProyecto({ params }: PageProps<"/proyectos/[id]">) {
  const { id } = await params;
  const proyecto = await obtenerProyecto(id);
  if (!proyecto) notFound();
  const [resumenCredenciales, resumenContactos, ultimaNota] = await Promise.all([
    resumirCredenciales(proyecto.id),
    resumirContactos(proyecto.id),
    obtenerUltimaNota(proyecto.id),
  ]);

  return (
    <>
      <TituloSeccion
        modulo="Proyecto"
        titulo={proyecto.nombre}
        descripcion={proyecto.descripcion ?? undefined}
        accion={
          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap max-sm:[&>*]:w-full max-sm:[&>*:first-child]:col-span-2">
            <BotonContinuar proyectoId={proyecto.id} ultimaNotaId={ultimaNota?.id} />
            <BotonEnlace href={`/proyectos/${proyecto.id}/editar`} variante="secundario">
              <Icono nombre="editar" tamano={16} />
              Editar
            </BotonEnlace>
            <BotonEliminarProyecto
              id={proyecto.id}
              nombre={proyecto.nombre}
              resumenCredenciales={resumenCredenciales}
              resumenContactos={resumenContactos}
            />
          </div>
        }
      />
      <div className="space-y-5">
        <Tarjeta titulo="Documentación">
          {proyecto.enlaceDocumentacion ? (
            <EnlaceDocumentacion url={proyecto.enlaceDocumentacion} />
          ) : (
            <p className="text-suave text-sm">
              Este proyecto no tiene enlace de documentación. Puedes agregarlo desde Editar.
            </p>
          )}
        </Tarjeta>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <SeccionTareas proyectoId={proyecto.id} />
          <SeccionNotas proyectoId={proyecto.id} />
        </div>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <SeccionCredenciales proyectoId={proyecto.id} />
          <SeccionContactos proyectoId={proyecto.id} />
        </div>
      </div>
    </>
  );
}
