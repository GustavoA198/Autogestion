import { ModalRuta } from "@/componentes/modal-ruta";
import { FormularioProyecto } from "@/app/(autenticado)/proyectos/formulario-proyecto";
import { cargarEdicionProyecto } from "@/app/(autenticado)/proyectos/[id]/editar/datos-edicion";

// Intercepta /proyectos/[id]/editar y la muestra como modal sobre la vista actual
export default async function ModalEditarProyecto({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { nombre, propiedades } = await cargarEdicionProyecto(id);

  return (
    <ModalRuta titulo="Editar proyecto" descripcion={nombre}>
      <FormularioProyecto {...propiedades} enModal />
    </ModalRuta>
  );
}
