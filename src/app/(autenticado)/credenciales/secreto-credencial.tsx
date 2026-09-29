"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useAvisos } from "@/componentes/aviso";
import { Boton } from "@/componentes/boton";
import { Clipboard } from "@/componentes/clipboard";
import { Icono } from "@/componentes/icono";
import { revelarSecreto } from "./acciones";

const SEGUNDOS_VISIBLE = 15;
const OCULTO = "••••••••••";

// Sobrescribe el portapapeles del sistema con una cadena vacía para no dejar el secreto accesible
function vaciarPortapapeles() {
  if (navigator.clipboard?.writeText) navigator.clipboard.writeText("").catch(() => {});
}

// Solo recibe el id: el secreto se pide al servidor al revelar o copiar y no se conserva
export function SecretoCredencial({ id, nombre }: { id: string; nombre: string }) {
  const [secreto, setSecreto] = useState<string | null>(null);
  const [pendiente, iniciar] = useTransition();
  const { notificar } = useAvisos();

  const ocultar = useCallback(() => {
    setSecreto(null);
    vaciarPortapapeles();
  }, []);

  // Se oculta solo tras unos segundos y al cambiar de pestaña, y vacía el portapapeles para no dejar el secreto accesible
  useEffect(() => {
    if (secreto === null) return;
    const temporizador = setTimeout(ocultar, SEGUNDOS_VISIBLE * 1000);
    const alCambiarVisibilidad = () => document.hidden && ocultar();
    document.addEventListener("visibilitychange", alCambiarVisibilidad);
    return () => {
      clearTimeout(temporizador);
      document.removeEventListener("visibilitychange", alCambiarVisibilidad);
      vaciarPortapapeles();
    };
  }, [secreto, ocultar]);

  function revelar() {
    iniciar(async () => {
      const respuesta = await revelarSecreto(id);
      if (respuesta.ok) setSecreto(respuesta.secreto);
      else notificar("No se pudo obtener el secreto.", "critico");
    });
  }

  // El valor se pide al copiar y no queda en el estado del componente
  const obtenerParaCopiar = useCallback(async () => {
    const respuesta = await revelarSecreto(id);
    return respuesta.ok ? respuesta.secreto : null;
  }, [id]);

  return (
    <div className="flex flex-wrap items-center gap-x-1 gap-y-1">
      <code
        className={`bg-hundida border-linea-tarjeta mr-1 rounded-xl border px-3 py-1.5 font-mono text-sm ${
          secreto === null ? "whitespace-nowrap" : "break-all"
        }`}
        data-testid="valor-secreto"
        aria-live="polite"
      >
        {secreto ?? OCULTO}
      </code>
      {secreto === null ? (
        <Boton
          variante="fantasma"
          tamano="pequeno"
          onClick={revelar}
          cargando={pendiente}
          aria-label={`Revelar secreto de ${nombre}`}
        >
          <Icono nombre="ojo" tamano={16} />
          Revelar
        </Boton>
      ) : (
        <Boton
          variante="fantasma"
          tamano="pequeno"
          onClick={ocultar}
          aria-label={`Ocultar secreto de ${nombre}`}
        >
          <Icono nombre="ojo-cerrado" tamano={16} />
          Ocultar
        </Boton>
      )}
      <Clipboard obtenerTexto={obtenerParaCopiar} etiqueta={`Copiar secreto de ${nombre}`} />
    </div>
  );
}
