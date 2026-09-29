"use client";

import { useRouter } from "next/navigation";
import { Selector } from "@/componentes/selector";

const PERIODOS = [4, 8, 12] as const;

export function PeriodoSelector({ actual }: { actual: number }) {
  const router = useRouter();

  return (
    <Selector
      // La clave reinicia el valor cuando cambia la URL (atrás/adelante del navegador)
      key={actual}
      name="semanas"
      etiqueta="Periodo"
      aria-label="Seleccionar periodo en semanas"
      defaultValue={String(actual)}
      onChange={(e) => router.push(`/estadisticas?semanas=${e.target.value}`)}
    >
      {PERIODOS.map((p) => (
        <option key={p} value={p}>
          Últimas {p} semanas
        </option>
      ))}
    </Selector>
  );
}
