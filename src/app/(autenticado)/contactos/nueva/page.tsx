import { TituloSeccion } from "@/componentes/shell/titulo-seccion";
import { listarProyectos } from "@/lib/proyectos/operaciones";
import { FormularioContacto } from "../formulario-contacto";
import { accionCrearContacto } from "../acciones";

export const metadata = { title: "Nuevo contacto · Autogestion" };

export default async function NuevaContacto() {
  const proyectos = await listarProyectos();

  return (
    <>
      <TituloSeccion modulo="Libreta" titulo="Nuevo contacto" />
      <FormularioContacto
        accion={accionCrearContacto}
        proyectos={proyectos}
        textoEnviar="Crear contacto"
        rutaCancelar="/contactos"
      />
    </>
  );
}
