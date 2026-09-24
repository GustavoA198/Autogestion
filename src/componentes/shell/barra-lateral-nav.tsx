"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icono } from "@/componentes/icono";
import type { EnlaceSeccion } from "@/componentes/shell/barra-lateral";

function esActivo(pathname: string, ruta: string): boolean {
  if (ruta === "/") return pathname === "/";
  return pathname === ruta || pathname.startsWith(`${ruta}/`);
}

type Propiedades = {
  secciones: EnlaceSeccion[];
  alNavegar?: () => void;
};

export function BarraLateralNav({ secciones, alNavegar }: Propiedades) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 px-3 py-4" aria-label="Navegación principal">
      <p className="mb-2 px-2 text-xs font-semibold tracking-widest uppercase opacity-60">
        Frentes de trabajo
      </p>
      <ul className="menu w-full gap-1 p-0">
        {secciones.map((seccion) => {
          const activo = esActivo(pathname, seccion.ruta);
          return (
            <li key={seccion.ruta}>
              <Link
                href={seccion.ruta}
                onClick={alNavegar}
                aria-current={activo ? "page" : undefined}
                className={[
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  activo
                    ? "bg-primary/15 text-primary font-semibold"
                    : "hover:bg-base-300 text-base-content",
                ].join(" ")}
              >
                <Icono nombre={seccion.icono} tamano={18} />
                <span className="flex-1">{seccion.etiqueta}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
