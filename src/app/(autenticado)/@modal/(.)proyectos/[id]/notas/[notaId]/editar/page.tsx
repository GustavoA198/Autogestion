import { ModalRuta } from "@/componentes/modal-ruta";
import { FormularioNota } from "@/app/(autenticado)/proyectos/[id]/notas/formulario-nota";
import { cargarEdicionNota } from "@/app/(autenticado)/proyectos/[id]/notas/[notaId]/editar/datos-edicion";

// Intercepta /proyectos/[id]/notas/[notaId]/editar y la muestra como modal sobre la vista actual
export default async function ModalEditarNota({
  params,
}: {
  params: Promise<{ id: string; notaId: string }>;
}) {
  const { id, notaId } = await params;
  const propiedades = await cargarEdicionNota(id, notaId);

  return (
    <ModalRuta titulo="Editar entrada" descripcion="Modifica lo que registraste en la bitácora.">
      <FormularioNota {...propiedades} enModal />
    </ModalRuta>
  );
}
