// Página de notificaciones con polling cada 5 minutos.
"use client";

import { useCallback, useEffect, useState } from "react";
import { Boton } from "@/componentes/boton";
import { EstadoVacio } from "@/componentes/estado-vacio";
import { Tarjeta } from "@/componentes/shell/tarjeta";
import { TituloSeccion } from "@/componentes/shell/titulo-seccion";
import {
  accionDescartarNotificacion,
  accionDescartarTodasNotificaciones,
  accionGenerarNotificaciones,
  accionListarNotificaciones,
} from "./acciones";
import { tiempoRelativo } from "@/lib/tiempo";

const INTERVALO_MS = 5 * 60 * 1000;

type Notificacion = {
  id: string;
  tipo: "REUNION_PROXIMA" | "TAREA_VENCE_HOY";
  titulo: string;
  mensaje: string;
  fechaEvento: string;
  creadoEn: string;
};

export default function Notificaciones() {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [cargando, setCargando] = useState(false);
  const [accionPendiente, setAccionPendiente] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      await accionGenerarNotificaciones();
      const lista = await accionListarNotificaciones();
      setNotificaciones(lista as unknown as Notificacion[]);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- polling con useEffect es el patrón correcto para client components
    cargar();
    const id = setInterval(cargar, INTERVALO_MS);
    return () => clearInterval(id);
  }, [cargar]);

  async function descartar(id: string) {
    setAccionPendiente(id);
    try {
      await accionDescartarNotificacion(id);
      setNotificaciones((prev) => prev.filter((n) => n.id !== id));
    } finally {
      setAccionPendiente(null);
    }
  }

  async function descartarTodas() {
    setAccionPendiente("todas");
    try {
      await accionDescartarTodasNotificaciones();
      setNotificaciones([]);
    } finally {
      setAccionPendiente(null);
    }
  }

  return (
    <>
      <TituloSeccion
        modulo="Autogestión"
        titulo="Notificaciones"
        descripcion="Recordatorios internos generados automáticamente."
        accion={
          notificaciones.length > 0 ? (
            <Boton
              variante="fantasma"
              onClick={descartarTodas}
              cargando={accionPendiente === "todas"}
            >
              Descartar todas
            </Boton>
          ) : undefined
        }
      />

      {cargando && notificaciones.length === 0 ? (
        <div className="flex justify-center py-12">
          <span
            className="loading loading-spinner loading-lg"
            aria-label="Cargando notificaciones"
          />
        </div>
      ) : notificaciones.length === 0 ? (
        <EstadoVacio
          icono="lista"
          titulo="Sin notificaciones"
          descripcion="No hay recordatorios pendientes. Se verifican automáticamente cada 5 minutos."
        />
      ) : (
        <div className="space-y-3">
          {notificaciones.map((n) => (
            <Tarjeta key={n.id}>
              <div className="flex items-start gap-3">
                <span className="bg-base-300 flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
                  <span className="text-lg" role="img" aria-hidden="true">
                    {n.tipo === "REUNION_PROXIMA" ? "📅" : "📋"}
                  </span>
                </span>
                <div className="flex-1">
                  <p className="font-medium">{n.titulo}</p>
                  <p className="text-sm opacity-70">{n.mensaje}</p>
                  <p className="mt-1 text-xs opacity-50">{tiempoRelativo(new Date(n.creadoEn))}</p>
                </div>
                <Boton
                  variante="fantasma"
                  tamano="pequeno"
                  onClick={() => descartar(n.id)}
                  cargando={accionPendiente === n.id}
                >
                  Descartar
                </Boton>
              </div>
            </Tarjeta>
          ))}
        </div>
      )}
    </>
  );
}
