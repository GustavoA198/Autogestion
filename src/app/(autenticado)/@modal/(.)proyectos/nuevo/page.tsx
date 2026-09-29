import { ModalRuta } from "@/componentes/modal-ruta";
import { FormularioNuevoProyecto } from "@/app/(autenticado)/proyectos/nuevo/formulario-nuevo";

// Intercepta /proyectos/nuevo y la muestra como modal sobre la vista actual
export default function ModalNuevoProyecto() {
  return (
    <ModalRuta
      titulo="Nuevo proyecto"
      descripcion="Solo el nombre es obligatorio; la documentación se guarda como enlace."
    >
      <FormularioNuevoProyecto enModal />
    </ModalRuta>
  );
}
