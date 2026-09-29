import { ModalRuta } from "@/componentes/modal-ruta";
import { FormularioNuevaTarea } from "@/app/(autenticado)/tareas/nueva/formulario-nueva";

// Intercepta /tareas/nueva y la muestra como modal sobre la vista actual
export default async function ModalNuevaTarea({ searchParams }: PageProps<"/tareas/nueva">) {
  const consulta = await searchParams;

  return (
    <ModalRuta
      titulo="Nueva tarea"
      descripcion="Diaria, semanal, mensual o puntual, con estado, fechas y subtareas."
    >
      <FormularioNuevaTarea consulta={consulta} enModal />
    </ModalRuta>
  );
}
