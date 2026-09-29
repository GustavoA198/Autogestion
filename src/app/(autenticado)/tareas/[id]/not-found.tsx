import { BotonEnlace } from "@/componentes/enlace";
import { EstadoVacio } from "@/componentes/estado-vacio";

export default function TareaNoEncontrada() {
  return (
    <EstadoVacio
      icono="lista"
      titulo="Tarea no encontrada"
      descripcion="La tarea no existe o ya fue eliminada."
      accion={<BotonEnlace href="/tareas">Volver a tareas</BotonEnlace>}
    />
  );
}
