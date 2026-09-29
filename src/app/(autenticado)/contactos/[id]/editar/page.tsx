import { TituloSeccion } from "@/componentes/shell/titulo-seccion";
import { FormularioContacto } from "../../formulario-contacto";
import { cargarEdicionContacto } from "./datos-edicion";

export default async function EditarContacto({ params }: PageProps<"/contactos/[id]/editar">) {
  const { id } = await params;
  const { propiedades } = await cargarEdicionContacto(id);

  return (
    <>
      <TituloSeccion modulo="Contacto" titulo="Editar contacto" />
      <FormularioContacto {...propiedades} />
    </>
  );
}
