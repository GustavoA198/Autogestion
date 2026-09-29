import { TituloSeccion } from "@/componentes/shell/titulo-seccion";
import { FormularioNuevaCredencial } from "./formulario-nueva";

export const dynamic = "force-dynamic";

export default function NuevaCredencial() {
  return (
    <>
      <TituloSeccion
        modulo="Credenciales"
        titulo="Nueva credencial"
        descripcion="El secreto se guarda cifrado y nunca se muestra en los listados."
      />
      <FormularioNuevaCredencial />
    </>
  );
}
