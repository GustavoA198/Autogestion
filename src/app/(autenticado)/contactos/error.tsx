"use client";

import { Boton } from "@/componentes/boton";
import { EstadoError } from "@/componentes/estado-error";

export default function ErrorContactos({ reset }: { error: Error; reset: () => void }) {
  return (
    <EstadoError
      titulo="No se pudieron cargar los contactos"
      mensaje="Ocurrió un problema al consultar la información. Intenta de nuevo."
      accion={
        <Boton variante="secundario" tamano="pequeno" onClick={reset}>
          Reintentar
        </Boton>
      }
    />
  );
}
