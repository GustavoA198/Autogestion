import { ModalRuta } from "@/componentes/modal-ruta";
import { FormularioNuevoContacto } from "@/app/(autenticado)/contactos/nueva/formulario-nuevo";

// Intercepta /contactos/nueva y la muestra como modal sobre la vista actual
export default function ModalNuevoContacto() {
  return (
    <ModalRuta
      titulo="Nuevo contacto"
      descripcion="Cómo encontrar a la persona y en qué proyectos aparece."
    >
      <FormularioNuevoContacto enModal />
    </ModalRuta>
  );
}
