// Indicador de notificaciones pendientes en la cabecera con polling.
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { accionContarNotificaciones } from "@/app/(autenticado)/notificaciones/acciones";

const INTERVALO_MS = 5 * 60 * 1000;

export function IndicadorNotificaciones() {
  const [conteo, setConteo] = useState(0);

  const cargar = useCallback(async () => {
    try {
      const n = await accionContarNotificaciones();
      setConteo(n);
    } catch {
      // Silencioso: si falla, simplemente no muestra el indicador
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- polling con useEffect es el patrón correcto para client components
    cargar();
    const id = setInterval(cargar, INTERVALO_MS);
    return () => clearInterval(id);
  }, [cargar]);

  if (conteo === 0) return null;

  return (
    <Link
      href="/notificaciones"
      className="btn btn-ghost btn-sm relative"
      aria-label={`${conteo} notificación${conteo !== 1 ? "s" : ""} pendiente${conteo !== 1 ? "s" : ""}`}
    >
      <span aria-hidden="true">🔔</span>
      <span className="badge badge-primary badge-sm absolute -top-1 -right-1">
        {conteo > 99 ? "99+" : conteo}
      </span>
    </Link>
  );
}
