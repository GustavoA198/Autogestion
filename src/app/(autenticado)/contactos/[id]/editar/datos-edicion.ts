import { notFound } from "next/navigation";
import { obtenerContacto } from "@/lib/contactos/operaciones";
import { listarProyectos } from "@/lib/proyectos/operaciones";
import { accionEditarContacto } from "../../acciones";

// Carga el contacto y arma las propiedades del formulario de edición, compartidas por página y modal
export async function cargarEdicionContacto(id: string) {
  const [contacto, proyectos] = await Promise.all([obtenerContacto(id), listarProyectos()]);
  if (!contacto) notFound();

  return {
    nombre: contacto.nombre,
    propiedades: {
      accion: accionEditarContacto.bind(null, id),
      proyectos,
      valoresIniciales: {
        nombre: contacto.nombre,
        correo: contacto.correo,
        telefono: contacto.telefono ?? "",
        empresaOCargo: contacto.empresaOCargo ?? "",
        nota: contacto.nota ?? "",
        global: contacto.global,
        proyectoIds: contacto.proyectos.map((v) => v.proyecto.id),
      },
      textoEnviar: "Guardar cambios",
      rutaCancelar: `/contactos/${id}`,
    },
  };
}
