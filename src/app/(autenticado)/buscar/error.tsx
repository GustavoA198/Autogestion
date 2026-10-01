"use client";

import { Boton } from "@/componentes/boton";
import { EstadoError } from "@/componentes/estado-error";
import { useRegistrarError } from "@/lib/errores/registro";

export default function ErrorBusqueda({ error, reset }: { error: Error; reset: () => void }) {
  useRegistrarError(error, "buscar");
  return (
    <EstadoError
      titulo="No se pudo completar la búsqueda"
      mensaje="Ocurrió un problema al consultar la información. Intenta de nuevo."
      accion={
        <Boton variante="secundario" tamano="pequeno" onClick={reset}>
          Reintentar
        </Boton>
      }
    />
  );
}
