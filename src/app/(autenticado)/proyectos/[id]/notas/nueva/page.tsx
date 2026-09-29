import { TituloSeccion } from "@/componentes/shell/titulo-seccion";
import { FormularioNuevaNota, nombreProyectoNota } from "./formulario-nueva";

export const dynamic = "force-dynamic";

export default async function NuevaNota({ params }: PageProps<"/proyectos/[id]/notas/nueva">) {
  const { id: proyectoId } = await params;
  const nombre = await nombreProyectoNota(proyectoId);

  return (
    <>
      <TituloSeccion modulo="Bitácora" titulo="Nueva entrada" descripcion={nombre} />
      <FormularioNuevaNota proyectoId={proyectoId} />
    </>
  );
}
