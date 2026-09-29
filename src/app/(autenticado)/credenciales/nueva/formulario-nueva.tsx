import { listarProyectos } from "@/lib/proyectos/operaciones";
import { accionCrearCredencial } from "../acciones";
import { FormularioCredencial } from "../formulario-credencial";

// Formulario de creación compartido por la página completa y el modal interceptado
export async function FormularioNuevaCredencial({ enModal = false }: { enModal?: boolean }) {
  const proyectos = await listarProyectos();

  return (
    <FormularioCredencial
      accion={accionCrearCredencial}
      proyectos={proyectos.map(({ id, nombre }) => ({ id, nombre }))}
      textoEnviar="Crear credencial"
      rutaCancelar="/credenciales"
      enModal={enModal}
    />
  );
}
