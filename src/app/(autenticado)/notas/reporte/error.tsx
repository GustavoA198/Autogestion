// Límite de error del reporte semanal con opción de reintentar.
"use client";

import { useEffect } from "react";
import { Boton } from "@/componentes/boton";
import { BotonEnlace } from "@/componentes/enlace";
import { EstadoError } from "@/componentes/estado-error";

export default function ReporteError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error("[reporte-semanal]", error);
  }, [error]);

  return (
    <EstadoError
      titulo="No se pudo generar el reporte"
      mensaje="Ocurrió un error inesperado al reunir las entradas de la semana. Puedes reintentar o volver a la bitácora."
      accion={
        <div className="flex flex-wrap gap-2">
          <Boton onClick={reset}>Reintentar</Boton>
          <BotonEnlace href="/notas" variante="secundario">
            Volver a la bitácora
          </BotonEnlace>
        </div>
      }
    />
  );
}
