import type { ReactElement, SVGProps } from "react";

export type NombreIcono =
  | "panel"
  | "proyectos"
  | "llave"
  | "usuarios"
  | "calendario"
  | "lista"
  | "libreta"
  | "cerrar-sesion"
  | "menu"
  | "cerrar";

const ICONOS: Record<NombreIcono, ReactElement> = {
  panel: (
    <>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </>
  ),
  proyectos: (
    <>
      <path d="M3 7l9-4 9 4-9 4-9-4z" />
      <path d="M3 12l9 4 9-4" />
      <path d="M3 17l9 4 9-4" />
    </>
  ),
  llave: (
    <>
      <circle cx="8" cy="15" r="4" />
      <path d="M10.85 12.15L19 4" />
      <path d="M18 5l3 3" />
      <path d="M15 8l3 3" />
    </>
  ),
  usuarios: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" />
      <path d="M16 11a3 3 0 100-6" />
      <path d="M22 20c0-2.8-1.7-5-4-5.7" />
    </>
  ),
  calendario: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18" />
      <path d="M8 3v4M16 3v4" />
    </>
  ),
  lista: (
    <>
      <path d="M4 6h12" />
      <path d="M4 12h12" />
      <path d="M4 18h8" />
      <circle cx="19" cy="6" r="1.25" />
      <circle cx="19" cy="12" r="1.25" />
      <circle cx="18" cy="18" r="1.25" />
    </>
  ),
  libreta: (
    <>
      <path d="M4 4h12a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
      <path d="M4 4v16a2 2 0 002 2h12" />
      <path d="M8 8h8M8 12h8M8 16h6" />
    </>
  ),
  "cerrar-sesion": (
    <>
      <path d="M15 4h4a1 1 0 011 1v14a1 1 0 01-1 1h-4" />
      <path d="M10 17l-5-5 5-5" />
      <path d="M5 12h12" />
    </>
  ),
  menu: (
    <>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </>
  ),
  cerrar: (
    <>
      <path d="M6 6l12 12M18 6L6 18" />
    </>
  ),
};

type Propiedades = Omit<SVGProps<SVGSVGElement>, "children"> & {
  nombre: NombreIcono;
  tamano?: number;
  etiqueta?: string;
};

export function Icono({ nombre, tamano = 20, etiqueta, className, ...resto }: Propiedades) {
  const accesibilidad = etiqueta
    ? { role: "img" as const, "aria-label": etiqueta }
    : { "aria-hidden": true as const, focusable: false as const };

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={tamano}
      height={tamano}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...accesibilidad}
      {...resto}
    >
      {ICONOS[nombre]}
    </svg>
  );
}
