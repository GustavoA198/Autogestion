"use client";

import { Boton } from "@/componentes/boton";
import { EstadoError } from "@/componentes/estado-error";

export default function ErrorTareas({ reset }: { error: Error; reset: () => void }) {
  return (
    <EstadoError
      titulo="No se pudieron cargar las tareas"
      mensaje="Ocurrió un problema. Intenta de nuevo."
      accion={
        <Boton variante="secundario" tamano="pequeno" onClick={reset}>
          Reintentar
        </Boton>
      }
    />
  );
}
