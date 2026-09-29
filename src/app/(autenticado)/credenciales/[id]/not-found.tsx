import { BotonEnlace } from "@/componentes/enlace";
import { EstadoVacio } from "@/componentes/estado-vacio";

export default function CredencialNoEncontrada() {
  return (
    <EstadoVacio
      icono="llave"
      titulo="Credencial no encontrada"
      descripcion="La credencial no existe o ya fue eliminada."
      accion={<BotonEnlace href="/credenciales">Volver a credenciales</BotonEnlace>}
    />
  );
}
