import { ModalRuta } from "@/componentes/modal-ruta";
import { BotonEliminarTarea } from "@/app/(autenticado)/tareas/[id]/boton-eliminar";
import { FormularioTarea } from "@/app/(autenticado)/tareas/formulario-tarea";
import { cargarEdicionTarea } from "@/app/(autenticado)/tareas/[id]/editar/datos-edicion";

// Intercepta /tareas/[id]/editar y la muestra como modal sobre la vista actual
export default async function ModalEditarTarea({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { nombre, propiedades } = await cargarEdicionTarea(id);

  return (
    <ModalRuta titulo="Editar tarea" descripcion="Modifica los datos de la tarea.">
      <FormularioTarea
        {...propiedades}
        enModal
        zonaPeligro={<BotonEliminarTarea id={id} nombre={nombre} />}
      />
    </ModalRuta>
  );
}
