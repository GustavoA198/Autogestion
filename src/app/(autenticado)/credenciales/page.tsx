import { EstadoVacio } from "@/componentes/estado-vacio";
import { TituloSeccion } from "@/componentes/shell/titulo-seccion";

export const metadata = { title: "Credenciales · Autogestión" };

export default function Credenciales() {
  return (
    <>
      <TituloSeccion
        modulo="Bóveda"
        titulo="Credenciales"
        descripcion="Accesos globales, de un proyecto o compartidos entre varios."
      />
      <EstadoVacio
        icono="llave"
        titulo="La bóveda está vacía"
        descripcion="Las credenciales se almacenan cifradas y pueden ser globales o asociarse a uno o varios proyectos."
      />
    </>
  );
}
