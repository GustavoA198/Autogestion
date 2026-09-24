import { TituloSeccion } from "@/componentes/shell/titulo-seccion";
import { listarProyectos } from "@/lib/proyectos/operaciones";
import { FormularioTarea } from "../formulario-tarea";
import { accionCrearTarea } from "../acciones";

export const metadata = { title: "Nueva tarea · Autogestión" };

export default async function NuevaTarea() {
  const proyectos = await listarProyectos();

  return (
    <>
      <TituloSeccion
        modulo="Autogestión"
        titulo="Nueva tarea"
        descripcion="Crea una tarea diaria, semanal, mensual o puntual."
      />
      <FormularioTarea
        accion={accionCrearTarea}
        proyectos={proyectos}
        textoEnviar="Crear tarea"
        rutaCancelar="/tareas"
      />
    </>
  );
}
