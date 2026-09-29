import { TituloSeccion } from "@/componentes/shell/titulo-seccion";
import { FormularioNota } from "../../formulario-nota";
import { cargarEdicionNota } from "./datos-edicion";

export default async function EditarNota({
  params,
}: PageProps<"/proyectos/[id]/notas/[notaId]/editar">) {
  const p = await params;
  const propiedades = await cargarEdicionNota(p.id, p.notaId);

  return (
    <>
      <TituloSeccion modulo="Bitácora" titulo="Editar entrada" />
      <FormularioNota {...propiedades} />
    </>
  );
}
