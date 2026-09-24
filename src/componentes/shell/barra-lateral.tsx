import type { NombreIcono } from "@/componentes/icono";
import { Marca } from "@/componentes/shell/marca";
import { BarraLateralNav } from "@/componentes/shell/barra-lateral-nav";

export type EnlaceSeccion = {
  ruta: string;
  etiqueta: string;
  icono: NombreIcono;
};

export const SECCIONES_PRINCIPALES: EnlaceSeccion[] = [
  { ruta: "/dashboard", etiqueta: "Panel", icono: "panel" },
  { ruta: "/proyectos", etiqueta: "Proyectos", icono: "proyectos" },
  { ruta: "/credenciales", etiqueta: "Credenciales", icono: "llave" },
  { ruta: "/contactos", etiqueta: "Contactos", icono: "usuarios" },
  { ruta: "/calendario", etiqueta: "Calendario", icono: "calendario" },
  { ruta: "/tareas", etiqueta: "Tareas", icono: "lista" },
  { ruta: "/notas", etiqueta: "Notas / Bitácora", icono: "libreta" },
  { ruta: "/estadisticas", etiqueta: "Estadísticas", icono: "grafica" },
];

export function BarraLateral() {
  return (
    <div className="border-base-300 bg-base-200 hidden w-64 shrink-0 border-r lg:flex lg:flex-col">
      <div className="border-base-300 border-b px-5 py-5">
        <Marca />
      </div>

      <BarraLateralNav secciones={SECCIONES_PRINCIPALES} />
    </div>
  );
}
