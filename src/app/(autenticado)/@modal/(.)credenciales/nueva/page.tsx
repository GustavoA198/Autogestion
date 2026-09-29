import { ModalRuta } from "@/componentes/modal-ruta";
import { FormularioNuevaCredencial } from "@/app/(autenticado)/credenciales/nueva/formulario-nueva";

// Intercepta /credenciales/nueva y la muestra como modal sobre la vista actual
export default function ModalNuevaCredencial() {
  return (
    <ModalRuta
      titulo="Nueva credencial"
      descripcion="El secreto se guarda cifrado y nunca se muestra en los listados."
    >
      <FormularioNuevaCredencial enModal />
    </ModalRuta>
  );
}
