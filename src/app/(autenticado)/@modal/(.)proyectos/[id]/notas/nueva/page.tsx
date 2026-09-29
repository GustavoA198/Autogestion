import { ModalRuta } from "@/componentes/modal-ruta";
import {
  FormularioNuevaNota,
  nombreProyectoNota,
} from "@/app/(autenticado)/proyectos/[id]/notas/nueva/formulario-nueva";

// Intercepta /proyectos/[id]/notas/nueva y la muestra como modal sobre la vista actual
export default async function ModalNuevaNota({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const nombre = await nombreProyectoNota(id);

  return (
    <ModalRuta titulo="Nueva entrada" descripcion={nombre}>
      <FormularioNuevaNota proyectoId={id} enModal />
    </ModalRuta>
  );
}
