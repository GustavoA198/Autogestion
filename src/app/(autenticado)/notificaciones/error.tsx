"use client";

import { Boton } from "@/componentes/boton";
import { EstadoError } from "@/componentes/estado-error";
import { useRegistrarError } from "@/lib/errores/registro";

export default function ErrorNotificaciones({ error, reset }: { error: Error; reset: () => void }) {
  useRegistrarError(error, "notificaciones");
  return (
    <EstadoError
      titulo="No se pudieron cargar las notificaciones"
      mensaje="Ocurrió un problema al consultar la información. Intenta de nuevo."
      accion={
        <Boton variante="secundario" tamano="pequeno" onClick={reset}>
          Reintentar
        </Boton>
      }
    />
  );
}
