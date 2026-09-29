import { notFound } from "next/navigation";
import { obtenerCredencial } from "@/lib/credenciales/operaciones";
import { listarProyectos } from "@/lib/proyectos/operaciones";
import { accionEditarCredencial } from "../../acciones";

// Carga la credencial (sin secreto) y arma las propiedades del formulario de edición, compartidas por página y modal
export async function cargarEdicionCredencial(id: string) {
  const [credencial, proyectos] = await Promise.all([obtenerCredencial(id), listarProyectos()]);
  if (!credencial) notFound();

  return {
    nombre: credencial.nombre,
    propiedades: {
      accion: accionEditarCredencial.bind(null, credencial.id),
      proyectos: proyectos.map(({ id: proyectoId, nombre }) => ({ id: proyectoId, nombre })),
      valoresIniciales: {
        nombre: credencial.nombre,
        categoria: credencial.categoria,
        usuario: credencial.usuario ?? "",
        host: credencial.host ?? "",
        nota: credencial.nota ?? "",
        global: credencial.global,
        proyectoIds: credencial.proyectos.map((vinculo) => vinculo.proyecto.id),
      },
      editando: true,
      textoEnviar: "Guardar cambios",
      rutaCancelar: `/credenciales/${credencial.id}`,
    },
  };
}
