// Límite de error de las estadísticas con opción de reintentar.
"use client";

import { useEffect } from "react";
import { Boton } from "@/componentes/boton";
import { BotonEnlace } from "@/componentes/enlace";
import { EstadoError } from "@/componentes/estado-error";

export default function EstadisticasError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error("[estadisticas]", error);
  }, [error]);

  return (
    <EstadoError
      titulo="No se pudieron cargar las estadísticas"
      mensaje="Ocurrió un error inesperado. Puedes reintentar o volver al panel."
      accion={
        <div className="flex flex-wrap gap-2">
          <Boton onClick={reset}>Reintentar</Boton>
          <BotonEnlace href="/dashboard" variante="secundario">
            Ir al panel
          </BotonEnlace>
        </div>
      }
    />
  );
}
