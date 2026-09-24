import { notFound } from "next/navigation";
import { TituloSeccion } from "@/componentes/shell/titulo-seccion";
import { obtenerProyecto } from "@/lib/proyectos/operaciones";
import { accionEditarProyecto } from "../../acciones";
import { FormularioProyecto } from "../../formulario-proyecto";

export const metadata = { title: "Editar proyecto · Autogestión" };
export const dynamic = "force-dynamic";

export default async function EditarProyecto({ params }: PageProps<"/proyectos/[id]/editar">) {
  const { id } = await params;
  const proyecto = await obtenerProyecto(id);
  if (!proyecto) notFound();

  return (
    <>
      <TituloSeccion modulo="Proyectos" titulo={`Editar ${proyecto.nombre}`} />
      <FormularioProyecto
        accion={accionEditarProyecto.bind(null, proyecto.id)}
        valoresIniciales={{
          nombre: proyecto.nombre,
          descripcion: proyecto.descripcion ?? "",
          enlaceDocumentacion: proyecto.enlaceDocumentacion ?? "",
        }}
        textoEnviar="Guardar cambios"
        rutaCancelar={`/proyectos/${proyecto.id}`}
      />
    </>
  );
}
