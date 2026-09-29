import { TituloSeccion } from "@/componentes/shell/titulo-seccion";
import { FormularioNuevoContacto } from "./formulario-nuevo";

export default function NuevaContacto() {
  return (
    <>
      <TituloSeccion modulo="Libreta" titulo="Nuevo contacto" />
      <FormularioNuevoContacto />
    </>
  );
}
