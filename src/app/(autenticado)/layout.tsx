import type { ReactNode } from "react";
import { exigirSesion } from "@/lib/auth/sesion";
import { BarraLateral } from "@/componentes/shell/barra-lateral";
import { Cabecera } from "@/componentes/shell/cabecera";
import { ProveedorAvisos } from "@/componentes/aviso";

export default async function LayoutAutenticado({
  children,
  modal,
}: {
  children: ReactNode;
  modal: ReactNode;
}) {
  const sesion = await exigirSesion();
  const usuario = sesion.user?.name ?? "Usuario";

  return (
    <ProveedorAvisos>
      <a href="#contenido" className="saltar-al-contenido btn btn-primary">
        Saltar al contenido
      </a>
      <div className="bg-base-200 text-base-content flex min-h-dvh">
        <BarraLateral />
        <div className="flex min-w-0 flex-1 flex-col">
          <Cabecera usuario={usuario} />
          <main id="contenido" tabIndex={-1} className="flex-1 px-4 py-6 md:px-8 md:py-8">
            <div className="mx-auto w-full max-w-7xl">{children}</div>
          </main>
        </div>
      </div>
      {modal}
    </ProveedorAvisos>
  );
}
