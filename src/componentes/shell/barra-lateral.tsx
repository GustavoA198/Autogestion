import Link from "next/link";
import type { NombreIcono } from "@/componentes/icono";
import { Marca, Monograma } from "@/componentes/shell/marca";
import { BarraLateralNav } from "@/componentes/shell/barra-lateral-nav";

export type EnlaceSeccion = {
  ruta: string;
  etiqueta: string;
  icono: NombreIcono;
};

export type GrupoSecciones = {
  titulo?: string;
  secciones: EnlaceSeccion[];
};

export const GRUPOS_NAVEGACION: GrupoSecciones[] = [
  {
    secciones: [{ ruta: "/dashboard", etiqueta: "Panel", icono: "panel" }],
  },
  {
    titulo: "Trabajo",
    secciones: [
      { ruta: "/proyectos", etiqueta: "Proyectos", icono: "proyectos" },
      { ruta: "/tareas", etiqueta: "Tareas", icono: "lista" },
      { ruta: "/calendario", etiqueta: "Calendario", icono: "calendario" },
      { ruta: "/notas", etiqueta: "Notas / Bitácora", icono: "libreta" },
    ],
  },
  {
    titulo: "Datos",
    secciones: [
      { ruta: "/credenciales", etiqueta: "Credenciales", icono: "llave" },
      { ruta: "/contactos", etiqueta: "Contactos", icono: "usuarios" },
    ],
  },
  {
    titulo: "Análisis",
    secciones: [{ ruta: "/estadisticas", etiqueta: "Estadísticas", icono: "grafica" }],
  },
];

export const SECCIONES_PRINCIPALES: EnlaceSeccion[] = GRUPOS_NAVEGACION.flatMap(
  (grupo) => grupo.secciones,
);

// Riel de iconos en tabletas y barra completa desde lg; en móvil la navegación vive en el cajón
export function BarraLateral() {
  return (
    <aside className="border-linea-tarjeta bg-sidebar sticky top-0 hidden h-dvh w-[4.5rem] shrink-0 flex-col border-r md:flex lg:w-64">
      <div className="border-linea-tarjeta flex h-16 shrink-0 items-center justify-center border-b px-3 lg:justify-start lg:px-5">
        <Link
          href="/dashboard"
          aria-label="Autogestión, ir al panel"
          className="flex items-center rounded-full"
        >
          <Monograma tamano={36} className="lg:hidden" />
          <Marca className="hidden lg:flex" />
        </Link>
      </div>

      <BarraLateralNav grupos={GRUPOS_NAVEGACION} variante="barra" />
    </aside>
  );
}
