"use client";

import { Enlace } from "@/componentes/enlace";
import { BotonEliminar } from "@/componentes/boton-eliminar";
import { Icono } from "@/componentes/icono";
import { Insignia } from "@/componentes/insignia";
import { PROXIMO_PASO_SIN_DEFINIR } from "@/lib/notas/constantes";
import { formatearMinutos } from "@/lib/notas/formato";
import { accionEliminarNota } from "./acciones";
import { tiempoRelativo } from "@/lib/tiempo";

export function NotaFila({
  notaId,
  proyectoId,
  texto,
  proximoPaso,
  minutos,
  actualizadoEn,
}: {
  notaId: string;
  proyectoId: string;
  texto: string;
  proximoPaso: string;
  minutos: number | null;
  actualizadoEn: Date;
}) {
  return (
    <li className="tarjeta-fila flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div className="min-w-0 space-y-1">
        <Enlace
          href={`/proyectos/${proyectoId}/notas/${notaId}`}
          discreto
          title={texto}
          className="line-clamp-2 font-bold break-words"
        >
          {texto.length > 120 ? texto.slice(0, 120) + "…" : texto}
        </Enlace>
        {proximoPaso !== PROXIMO_PASO_SIN_DEFINIR ? (
          <p className="text-suave flex items-start gap-1.5 text-sm">
            <Icono nombre="flecha-derecha" tamano={14} className="text-primary mt-1 shrink-0" />
            <span className="min-w-0 truncate" title={`Próximo paso: ${proximoPaso}`}>
              <span className="font-bold">Próximo paso:</span> {proximoPaso}
            </span>
          </p>
        ) : null}
        <p className="text-tenue flex flex-wrap items-center gap-x-2 text-xs">
          <span>Actualizada {tiempoRelativo(actualizadoEn)}</span>
          {minutos ? (
            <Insignia tono="ghost" className="gap-1">
              <Icono nombre="reloj" tamano={12} />
              {formatearMinutos(minutos)}
            </Insignia>
          ) : null}
        </p>
      </div>
      <BotonEliminar
        variante="fantasma"
        tamano="pequeno"
        alConfirmar={() => accionEliminarNota(notaId, proyectoId)}
        titulo="Eliminar entrada"
        mensaje="Se eliminará esta entrada de la bitácora. Esta acción no se puede deshacer."
        textoConfirmar="Eliminar entrada"
        etiquetaAccesible="Eliminar entrada"
        texto="Eliminar"
      />
    </li>
  );
}
