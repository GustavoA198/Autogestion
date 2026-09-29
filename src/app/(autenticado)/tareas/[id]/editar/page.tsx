import { TituloSeccion } from "@/componentes/shell/titulo-seccion";
import { BotonEliminarTarea } from "../boton-eliminar";
import { FormularioTarea } from "../../formulario-tarea";
import { cargarEdicionTarea } from "./datos-edicion";

export default async function EditarTarea({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { nombre, propiedades } = await cargarEdicionTarea(id);

  return (
    <>
      <TituloSeccion
        modulo="Autogestión"
        titulo="Editar tarea"
        descripcion="Modifica los datos de la tarea."
        accion={<BotonEliminarTarea id={id} nombre={nombre} />}
      />
      <FormularioTarea {...propiedades} />
    </>
  );
}
