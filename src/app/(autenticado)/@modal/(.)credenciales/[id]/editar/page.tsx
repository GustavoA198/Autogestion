import { ModalRuta } from "@/componentes/modal-ruta";
import { FormularioCredencial } from "@/app/(autenticado)/credenciales/formulario-credencial";
import { cargarEdicionCredencial } from "@/app/(autenticado)/credenciales/[id]/editar/datos-edicion";

// Intercepta /credenciales/[id]/editar y la muestra como modal sobre la vista actual
export default async function ModalEditarCredencial({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { nombre, propiedades } = await cargarEdicionCredencial(id);

  return (
    <ModalRuta titulo="Editar credencial" descripcion={nombre}>
      <FormularioCredencial {...propiedades} enModal />
    </ModalRuta>
  );
}
