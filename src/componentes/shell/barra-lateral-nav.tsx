"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icono } from "@/componentes/icono";
import type { GrupoSecciones } from "@/componentes/shell/barra-lateral";

function esActivo(pathname: string, ruta: string): boolean {
  if (ruta === "/") return pathname === "/";
  return pathname === ruta || pathname.startsWith(`${ruta}/`);
}

type Propiedades = {
  grupos: GrupoSecciones[];
  // "barra" colapsa a iconos entre md y lg; "cajon" siempre muestra las etiquetas
  variante?: "barra" | "cajon";
  alNavegar?: () => void;
};

export function BarraLateralNav({ grupos, variante = "cajon", alNavegar }: Propiedades) {
  const pathname = usePathname();
  const esBarra = variante === "barra";

  return (
    <nav
      className="flex-1 [scrollbar-width:thin] overflow-y-auto px-3 py-4"
      aria-label="Navegación principal"
    >
      <ul className="flex flex-col gap-1">
        {grupos.map((grupo, indice) => (
          <li key={grupo.titulo ?? indice} className={indice > 0 ? "mt-3" : undefined}>
            {grupo.titulo ? (
              <>
                <p
                  className={`text-tenue px-4 pb-1.5 text-[0.6875rem] font-bold tracking-[0.1em] uppercase ${esBarra ? "hidden lg:block" : ""}`}
                >
                  {grupo.titulo}
                </p>
                {esBarra ? (
                  <hr className="border-base-300 mx-2 mb-2 lg:hidden" aria-hidden="true" />
                ) : null}
              </>
            ) : null}
            <ul className="flex flex-col gap-0.5">
              {grupo.secciones.map((seccion) => {
                const activo = esActivo(pathname, seccion.ruta);
                return (
                  <li key={seccion.ruta}>
                    <Link
                      href={seccion.ruta}
                      onClick={alNavegar}
                      aria-current={activo ? "page" : undefined}
                      title={esBarra ? seccion.etiqueta : undefined}
                      className={[
                        "flex min-h-11 cursor-pointer items-center gap-3 rounded-full border px-4 text-sm transition-colors duration-150",
                        esBarra
                          ? "mx-auto w-11 justify-center px-0 lg:mx-0 lg:w-auto lg:justify-start lg:px-4"
                          : "",
                        activo
                          ? "bg-primary text-primary-content border-[var(--borde-primario)] font-bold"
                          : "text-suave hover:bg-hover hover:text-base-content border-transparent font-bold",
                      ].join(" ")}
                    >
                      <Icono nombre={seccion.icono} tamano={20} />
                      <span className={esBarra ? "sr-only lg:not-sr-only" : undefined}>
                        {seccion.etiqueta}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ul>
    </nav>
  );
}
