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
  | "cerrar"
  | "grafica"
  | "busqueda"
  | "campana"
  | "sol"
  | "luna"
  | "monitor"
  | "ojo"
  | "ojo-cerrado"
  | "copiar"
  | "check"
  | "check-circulo"
  | "alerta"
  | "info"
  | "error"
  | "mas"
  | "chevron-abajo"
  | "chevron-arriba"
  | "chevron-derecha"
  | "chevron-izquierda"
  | "flecha-derecha"
  | "editar"
  | "papelera"
  | "enlace-externo"
  | "usuario"
  | "candado"
  | "reloj"
  | "refrescar"
  | "respaldo"
  | "video"
  | "escudo"
  | "bandera"
  | "enlace"
  | "mensaje"
  | "ampliar"
  | "kebab"
  | "carpeta"
  | "repetir";

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
  grafica: (
    <>
      <path d="M3 3v18h18" />
      <path d="M7 16l4-4 4 4 5-6" />
    </>
  ),
  busqueda: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.6-3.6" />
    </>
  ),
  campana: (
    <>
      <path d="M6 9a6 6 0 1112 0c0 5 2 6.5 2 6.5H4S6 14 6 9z" />
      <path d="M10 19a2 2 0 004 0" />
    </>
  ),
  sol: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
    </>
  ),
  luna: <path d="M20 14.5A8 8 0 019.5 4 8 8 0 1020 14.5z" />,
  monitor: (
    <>
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8M12 16v4" />
    </>
  ),
  ojo: (
    <>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  "ojo-cerrado": (
    <>
      <path d="M10.6 5.6a9.6 9.6 0 011.4-.1c6 0 9.5 6.5 9.5 6.5a16.6 16.6 0 01-2.7 3.4M6.6 6.8A16.6 16.6 0 002.5 12S6 18.5 12 18.5a9.6 9.6 0 004.2-1M9.9 9.9a3 3 0 004.2 4.2" />
      <path d="M3 3l18 18" />
    </>
  ),
  copiar: (
    <>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V6a2 2 0 012-2h9" />
    </>
  ),
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  "check-circulo": (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.5l2.7 2.7L16 9.8" />
    </>
  ),
  alerta: (
    <>
      <path d="M12 3.5l9.5 16.5h-19L12 3.5z" />
      <path d="M12 10v4.5M12 17.5h.01" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </>
  ),
  error: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9 9l6 6M15 9l-6 6" />
    </>
  ),
  mas: <path d="M12 5v14M5 12h14" />,
  "chevron-abajo": <path d="M6 9l6 6 6-6" />,
  "chevron-arriba": <path d="M6 15l6-6 6 6" />,
  "chevron-derecha": <path d="M9 6l6 6-6 6" />,
  "chevron-izquierda": <path d="M15 6l-6 6 6 6" />,
  "flecha-derecha": <path d="M5 12h14M13 6l6 6-6 6" />,
  editar: (
    <>
      <path d="M4 20l1-4L16.5 4.5a2.1 2.1 0 013 3L8 19l-4 1z" />
      <path d="M14.5 6.5l3 3" />
    </>
  ),
  papelera: (
    <>
      <path d="M4 7h16M10 11v6M14 11v6" />
      <path d="M6 7l1 12a2 2 0 002 2h6a2 2 0 002-2l1-12M9 7V4h6v3" />
    </>
  ),
  "enlace-externo": (
    <>
      <path d="M14 4h6v6M20 4l-9 9" />
      <path d="M18 14v4a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2h4" />
    </>
  ),
  usuario: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 20c0-4 3.4-6.5 7.5-6.5s7.5 2.5 7.5 6.5" />
    </>
  ),
  candado: (
    <>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 018 0v3" />
    </>
  ),
  reloj: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  refrescar: (
    <>
      <path d="M20 11a8 8 0 00-14.5-4M4 5v3.5h3.5" />
      <path d="M4 13a8 8 0 0014.5 4M20 19v-3.5h-3.5" />
    </>
  ),
  respaldo: (
    <>
      <ellipse cx="12" cy="6" rx="8" ry="3" />
      <path d="M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6" />
      <path d="M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
    </>
  ),
  video: (
    <>
      <rect x="3" y="6" width="13" height="12" rx="2" />
      <path d="M16 10l5-3v10l-5-3" />
    </>
  ),
  escudo: (
    <>
      <path d="M12 3l8 3v6c0 4.5-3.2 8-8 9-4.8-1-8-4.5-8-9V6l8-3z" />
      <path d="M9 12l2 2 4-4" />
    </>
  ),
  bandera: (
    <>
      <path d="M5 21V4" />
      <path d="M5 4h12l-2.5 4L17 12H5" />
    </>
  ),
  enlace: (
    <>
      <path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1" />
      <path d="M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1" />
    </>
  ),
  mensaje: <path d="M4 5h16v11H9l-5 4V5z" />,
  kebab: (
    <>
      <circle cx="12" cy="5" r="1.4" />
      <circle cx="12" cy="12" r="1.4" />
      <circle cx="12" cy="19" r="1.4" />
    </>
  ),
  carpeta: <path d="M3 7a2 2 0 012-2h4l2 2.5h8a2 2 0 012 2V17a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />,
  repetir: (
    <>
      <path d="M17 3l3 3-3 3" />
      <path d="M4 11V9.5A3.5 3.5 0 017.5 6H20" />
      <path d="M7 21l-3-3 3-3" />
      <path d="M20 13v1.5a3.5 3.5 0 01-3.5 3.5H4" />
    </>
  ),
  ampliar: (
    <>
      <path d="M14 4h6v6" />
      <path d="M10 20H4v-6" />
      <path d="M20 4l-7 7" />
      <path d="M4 20l7-7" />
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
      className={["shrink-0", className].filter(Boolean).join(" ")}
      {...accesibilidad}
      {...resto}
    >
      {ICONOS[nombre]}
    </svg>
  );
}
