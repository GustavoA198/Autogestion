import { EstadoVacio } from "@/componentes/estado-vacio";
import { TituloSeccion } from "@/componentes/shell/titulo-seccion";

export const metadata = { title: "Panel · Autogestión" };

export default function Panel() {
  return (
    <>
      <TituloSeccion
        modulo="Centro de mando"
        titulo="Panel general del día"
        descripcion="Resumen del estado operativo: reuniones, tareas y accesos rápidos."
      />
      <EstadoVacio
        icono="panel"
        titulo="Aún no hay datos para mostrar"
        descripcion="Cuando conectes calendarios y registres proyectos y tareas, el resumen del día aparecerá aquí."
      />
    </>
  );
}
