import { EstadoVacio } from "@/componentes/estado-vacio";
import { TituloSeccion } from "@/componentes/shell/titulo-seccion";

export const metadata = { title: "Contactos · Autogestión" };

export default function Contactos() {
  return (
    <>
      <TituloSeccion
        modulo="Libreta"
        titulo="Contactos"
        descripcion="Personas de contacto globales o asociadas a proyectos."
      />
      <EstadoVacio
        icono="usuarios"
        titulo="Tu libreta está vacía"
        descripcion="Podrás registrar contactos globales, de un único proyecto o compartidos entre varios frentes."
      />
    </>
  );
}
