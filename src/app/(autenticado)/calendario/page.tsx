import { EstadoVacio } from "@/componentes/estado-vacio";
import { TituloSeccion } from "@/componentes/shell/titulo-seccion";

export const metadata = { title: "Calendario · Autogestión" };

export default function Calendario() {
  return (
    <>
      <TituloSeccion
        modulo="Agenda"
        titulo="Calendario"
        descripcion="Vista unificada de tus calendarios conectados."
      />
      <EstadoVacio
        icono="calendario"
        titulo="Aún no conectaste ningún calendario"
        descripcion="Google Calendar se activa en la HU-10. Microsoft se suma después en la HU-17. Hasta entonces, esta vista permanece vacía."
      />
    </>
  );
}
