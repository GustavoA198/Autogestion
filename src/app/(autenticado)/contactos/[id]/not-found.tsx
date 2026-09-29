import { BotonEnlace } from "@/componentes/enlace";
import { EstadoVacio } from "@/componentes/estado-vacio";

export default function ContactoNoEncontrado() {
  return (
    <EstadoVacio
      icono="usuarios"
      titulo="Contacto no encontrado"
      descripcion="El contacto no existe o ya fue eliminado."
      accion={<BotonEnlace href="/contactos">Volver a contactos</BotonEnlace>}
    />
  );
}
