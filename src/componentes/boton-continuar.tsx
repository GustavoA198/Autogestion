import { BotonEnlace } from "@/componentes/enlace";
import { Icono } from "@/componentes/icono";
import type { TamanoBoton, VarianteBoton } from "@/componentes/boton";

type Propiedades = {
  proyectoId: string;
  // Última entrada del proyecto; sin ella el botón lleva a crear la primera
  ultimaNotaId?: string | null;
  variante?: VarianteBoton;
  tamano?: TamanoBoton;
  className?: string;
};

// Lleva a la última entrada de la bitácora del proyecto o, si no hay, a una entrada nueva
export function BotonContinuar({
  proyectoId,
  ultimaNotaId,
  variante = "primario",
  tamano = "mediano",
  className,
}: Propiedades) {
  const base = `/proyectos/${proyectoId}/notas`;
  return (
    <BotonEnlace
      href={ultimaNotaId ? `${base}/${ultimaNotaId}` : `${base}/nueva`}
      variante={variante}
      tamano={tamano}
      className={className}
    >
      {ultimaNotaId ? "Continuar" : "Primera entrada"}
      <Icono nombre="flecha-derecha" tamano={tamano === "pequeno" ? 14 : 16} />
    </BotonEnlace>
  );
}
