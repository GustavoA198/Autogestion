import { TituloSeccion } from "@/componentes/shell/titulo-seccion";
import { FormularioCredencial } from "../../formulario-credencial";
import { cargarEdicionCredencial } from "./datos-edicion";

export const dynamic = "force-dynamic";

export default async function EditarCredencial({ params }: PageProps<"/credenciales/[id]/editar">) {
  const { id } = await params;
  const { nombre, propiedades } = await cargarEdicionCredencial(id);

  return (
    <>
      <TituloSeccion modulo="Credenciales" titulo={`Editar ${nombre}`} />
      <FormularioCredencial {...propiedades} />
    </>
  );
}
