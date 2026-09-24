import { EstadoVacio } from "@/componentes/estado-vacio";
import { TituloSeccion } from "@/componentes/shell/titulo-seccion";

export const metadata = { title: "Tareas · Autogestión" };

export default function Tareas() {
  return (
    <>
      <TituloSeccion
        modulo="Seguimiento"
        titulo="Tareas"
        descripcion="Tareas puntuales y recurrentes, independientes o por proyecto."
      />
      <EstadoVacio
        icono="lista"
        titulo="No hay tareas registradas"
        descripcion="Las tareas admiten frecuencias diaria, semanal, mensual o puntual, y pueden clonarse entre proyectos."
      />
    </>
  );
}
