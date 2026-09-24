import { EstadoVacio } from "@/componentes/estado-vacio";
import { TituloSeccion } from "@/componentes/shell/titulo-seccion";

export const metadata = { title: "Proyectos · Autogestión" };

export default function Proyectos() {
  return (
    <>
      <TituloSeccion
        modulo="Frentes de trabajo"
        titulo="Proyectos"
        descripcion="Fichas livianas de cada frente, con enlace a su documentación."
      />
      <EstadoVacio
        icono="proyectos"
        titulo="Aún no tienes proyectos registrados"
        descripcion="Cuando vincules un frente de trabajo aparecerá aquí con sus credenciales, contactos, tareas y notas."
      />
    </>
  );
}
