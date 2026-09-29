import { accionCrearProyecto } from "../acciones";
import { FormularioProyecto } from "../formulario-proyecto";

// Formulario de creación compartido por la página completa y el modal interceptado
export function FormularioNuevoProyecto({ enModal = false }: { enModal?: boolean }) {
  return (
    <FormularioProyecto
      accion={accionCrearProyecto}
      textoEnviar="Crear proyecto"
      rutaCancelar="/proyectos"
      enModal={enModal}
    />
  );
}
