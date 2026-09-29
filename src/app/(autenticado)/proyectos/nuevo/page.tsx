import { TituloSeccion } from "@/componentes/shell/titulo-seccion";
import { FormularioNuevoProyecto } from "./formulario-nuevo";

export default function NuevoProyecto() {
  return (
    <>
      <TituloSeccion
        modulo="Proyectos"
        titulo="Nuevo proyecto"
        descripcion="Solo el nombre es obligatorio; la documentación se guarda como enlace."
      />
      <FormularioNuevoProyecto />
    </>
  );
}
