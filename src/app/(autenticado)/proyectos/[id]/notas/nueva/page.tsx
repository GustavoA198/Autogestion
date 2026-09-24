import { notFound } from "next/navigation";
import { TituloSeccion } from "@/componentes/shell/titulo-seccion";
import { obtenerProyecto } from "@/lib/proyectos/operaciones";
import { FormularioNota } from "../formulario-nota";
import { accionCrearNota } from "../acciones";

export const metadata = { title: "Nueva entrada · Autogestión" };

export default async function NuevaNota({ params }: PageProps<"/proyectos/[id]/notas/nueva">) {
  const { id: proyectoId } = await params;
  const proyecto = await obtenerProyecto(proyectoId);
  if (!proyecto) notFound();

  return (
    <>
      <TituloSeccion modulo="Bitácora" titulo="Nueva entrada" descripcion={proyecto.nombre} />
      <FormularioNota
        accion={accionCrearNota}
        textoEnviar="Crear entrada"
        rutaCancelar={`/proyectos/${proyectoId}`}
      />
    </>
  );
}
