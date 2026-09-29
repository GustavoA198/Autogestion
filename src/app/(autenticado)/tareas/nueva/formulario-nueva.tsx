import { listarProyectos } from "@/lib/proyectos/operaciones";
import { fechaDeTexto } from "@/lib/tareas/pendientes";
import { FormularioTarea } from "../formulario-tarea";
import { accionCrearTarea } from "../acciones";

type Consulta = Record<string, string | string[] | undefined>;

// Toma el primer valor de un parámetro de la URL
function texto(valor: string | string[] | undefined): string {
  return (Array.isArray(valor) ? valor[0] : valor) ?? "";
}

// Formulario de creación compartido por la página completa y el modal interceptado
export async function FormularioNuevaTarea({
  consulta,
  enModal = false,
}: {
  consulta: Consulta;
  enModal?: boolean;
}) {
  const proyectos = await listarProyectos();

  // Con una fecha válida (viene del calendario) la tarea nace puntual para ese día
  const fecha = texto(consulta.fecha);
  const conFecha = fechaDeTexto(fecha) !== null;
  const volver = texto(consulta.volver) === "calendario" ? "calendario" : undefined;

  return (
    <FormularioTarea
      accion={accionCrearTarea}
      proyectos={proyectos}
      fechaInicial={conFecha ? fecha : undefined}
      textoEnviar="Crear tarea"
      rutaCancelar={volver ? "/calendario" : "/tareas"}
      volver={volver}
      enModal={enModal}
    />
  );
}
