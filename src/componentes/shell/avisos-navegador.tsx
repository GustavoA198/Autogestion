// Avisos del navegador para reuniones: componente sin interfaz montado en la cabecera y control para activarlos.
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  accionReunionesProximas,
  type ReunionAviso,
} from "@/app/(autenticado)/notificaciones/acciones";
import { Boton } from "@/componentes/boton";
import { Icono } from "@/componentes/icono";
import { Insignia } from "@/componentes/insignia";
import { zonaDelNavegador } from "@/lib/calendario/fechas";
import { formatoHora } from "@/lib/calendario/formato";
import {
  ESTADO_AVISOS_SERVIDOR,
  MINUTOS_ANTES_AVISO,
  avisosActivos,
  claveAviso,
  guardarPreferenciaAvisos,
  leerEstadoAvisos,
  marcarAvisada,
  minutosParaAvisar,
  solicitarPermisoAvisos,
  suscribirseALosAvisos,
  yaAvisada,
  type EstadoAvisos,
} from "@/lib/notificaciones/avisos-navegador";

const REVISION_MS = 30_000;
const RECARGA_MS = 5 * 60_000;

function useEstadoAvisos(): EstadoAvisos {
  return useSyncExternalStore(
    suscribirseALosAvisos,
    leerEstadoAvisos,
    () => ESTADO_AVISOS_SERVIDOR,
  );
}

// Lanza un aviso del navegador 15 minutos antes de cada reunión; no pinta nada
export function AvisosReuniones() {
  const router = useRouter();
  const estado = useEstadoAvisos();
  const activos = avisosActivos(estado);
  const refRouter = useRef(router);

  useEffect(() => {
    refRouter.current = router;
  }, [router]);

  useEffect(() => {
    if (!activos) return;
    let vigente = true;
    let reuniones: ReunionAviso[] = [];
    let ultimaCarga = 0;

    const avisar = (reunion: ReunionAviso, inicio: number, faltan: number) => {
      const zona = zonaDelNavegador();
      try {
        const aviso = new Notification(`Reunión a las ${formatoHora(inicio, zona)}`, {
          body: `"${reunion.titulo}" comienza en ${faltan} ${faltan === 1 ? "minuto" : "minutos"}.`,
          tag: `reunion-${reunion.id}`,
        });
        aviso.onclick = () => {
          window.focus();
          refRouter.current.push("/calendario");
          aviso.close();
        };
      } catch {
        // Algunos navegadores solo permiten avisos desde un service worker; se omite sin romper la app
      }
    };

    const revisar = async () => {
      const ahora = Date.now();
      if (ahora - ultimaCarga >= RECARGA_MS) {
        ultimaCarga = ahora;
        try {
          const cargadas = await accionReunionesProximas();
          if (vigente) reuniones = cargadas;
        } catch {
          // Si falla se reintenta en la próxima revisión con lo que ya se tenía
        }
      }
      if (!vigente || Notification.permission !== "granted") return;
      for (const reunion of reuniones) {
        const inicio = new Date(reunion.inicio).getTime();
        const faltan = minutosParaAvisar(inicio, Date.now());
        if (faltan === null) continue;
        const clave = claveAviso(reunion.id, reunion.inicio);
        if (yaAvisada(clave)) continue;
        marcarAvisada(clave, Date.now());
        avisar(reunion, inicio, faltan);
      }
    };

    void revisar();
    // No se pausa con la pestaña oculta: el aviso sirve justo cuando el usuario está en otra parte
    const intervalo = setInterval(() => void revisar(), REVISION_MS);
    return () => {
      vigente = false;
      clearInterval(intervalo);
    };
  }, [activos]);

  return null;
}

// Estado visible del permiso: el usuario ve de un vistazo si los avisos llegarán o no
function EstadoAvisos({ permiso, activos }: { permiso: string; activos: boolean }) {
  const bloqueados = permiso === "denegado";
  const texto = bloqueados ? "Bloqueados por el navegador" : activos ? "Activados" : "Sin activar";
  const tono = bloqueados ? "error" : activos ? "success" : "ghost";
  return (
    <p className="flex items-center gap-2 text-sm" role="status">
      <span className="text-suave">Estado de los avisos del navegador:</span>
      <Insignia tono={tono}>{texto}</Insignia>
    </p>
  );
}

// Control para activar o desactivar los avisos; el permiso se pide solo al pulsar el botón
export function ControlAvisosNavegador() {
  const estado = useEstadoAvisos();
  const [pidiendo, setPidiendo] = useState(false);
  const permiso = estado.split("|")[0];
  const activos = avisosActivos(estado);

  async function activar() {
    setPidiendo(true);
    try {
      await solicitarPermisoAvisos();
    } finally {
      setPidiendo(false);
    }
  }

  if (permiso === "no-soportado") {
    return (
      <p className="text-suave flex items-center gap-2 text-sm">
        <Icono nombre="info" tamano={16} />
        Este navegador no admite avisos del sistema.
      </p>
    );
  }

  if (permiso === "denegado") {
    return (
      <div className="space-y-2">
        <EstadoAvisos permiso={permiso} activos={false} />
        <p className="text-warning flex items-start gap-2 text-sm">
          <Icono nombre="alerta" tamano={16} className="mt-0.5 shrink-0" />
          <span>
            Permítelos desde la configuración del sitio para recibir un aviso {MINUTOS_ANTES_AVISO}{" "}
            minutos antes de cada reunión.
          </span>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <EstadoAvisos permiso={permiso} activos={activos} />
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-suave flex items-center gap-2 text-sm">
          <Icono nombre="campana" tamano={16} />
          {activos
            ? `Te avisamos ${MINUTOS_ANTES_AVISO} minutos antes de cada reunión.`
            : `Recibe un aviso del navegador ${MINUTOS_ANTES_AVISO} minutos antes de cada reunión.`}
        </p>
        {activos ? (
          <Boton
            variante="fantasma"
            tamano="pequeno"
            onClick={() => guardarPreferenciaAvisos(false)}
          >
            Desactivar
          </Boton>
        ) : (
          <Boton variante="secundario" tamano="pequeno" onClick={activar} cargando={pidiendo}>
            Activar avisos del navegador
          </Boton>
        )}
      </div>
    </div>
  );
}
