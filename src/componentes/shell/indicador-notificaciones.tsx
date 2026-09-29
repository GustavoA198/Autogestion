// Acceso a notificaciones en la cabecera con contador de pendientes actualizado por sondeo.
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { accionGenerarYContarNotificaciones } from "@/app/(autenticado)/notificaciones/acciones";
import { Icono } from "@/componentes/icono";
import { EVENTO_NOTIFICACIONES_CAMBIARON } from "@/lib/notificaciones/eventos";
import { conCantidad } from "@/lib/pluralizar";

const INTERVALO_MS = 5 * 60 * 1000;

export function IndicadorNotificaciones() {
  const [conteo, setConteo] = useState({ total: 0, urgentes: 0 });

  const cargar = useCallback(async () => {
    try {
      // Mismo flujo que el panel: primero descarta obsoletas y solo después cuenta; así el badge nunca miente
      setConteo(await accionGenerarYContarNotificaciones());
    } catch {
      // Silencioso: si falla, simplemente no muestra el contador
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- polling con useEffect es el patrón correcto para client components
    cargar();
    const id = setInterval(cargar, INTERVALO_MS);
    // Recuenta al instante cuando se descartan notificaciones desde otra parte de la app
    window.addEventListener(EVENTO_NOTIFICACIONES_CAMBIARON, cargar);
    return () => {
      clearInterval(id);
      window.removeEventListener(EVENTO_NOTIFICACIONES_CAMBIARON, cargar);
    };
  }, [cargar]);

  const { total, urgentes } = conteo;
  // Desglose accesible: "3 pendientes, 2 urgentes"
  const etiqueta =
    total === 0
      ? "Notificaciones: sin pendientes"
      : `Notificaciones: ${conCantidad(total, "pendiente", "pendientes")}${
          urgentes > 0 ? `, ${conCantidad(urgentes, "urgente", "urgentes")}` : ""
        }`;
  const colorInsignia =
    urgentes > 0 ? "bg-error text-error-content" : "bg-primary text-primary-content";

  return (
    <Link
      href="/notificaciones"
      className="btn btn-ghost btn-circle relative size-11"
      aria-label={etiqueta}
      title={etiqueta}
    >
      <Icono nombre="campana" tamano={20} />
      {total > 0 ? (
        <span
          aria-hidden="true"
          className={`${colorInsignia} ring-base-200 absolute top-1 right-1 grid min-w-[1.125rem] place-items-center rounded-full px-1 text-[0.6875rem] leading-[1.125rem] font-extrabold ring-2`}
        >
          {total > 99 ? "99+" : total}
        </span>
      ) : null}
    </Link>
  );
}
