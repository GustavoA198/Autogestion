import { BotonCerrarSesion } from "@/app/boton-cerrar-sesion";
import { SECCIONES_PRINCIPALES } from "@/componentes/shell/barra-lateral";
import { MenuMovil } from "@/componentes/shell/menu-movil";

export function Cabecera() {
  return (
    <header className="border-base-300 bg-base-100/95 sticky top-0 z-30 border-b backdrop-blur">
      <div className="flex items-center gap-3 px-4 py-3 lg:px-6">
        <MenuMovil secciones={SECCIONES_PRINCIPALES} />
        <div className="ml-auto">
          <BotonCerrarSesion />
        </div>
      </div>
    </header>
  );
}
