"use client";

import { useEffect } from "react";

// Registra un error una sola vez por instancia, sin lanzar nunca.
export function useRegistrarError(error: Error, contexto: string) {
  useEffect(() => {
    if (!error) return;
    console.error(`[${contexto}]`, error.message, error.name, error.cause);
  }, [error, contexto]);
}
