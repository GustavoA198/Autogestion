"use client";

import { useState } from "react";
import { AreaConScroll } from "@/componentes/area-con-scroll";
import { Casilla } from "@/componentes/casilla";
import { MensajeCampo } from "@/componentes/campo";
import { useModalRuta } from "@/componentes/modal-ruta";

type Propiedades = {
  global: boolean;
  proyectoIds: string[];
  proyectos: { id: string; nombre: string }[];
  error?: string;
};

// Alcance compartido: global o asociado a uno o varios proyectos
export function SelectorAlcance({ global, proyectoIds, proyectos, error }: Propiedades) {
  const [esGlobal, setEsGlobal] = useState(global);
  // En un modal desplaza el propio modal: un segundo scroll anidado confunde y duplica la pista
  const enModal = useModalRuta() !== null;

  const casillas = proyectos.map((proyecto) => (
    <Casilla
      key={proyecto.id}
      etiqueta={proyecto.nombre}
      name="proyectoIds"
      value={proyecto.id}
      defaultChecked={proyectoIds.includes(proyecto.id)}
      disabled={esGlobal}
    />
  ));

  return (
    <div className="space-y-3">
      <Casilla
        etiqueta="Global (visible desde cualquier proyecto)"
        name="global"
        defaultChecked={global}
        onChange={(evento) => setEsGlobal(evento.target.checked)}
      />
      {proyectos.length === 0 ? (
        <p className="text-suave text-sm">Aún no hay proyectos para asociar.</p>
      ) : (
        <div
          className="bg-hundida border-linea-tarjeta overflow-hidden rounded-2xl border"
          role="group"
          aria-label="Proyectos asociados"
          aria-describedby={error ? "error-alcance" : undefined}
        >
          {enModal ? (
            <div className="p-2">{casillas}</div>
          ) : (
            <AreaConScroll etiqueta="Proyectos asociados" className="max-h-52" claseCuerpo="p-2">
              {casillas}
            </AreaConScroll>
          )}
        </div>
      )}
      <MensajeCampo id="error-alcance" invalido={Boolean(error)}>
        {error ?? (esGlobal ? "Al ser global no necesita proyectos." : undefined)}
      </MensajeCampo>
    </div>
  );
}
