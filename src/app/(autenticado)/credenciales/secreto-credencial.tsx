"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useAvisos } from "@/componentes/aviso";
import { Boton } from "@/componentes/boton";
import { revelarSecreto } from "./acciones";

const SEGUNDOS_VISIBLE = 15;
const OCULTO = "••••••••••";

// Solo recibe el id: el secreto se pide al servidor al revelar o copiar y no se conserva
export function SecretoCredencial({ id, nombre }: { id: string; nombre: string }) {
  const [secreto, setSecreto] = useState<string | null>(null);
  const [pendiente, iniciar] = useTransition();
  const { notificar } = useAvisos();

  const ocultar = useCallback(() => setSecreto(null), []);

  // Se oculta solo tras unos segundos y al cambiar de pestaña
  useEffect(() => {
    if (secreto === null) return;
    const temporizador = setTimeout(ocultar, SEGUNDOS_VISIBLE * 1000);
    const alCambiarVisibilidad = () => document.hidden && ocultar();
    document.addEventListener("visibilitychange", alCambiarVisibilidad);
    return () => {
      clearTimeout(temporizador);
      document.removeEventListener("visibilitychange", alCambiarVisibilidad);
    };
  }, [secreto, ocultar]);

  function revelar() {
    iniciar(async () => {
      const respuesta = await revelarSecreto(id);
      if (respuesta.ok) setSecreto(respuesta.secreto);
      else notificar("No se pudo obtener el secreto.", "critico");
    });
  }

  function copiar() {
    iniciar(async () => {
      const respuesta = await revelarSecreto(id);
      if (!respuesta.ok) return notificar("No se pudo obtener el secreto.", "critico");
      try {
        await navigator.clipboard.writeText(respuesta.secreto);
        notificar("Secreto copiado al portapapeles.", "exito");
      } catch {
        notificar("No se pudo copiar al portapapeles.", "critico");
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <code
        className="bg-base-300 rounded px-2 py-1 text-sm break-all"
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
          Revelar
        </Boton>
      ) : (
        <Boton
          variante="fantasma"
          tamano="pequeno"
          onClick={ocultar}
          aria-label={`Ocultar secreto de ${nombre}`}
        >
          Ocultar
        </Boton>
      )}
      <Boton
        variante="fantasma"
        tamano="pequeno"
        onClick={copiar}
        disabled={pendiente}
        aria-label={`Copiar secreto de ${nombre}`}
      >
        Copiar
      </Boton>
    </div>
  );
}
