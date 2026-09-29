import Link from "next/link";
import type { AnchorHTMLAttributes, ComponentProps } from "react";
import { clasesBoton, type TamanoBoton, type VarianteBoton } from "@/componentes/boton";

type PropiedadesEnlace = ComponentProps<typeof Link> & {
  // El discreto hereda el color del texto y solo resalta al pasar el puntero
  discreto?: boolean;
};

// Enlace de texto con el estilo de la aplicación
export function Enlace({ discreto = false, className, ...resto }: PropiedadesEnlace) {
  const clases = [discreto ? "enlace-discreto" : "enlace", className].filter(Boolean).join(" ");
  return <Link className={clases} {...resto} />;
}

type PropiedadesBoton = ComponentProps<typeof Link> & {
  variante?: VarianteBoton;
  tamano?: TamanoBoton;
};

// Enlace interno con el mismo aspecto que Boton
export function BotonEnlace({
  variante = "primario",
  tamano = "mediano",
  className,
  ...resto
}: PropiedadesBoton) {
  return <Link className={clasesBoton(variante, tamano, className)} {...resto} />;
}

type PropiedadesExterno = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "target" | "rel"> & {
  href: string;
  variante?: VarianteBoton;
  tamano?: TamanoBoton;
  comoBoton?: boolean;
};

// Enlace a otra web: abre en pestaña nueva y avisa a lectores de pantalla
export function EnlaceExterno({
  comoBoton = false,
  variante = "secundario",
  tamano = "mediano",
  className,
  children,
  ...resto
}: PropiedadesExterno) {
  const clases = comoBoton ? clasesBoton(variante, tamano, className) : ["enlace", className].filter(Boolean).join(" ");
  return (
    <a target="_blank" rel="noopener noreferrer" className={clases} {...resto}>
      {children}
      <span className="sr-only"> (se abre en una pestaña nueva)</span>
    </a>
  );
}
