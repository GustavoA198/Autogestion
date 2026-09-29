// Límite de error del panel con opción de reintentar.
"use client";

import { useEffect } from "react";
import { Boton } from "@/componentes/boton";
import { BotonEnlace } from "@/componentes/enlace";
import { EstadoError } from "@/componentes/estado-error";

type Props = {
  error: Error;
  reset: () => void;
};

export default function DashboardError({ error, reset }: Props) {
  useEffect(() => {
    console.error("[panel]", error);
  }, [error]);

  return (
    <EstadoError
      titulo="No se pudo cargar el panel"
      mensaje="Ocurrió un error inesperado. Puedes reintentar o ir a otra sección."
      accion={
        <div className="flex flex-wrap gap-2">
          <Boton onClick={reset}>Reintentar</Boton>
          <BotonEnlace href="/tareas" variante="secundario">
            Ir a tareas
          </BotonEnlace>
        </div>
      }
    />
  );
}
