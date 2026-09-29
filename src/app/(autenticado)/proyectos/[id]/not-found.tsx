import { BotonEnlace } from "@/componentes/enlace";
import { EstadoVacio } from "@/componentes/estado-vacio";

export default function ProyectoNoEncontrado() {
  return (
    <EstadoVacio
      icono="proyectos"
      titulo="Proyecto no encontrado"
      descripcion="El proyecto no existe o ya fue eliminado."
      accion={<BotonEnlace href="/proyectos">Volver a proyectos</BotonEnlace>}
    />
  );
}
