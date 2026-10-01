"use client";

import { Boton } from "@/componentes/boton";
import { EstadoError } from "@/componentes/estado-error";
import { useRegistrarError } from "@/lib/errores/registro";

export default function ErrorContactos({ error, reset }: { error: Error; reset: () => void }) {
  useRegistrarError(error, "contactos");
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
