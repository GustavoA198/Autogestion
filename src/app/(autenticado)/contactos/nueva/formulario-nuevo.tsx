import { listarProyectos } from "@/lib/proyectos/operaciones";
import { accionCrearContacto } from "../acciones";
import { FormularioContacto } from "../formulario-contacto";

// Formulario de creación compartido por la página completa y el modal interceptado
export async function FormularioNuevoContacto({ enModal = false }: { enModal?: boolean }) {
  const proyectos = await listarProyectos();

  return (
    <FormularioContacto
      accion={accionCrearContacto}
      proyectos={proyectos}
      textoEnviar="Crear contacto"
      rutaCancelar="/contactos"
      enModal={enModal}
    />
  );
}
