import { TituloSeccion } from "@/componentes/shell/titulo-seccion";
import { listarProyectos } from "@/lib/proyectos/operaciones";
import { accionCrearCredencial } from "../acciones";
import { FormularioCredencial } from "../formulario-credencial";

export const metadata = { title: "Nueva credencial · Autogestión" };
export const dynamic = "force-dynamic";

export default async function NuevaCredencial() {
  const proyectos = await listarProyectos();

  return (
    <>
      <TituloSeccion
        modulo="Credenciales"
        titulo="Nueva credencial"
        descripcion="El secreto se guarda cifrado y nunca se muestra en los listados."
      />
      <FormularioCredencial
        accion={accionCrearCredencial}
        proyectos={proyectos.map(({ id, nombre }) => ({ id, nombre }))}
        textoEnviar="Crear credencial"
        rutaCancelar="/credenciales"
      />
    </>
  );
}
