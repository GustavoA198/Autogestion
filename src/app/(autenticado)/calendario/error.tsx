"use client";

import { useEffect } from "react";
import { Boton } from "@/componentes/boton";
import { EstadoError } from "@/componentes/estado-error";
import { TituloSeccion } from "@/componentes/shell/titulo-seccion";

type Propiedades = {
  error: Error & { digest?: string };
  retry: () => void;
};

// Si el servidor falla al preparar el calendario se ofrece reintentar sin salir de la pantalla
export default function ErrorCalendario({ error, retry }: Propiedades) {
  useEffect(() => {
    console.error("[calendario]", error);
  }, [error]);

  return (
    <>
      <TituloSeccion
        modulo="Agenda"
        titulo="Calendario"
        descripcion="Reuniones sincronizadas desde tus calendarios."
      />
      <EstadoError
        titulo="No se pudo cargar el calendario"
        mensaje="Ocurrió un error inesperado al preparar la pantalla. Puedes intentarlo de nuevo."
        accion={
          <Boton variante="secundario" onClick={() => retry()}>
            Reintentar
          </Boton>
        }
      />
    </>
  );
}
