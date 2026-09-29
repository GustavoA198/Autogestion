import { notFound } from "next/navigation";
import { listarProyectos } from "@/lib/proyectos/operaciones";
import { obtenerTarea } from "@/lib/tareas/operaciones";
import { accionEditarTarea } from "../../acciones";

// Carga la tarea y arma las propiedades del formulario de edición, compartidas por página y modal
export async function cargarEdicionTarea(id: string) {
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
    estado: tarea.estado,
    prioridad: tarea.prioridad,
    fechaInicio: tarea.fechaInicio ? tarea.fechaInicio.toISOString().split("T")[0] : "",
    fechaLimite: tarea.fechaLimite ? tarea.fechaLimite.toISOString().split("T")[0] : "",
    responsable: tarea.responsable ?? "",
    asignadoPor: tarea.asignadoPor ?? "",
  };

  return {
    nombre: tarea.titulo,
    propiedades: {
      accion: accionEditarTarea.bind(null, id),
      proyectos,
      valoresIniciales,
      editando: true,
      resumenSubtareas: {
        hechas: tarea.subtareas.filter((s) => s.hecho).length,
        total: tarea.subtareas.length,
      },
      rutaDetalle: `/tareas/${id}`,
      textoEnviar: "Guardar cambios",
      rutaCancelar: `/tareas/${id}`,
    },
  };
}
