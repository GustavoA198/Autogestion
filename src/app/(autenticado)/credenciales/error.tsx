"use client";

import { Boton } from "@/componentes/boton";
import { EstadoError } from "@/componentes/estado-error";
import { useRegistrarError } from "@/lib/errores/registro";

export default function ErrorCredenciales({ error, reset }: { error: Error; reset: () => void }) {
  useRegistrarError(error, "credenciales");
  return (
    <EstadoError
      titulo="No se pudieron cargar las credenciales"
      mensaje="Ocurrió un problema al consultar la información. Intenta de nuevo."
      accion={
        <Boton variante="secundario" tamano="pequeno" onClick={reset}>
          Reintentar
        </Boton>
      }
    />
  );
}
