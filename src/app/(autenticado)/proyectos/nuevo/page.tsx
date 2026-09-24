import { TituloSeccion } from "@/componentes/shell/titulo-seccion";
import { accionCrearProyecto } from "../acciones";
import { FormularioProyecto } from "../formulario-proyecto";

export const metadata = { title: "Nuevo proyecto · Autogestión" };

export default function NuevoProyecto() {
  return (
    <>
      <TituloSeccion
        modulo="Proyectos"
        titulo="Nuevo proyecto"
        descripcion="Solo el nombre es obligatorio; la documentación se guarda como enlace."
      />
      <FormularioProyecto
        accion={accionCrearProyecto}
        textoEnviar="Crear proyecto"
        rutaCancelar="/proyectos"
      />
    </>
  );
}
