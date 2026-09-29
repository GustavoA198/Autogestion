// Página de notificaciones agrupadas por urgencia, con sondeo cada 5 minutos.
"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAvisos } from "@/componentes/aviso";
import { Boton } from "@/componentes/boton";
import { EstadoCarga } from "@/componentes/estado-carga";
import { EstadoVacio } from "@/componentes/estado-vacio";
import { Icono } from "@/componentes/icono";
import { Insignia } from "@/componentes/insignia";
import { ControlAvisosNavegador } from "@/componentes/shell/avisos-navegador";
import { TituloSeccion } from "@/componentes/shell/titulo-seccion";
import { avisarCambioNotificaciones } from "@/lib/notificaciones/eventos";
import {
  ORDEN_GRUPOS,
  textoReunion,
  type GrupoNotificacion,
  type NotificacionPriorizada,
  type TonoInsigniaNotificacion,
} from "@/lib/notificaciones/prioridad";
import { conCantidad } from "@/lib/pluralizar";
import { formatters } from "@/lib/tiempo";
import {
  accionDescartarNotificacion,
  accionDescartarTodasNotificaciones,
  accionGenerarNotificaciones,
  accionListarNotificaciones,
} from "./acciones";

const INTERVALO_MS = 5 * 60 * 1000;
// Refresco del texto relativo de las reuniones ("En 12 min") sin volver al servidor
const REFRESCO_RELATIVO_MS = 30 * 1000;

type EstiloTono = { cuadro: string; texto: string };

// Clases completas para que Tailwind las detecte; el tono siempre va acompañado de ícono y texto
const ESTILOS: Record<TonoInsigniaNotificacion, EstiloTono> = {
  error: { cuadro: "bg-error/12 text-error", texto: "text-error" },
  primary: { cuadro: "bg-primary/12 text-primary", texto: "text-primary" },
  warning: { cuadro: "bg-warning/12 text-warning", texto: "text-warning" },
  amarillo: { cuadro: "bg-amarillo/12 text-amarillo", texto: "text-amarillo" },
  info: { cuadro: "bg-info/12 text-info", texto: "text-info" },
};

const TITULO_GRUPO: Record<GrupoNotificacion, string> = {
  Urgente: "Urgente",
  "Para hoy": "Para hoy",
  Próximamente: "Próximamente",
  Resumen: "Resumen del día",
};

// Resumen del encabezado: "2 urgentes · 3 más"
function textoResumen(lista: NotificacionPriorizada[]): string {
  const urgentes = lista.filter((n) => n.severidad <= 3).length;
  const resto = lista.length - urgentes;
  if (urgentes === 0) return `Sin urgentes · ${conCantidad(resto, "aviso", "avisos")}`;
  if (resto === 0) return conCantidad(urgentes, "urgente", "urgentes");
  return `${conCantidad(urgentes, "urgente", "urgentes")} · ${resto} más`;
}

// Línea de detalle de la tarjeta; las reuniones urgentes muestran el tiempo en vivo,
// las demás ya traen su texto calculado en prioridad.ts (Mañana a las X / En N días · HH:mm)
function textoDetalle(n: NotificacionPriorizada, ahora: Date): string | null {
  if (n.tipo !== "REUNION_PROXIMA") return n.detalle;
  if (n.severidad > 3) return n.detalle;
  const inicio = new Date(n.fechaEvento);
  return `${formatters.hora(inicio)} · ${textoReunion(inicio, ahora)}`;
}

export default function Notificaciones() {
  const { notificar } = useAvisos();
  const [notificaciones, setNotificaciones] = useState<NotificacionPriorizada[]>([]);
  const [cargando, setCargando] = useState(true);
  const [accionPendiente, setAccionPendiente] = useState<string | null>(null);
  const [ahora, setAhora] = useState(() => new Date());

  const cargar = useCallback(async () => {
    try {
      await accionGenerarNotificaciones();
      setNotificaciones(await accionListarNotificaciones());
      setAhora(new Date());
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
    const id = setInterval(cargar, INTERVALO_MS);
    return () => clearInterval(id);
  }, [cargar]);

  useEffect(() => {
    const id = setInterval(() => setAhora(new Date()), REFRESCO_RELATIVO_MS);
    return () => clearInterval(id);
  }, []);

  async function descartar(n: NotificacionPriorizada) {
    setAccionPendiente(n.id);
    try {
      await accionDescartarNotificacion(n.id);
      setNotificaciones((prev) => prev.filter((x) => x.id !== n.id));
      avisarCambioNotificaciones();
      notificar(`Notificación descartada: ${n.asunto}.`, "exito");
    } catch {
      notificar("No se pudo descartar la notificación.", "critico");
    } finally {
      setAccionPendiente(null);
    }
  }

  async function descartarTodas() {
    setAccionPendiente("todas");
    try {
      const cantidad = await accionDescartarTodasNotificaciones();
      setNotificaciones([]);
      avisarCambioNotificaciones();
      notificar(
        `Se ${cantidad === 1 ? "descartó" : "descartaron"} ${conCantidad(cantidad, "notificación", "notificaciones")}.`,
        "exito",
      );
    } catch {
      notificar("No se pudieron descartar las notificaciones.", "critico");
    } finally {
      setAccionPendiente(null);
    }
  }

  const hayNotificaciones = !cargando && notificaciones.length > 0;

  return (
    <>
      <TituloSeccion
        modulo="Autogestión"
        titulo="Notificaciones"
        descripcion={
          hayNotificaciones
            ? textoResumen(notificaciones)
            : "Recordatorios internos generados automáticamente."
        }
        accion={
          hayNotificaciones ? (
            <Boton
              variante="secundario"
              onClick={descartarTodas}
              cargando={accionPendiente === "todas"}
            >
              <Icono nombre="check" tamano={16} />
              Descartar todas
            </Boton>
          ) : undefined
        }
      />

      <div className="tarjeta mb-6 px-4 py-3 sm:px-6">
        <ControlAvisosNavegador />
      </div>

      {cargando ? (
        <EstadoCarga filas={4} etiqueta="Cargando notificaciones" />
      ) : notificaciones.length === 0 ? (
        <EstadoVacio
          icono="campana"
          titulo="Sin notificaciones"
          descripcion="No hay recordatorios pendientes. Se verifican automáticamente cada 5 minutos."
        />
      ) : (
        <section className="tarjeta overflow-clip" aria-label="Notificaciones">
          {ORDEN_GRUPOS.flatMap((grupo, indiceGrupo) => {
            const items = notificaciones.filter((n) => n.grupo === grupo);
            if (items.length === 0) return [];
            const idTitulo = `grupo-${grupo.replace(/\s+/g, "-").toLowerCase()}`;
            return [
              <header
                key={`cab-${grupo}`}
                className={`bg-hundida border-linea-tarjeta flex items-baseline gap-2 border-y px-4 py-2 text-xs font-bold tracking-wide uppercase ${
                  indiceGrupo === 0 ? "border-t-0" : ""
                }`}
              >
                <h2 id={idTitulo} className="flex items-baseline gap-2">
                  {TITULO_GRUPO[grupo]}
                  <span className="text-suave font-mono text-sm font-bold tabular-nums">
                    ({items.length})
                  </span>
                </h2>
              </header>,
              <ul key={`lst-${grupo}`} aria-labelledby={idTitulo}>
                {items.map((n, indice) => (
                  <li
                    key={n.id}
                    className={
                      indice < items.length - 1 ? "border-linea-tarjeta border-b" : ""
                    }
                  >
                    <TarjetaNotificacion
                      n={n}
                      ahora={ahora}
                      descartando={accionPendiente === n.id}
                      onDescartar={() => descartar(n)}
                    />
                  </li>
                ))}
              </ul>,
            ];
          })}
        </section>
      )}
    </>
  );
}

type PropiedadesTarjeta = {
  n: NotificacionPriorizada;
  ahora: Date;
  descartando: boolean;
  onDescartar: () => void;
};

function TarjetaNotificacion({ n, ahora, descartando, onDescartar }: PropiedadesTarjeta) {
  const estilo = ESTILOS[n.insignia.tono];
  const detalle = textoDetalle(n, ahora);
  const esResumen = n.tipo === "RESUMEN_DIA";

  return (
    <div className="flex items-start gap-3 px-4 py-3 sm:gap-4 sm:px-6">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <Insignia tono={n.insignia.tono} contorno className="gap-1">
            <Icono nombre={n.insignia.icono} tamano={12} />
            {n.insignia.texto}
          </Insignia>
          {detalle ? (
            <span className={`font-mono text-sm font-bold tabular-nums ${estilo.texto}`}>
              {detalle}
            </span>
          ) : null}
        </div>
        <p className="mt-1 font-bold break-words">{n.asunto}</p>
        {esResumen ? <p className="text-suave mt-0.5 text-sm">{n.mensaje}</p> : null}
        <Link
          href={n.enlace.href}
          className="enlace mt-1 inline-flex min-h-6 items-center text-sm [@media(pointer:coarse)]:min-h-11"
          aria-label={`${n.enlace.texto}: ${n.asunto}`}
        >
          {n.enlace.texto}
        </Link>
      </div>
      <Boton
        variante="fantasma"
        tamano="pequeno"
        onClick={onDescartar}
        cargando={descartando}
        className="shrink-0"
        aria-label={`Descartar "${n.asunto}"`}
      >
        Descartar
      </Boton>
    </div>
  );
}
