import { EstadoVacio } from "@/componentes/estado-vacio";
import { TituloSeccion } from "@/componentes/shell/titulo-seccion";

export const metadata = { title: "Notas y bitácora · Autogestión" };

export default function Notas() {
  return (
    <>
      <TituloSeccion
        modulo="Diario técnico"
        titulo="Notas y bitácora"
        descripcion="Notas y bitácora por proyecto."
      />
      <EstadoVacio
        icono="libreta"
        titulo="Tu bitácora está en blanco"
        descripcion="Cada proyecto podrá tener su propio diario técnico buscable cuando entremos a la HU de notas y bitácora."
      />
    </>
  );
}
