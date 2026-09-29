import { ModalRuta } from "@/componentes/modal-ruta";
import { FormularioContacto } from "@/app/(autenticado)/contactos/formulario-contacto";
import { cargarEdicionContacto } from "@/app/(autenticado)/contactos/[id]/editar/datos-edicion";

// Intercepta /contactos/[id]/editar y la muestra como modal sobre la vista actual
export default async function ModalEditarContacto({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { nombre, propiedades } = await cargarEdicionContacto(id);

  return (
    <ModalRuta titulo="Editar contacto" descripcion={nombre}>
      <FormularioContacto {...propiedades} enModal />
    </ModalRuta>
  );
}
