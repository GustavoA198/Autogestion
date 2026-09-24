import { notFound } from "next/navigation";
import { TituloSeccion } from "@/componentes/shell/titulo-seccion";
import { obtenerContacto } from "@/lib/contactos/operaciones";
import { listarProyectos } from "@/lib/proyectos/operaciones";
import { FormularioContacto } from "../../formulario-contacto";
import { accionEditarContacto } from "../../acciones";

export const metadata = { title: "Editar contacto · Autogestion" };

export default async function EditarContacto({ params }: PageProps<"/contactos/[id]/editar">) {
  const { id } = await params;
  const [contacto, proyectos] = await Promise.all([obtenerContacto(id), listarProyectos()]);
  if (!contacto) notFound();

  return (
    <>
      <TituloSeccion modulo="Contacto" titulo="Editar contacto" />
      <FormularioContacto
        accion={accionEditarContacto.bind(null, id)}
        proyectos={proyectos}
        valoresIniciales={{
          nombre: contacto.nombre,
          correo: contacto.correo,
          telefono: contacto.telefono ?? "",
          empresaOCargo: contacto.empresaOCargo ?? "",
          nota: contacto.nota ?? "",
          global: contacto.global,
          proyectoIds: contacto.proyectos.map((v) => v.proyecto.id),
        }}
        textoEnviar="Guardar cambios"
        rutaCancelar={`/contactos/${id}`}
      />
    </>
  );
}
