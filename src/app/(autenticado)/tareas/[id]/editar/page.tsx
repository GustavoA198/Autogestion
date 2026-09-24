import { notFound } from "next/navigation";
import { TituloSeccion } from "@/componentes/shell/titulo-seccion";
import { listarProyectos } from "@/lib/proyectos/operaciones";
import { obtenerTarea } from "@/lib/tareas/operaciones";
import { FormularioTarea } from "../../formulario-tarea";
import { accionEditarTarea } from "../../acciones";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tarea = await obtenerTarea(id);
  return { title: `${tarea?.titulo ?? "Editar"} · Autogestión` };
}

export default async function EditarTarea({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [tarea, proyectos] = await Promise.all([obtenerTarea(id), listarProyectos()]);
  if (!tarea) notFound();

  const valoresIniciales = {
    titulo: tarea.titulo,
    descripcion: tarea.descripcion ?? "",
    tipoFrecuencia: tarea.tipoFrecuencia,
    diaSemana: tarea.diaSemana?.toString() ?? "",
    diaMes: tarea.diaMes?.toString() ?? "",
    fechaPuntual: tarea.fechaPuntual ? tarea.fechaPuntual.toISOString().split("T")[0] : "",
    proyectoId: tarea.proyectoId ?? "",
  };

  return (
    <>
      <TituloSeccion
        modulo="Autogestión"
        titulo="Editar tarea"
        descripcion="Modifica los datos de la tarea."
      />
      <FormularioTarea
        accion={accionEditarTarea.bind(null, id)}
        proyectos={proyectos}
        valoresIniciales={valoresIniciales}
        editando
        textoEnviar="Guardar cambios"
        rutaCancelar="/tareas"
      />
    </>
  );
}
