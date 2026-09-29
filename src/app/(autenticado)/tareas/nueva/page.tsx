import { TituloSeccion } from "@/componentes/shell/titulo-seccion";
import { FormularioNuevaTarea } from "./formulario-nueva";

export default async function NuevaTarea({ searchParams }: PageProps<"/tareas/nueva">) {
  const consulta = await searchParams;

  return (
    <>
      <TituloSeccion
        modulo="Autogestión"
        titulo="Nueva tarea"
        descripcion="Crea una tarea diaria, semanal, mensual o puntual, con estado, fechas y subtareas."
      />
      <FormularioNuevaTarea consulta={consulta} />
    </>
  );
}
