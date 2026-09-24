// Error boundary para el dashboard.
"use client";

import { useEffect } from "react";

type Props = {
  error: Error;
  reset: () => void;
};

export default function DashboardError({ error, reset }: Props) {
  useEffect(() => {
    console.error("[dashboard]", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Error al cargar el panel</h2>
        <p className="text-base-content/60 text-sm max-w-md">
          Ocurrió un error inesperado. Los bloques se muestran de forma independiente,
          por lo que puedes intentar recargar solo esta sección.
        </p>
      </div>
      <div className="flex gap-2">
        <button className="btn btn-primary" onClick={reset}>Reintentar</button>
        <button className="btn btn-outline" onClick={() => (window.location.href = "/")}>
          Ir al inicio
        </button>
      </div>
    </div>
  );
}
