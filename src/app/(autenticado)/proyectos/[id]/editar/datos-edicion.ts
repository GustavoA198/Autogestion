import { notFound } from "next/navigation";
import { obtenerProyecto } from "@/lib/proyectos/operaciones";
import { accionEditarProyecto } from "../../acciones";

// Carga el proyecto y arma las propiedades del formulario de edición, compartidas por página y modal
export async function cargarEdicionProyecto(id: string) {
  const proyecto = await obtenerProyecto(id);
  if (!proyecto) notFound();

  return {
    nombre: proyecto.nombre,
    propiedades: {
      accion: accionEditarProyecto.bind(null, proyecto.id),
      valoresIniciales: {
        nombre: proyecto.nombre,
        descripcion: proyecto.descripcion ?? "",
        enlaceDocumentacion: proyecto.enlaceDocumentacion ?? "",
      },
      textoEnviar: "Guardar cambios",
      rutaCancelar: `/proyectos/${proyecto.id}`,
    },
  };
}
