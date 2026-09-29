import { TituloSeccion } from "@/componentes/shell/titulo-seccion";
import { FormularioProyecto } from "../../formulario-proyecto";
import { cargarEdicionProyecto } from "./datos-edicion";

export const dynamic = "force-dynamic";

export default async function EditarProyecto({ params }: PageProps<"/proyectos/[id]/editar">) {
  const { id } = await params;
  const { nombre, propiedades } = await cargarEdicionProyecto(id);

  return (
    <>
      <TituloSeccion modulo="Proyectos" titulo={`Editar ${nombre}`} />
      <FormularioProyecto {...propiedades} />
    </>
  );
}
