"use client";

import { useEffect, useRef, useState } from "react";
import { Boton } from "./boton";
import { Icono } from "@/componentes/icono";

type Estado = "reposo" | "copiando" | "copiado" | "error";

const TEXTO_BOTON: Record<Estado, string> = {
  reposo: "Copiar",
  copiando: "Copiando",
  copiado: "Copiado",
  error: "No se pudo copiar",
};

type Propiedades = {
  texto?: string;
  // Alternativa para valores sensibles: se piden al copiar y no se conservan en el cliente
  obtenerTexto?: () => Promise<string | null>;
  etiqueta?: string;
  // Botón cuadrado de solo icono para filas de tabla y datos junto a un valor
  compacto?: boolean;
};

export function Clipboard({ texto = "", obtenerTexto, etiqueta, compacto = false }: Propiedades) {
  const [estado, setEstado] = useState<Estado>("reposo");
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (temporizador.current) clearTimeout(temporizador.current);
    },
    [],
  );

  async function alCopiar() {
    try {
      let valor = texto;
      if (obtenerTexto) {
        setEstado("copiando");
        const obtenido = await obtenerTexto();
        if (obtenido === null) throw new Error("Sin valor");
        valor = obtenido;
      }
      await navigator.clipboard.writeText(valor);
      setEstado("copiado");
    } catch {
      setEstado("error");
    }
    if (temporizador.current) clearTimeout(temporizador.current);
    temporizador.current = setTimeout(() => {
      setEstado("reposo");
      if (obtenerTexto) navigator.clipboard.writeText("").catch(() => {});
    }, 2000);
  }

  return (
    <>
      <Boton
        type="button"
        variante="fantasma"
        tamano="pequeno"
        className={compacto ? "btn-square" : "whitespace-nowrap"}
        onClick={alCopiar}
        disabled={estado === "copiando"}
        // Ancho fijo: el texto cambia entre Copiar / Copiando / Copiado / No se pudo copiar
        // y sin este ancho la tabla se reacomoda horriblemente al copiar
        style={compacto ? undefined : { minWidth: "9rem" }}
        aria-label={etiqueta ?? "Copiar al portapapeles"}
        title={compacto ? (etiqueta ?? "Copiar al portapapeles") : undefined}
      >
        <Icono
          nombre={estado === "copiado" ? "check" : estado === "error" ? "alerta" : "copiar"}
          tamano={16}
          className={estado === "copiado" ? "text-success" : estado === "error" ? "text-error" : ""}
        />
        {compacto ? null : TEXTO_BOTON[estado]}
      </Boton>
      <span aria-live="polite" className="sr-only">
        {estado === "copiado"
          ? "Copiado al portapapeles"
          : estado === "error"
            ? "No se pudo copiar"
            : ""}
      </span>
    </>
  );
}
