import Link from "next/link";
import { EstadoVacio } from "@/componentes/estado-vacio";

export default function ProyectoNoEncontrado() {
  return (
    <EstadoVacio
      icono="proyectos"
      titulo="Proyecto no encontrado"
      descripcion="El proyecto no existe o ya fue eliminado."
      accion={
        <Link href="/proyectos" className="btn btn-primary">
          Volver a proyectos
        </Link>
      }
    />
  );
}
