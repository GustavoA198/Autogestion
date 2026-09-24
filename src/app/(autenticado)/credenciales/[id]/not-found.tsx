import Link from "next/link";
import { EstadoVacio } from "@/componentes/estado-vacio";

export default function CredencialNoEncontrada() {
  return (
    <EstadoVacio
      icono="llave"
      titulo="Credencial no encontrada"
      descripcion="La credencial no existe o ya fue eliminada."
      accion={
        <Link href="/credenciales" className="btn btn-primary">
          Volver a credenciales
        </Link>
      }
    />
  );
}
