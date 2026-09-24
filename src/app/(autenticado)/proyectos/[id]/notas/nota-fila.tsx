"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Boton } from "@/componentes/boton";
import { Confirmacion } from "@/componentes/confirmacion";
import { accionEliminarNota } from "./acciones";
import { tiempoRelativo } from "@/lib/tiempo";

export function NotaFila({
  notaId,
  proyectoId,
  texto,
  actualizadoEn,
}: {
  notaId: string;
  proyectoId: string;
  texto: string;
  actualizadoEn: Date;
}) {
  const [abierto, setAbierto] = useState(false);
  const [pendiente, iniciar] = useTransition();

  return (
    <li className="py-3">
      <div className="flex items-start justify-between gap-2">
        <Link
          href={`/proyectos/${proyectoId}/notas/${notaId}`}
          className="link link-hover font-medium"
        >
          {texto.length > 80 ? texto.slice(0, 80) + "…" : texto}
        </Link>
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-xs opacity-60">{tiempoRelativo(actualizadoEn)}</span>
          <Boton variante="fantasma" tamano="pequeno" onClick={() => setAbierto(true)}>
            Eliminar
          </Boton>
          <Confirmacion
            abierto={abierto}
            alCancelar={() => setAbierto(false)}
            alConfirmar={() => iniciar(() => accionEliminarNota(notaId, proyectoId))}
            titulo="Eliminar entrada"
            mensaje="Se eliminará esta entrada de la bitácora. Esta acción no se puede deshacer."
            textoConfirmar="Eliminar entrada"
            cargando={pendiente}
            destructivo
          />
        </div>
      </div>
    </li>
  );
}
