// Sincronización automática del calendario de Google: componente sin interfaz montado en la cabecera.
"use client";

import { useEffect, useRef } from "react";
import { accionSincronizarCalendario } from "@/app/(autenticado)/calendario/acciones";
import { avisarCalendarioSincronizado } from "@/lib/calendario/eventos";
import { avisarCambioNotificaciones } from "@/lib/notificaciones/eventos";

const INTERVALO_MS = 5 * 60_000;
// Evita repetir la petición si el foco vuelve varias veces seguidas
const ESPERA_MINIMA_MS = 30_000;
// Tras un error transitorio (env vars aún sin montar o token revocado) se reintenta pasado este tiempo
const REINTENTAR_NO_CONFIGURADO_MS = 10 * 60_000;
const REINTENTAR_ACCESO_REVOCADO_MS = 5 * 60_000;

export function SincronizacionAutomatica() {
  const enCursoRef = useRef(false);
  // Próximo instante en el que se permitirá volver a intentar tras un fallo de configuración o acceso
  const reanudarEnRef = useRef(0);
  const advertidaRef = useRef(false);
  const ultimoIntentoRef = useRef(0);

  useEffect(() => {
    const sincronizar = async () => {
      if (enCursoRef.current) return;
      if (document.visibilityState !== "visible") return;
      const ahora = Date.now();
      if (ahora < reanudarEnRef.current) return;
      if (ahora - ultimoIntentoRef.current < ESPERA_MINIMA_MS) return;
      ultimoIntentoRef.current = ahora;
      enCursoRef.current = true;
      try {
        const resultado = await accionSincronizarCalendario("GOOGLE", "auto");
        if (resultado.ok) {
          reanudarEnRef.current = 0;
          advertidaRef.current = false;
          avisarCalendarioSincronizado({
            proveedor: "GOOGLE",
            huboCambios: resultado.huboCambios,
            ultimaSincronizacion: resultado.ultimaSincronizacion,
          });
          // Una reunión nueva puede generar avisos: se refresca el indicador de notificaciones
          if (resultado.huboCambios) avisarCambioNotificaciones();
        } else if (resultado.codigo === "no-configurado") {
          // Env vars aún sin montar: reintentar pasados REINTENTAR_NO_CONFIGURADO_MS por si se añaden después
          reanudarEnRef.current = Date.now() + REINTENTAR_NO_CONFIGURADO_MS;
        } else if (resultado.codigo === "accesso-revocado") {
          // Token revocado: reintentar al reconectar la cuenta de Google
          reanudarEnRef.current = Date.now() + REINTENTAR_ACCESO_REVOCADO_MS;
        } else if (!advertidaRef.current) {
          advertidaRef.current = true;
          console.warn("No se pudo sincronizar el calendario automáticamente:", resultado.mensaje);
        }
      } catch {
        if (!advertidaRef.current) {
          advertidaRef.current = true;
          console.warn("No se pudo sincronizar el calendario automáticamente.");
        }
      } finally {
        enCursoRef.current = false;
      }
    };

    const alCambiarVisibilidad = () => void sincronizar();
    void sincronizar();
    const intervalo = setInterval(() => void sincronizar(), INTERVALO_MS);
    document.addEventListener("visibilitychange", alCambiarVisibilidad);
    window.addEventListener("focus", alCambiarVisibilidad);
    return () => {
      clearInterval(intervalo);
      document.removeEventListener("visibilitychange", alCambiarVisibilidad);
      window.removeEventListener("focus", alCambiarVisibilidad);
    };
  }, []);

  return null;
}
