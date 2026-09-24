"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Insignia } from "@/componentes/insignia";
import { Boton } from "@/componentes/boton";
import { accionCompletarTarea } from "./acciones";

const FRECUENCIA_LABEL: Record<string, string> = {
  DIARIA: "Diaria",
  SEMANAL: "Semanal",
  MENSUAL: "Mensual",
  PUNTUAL: "Puntual",
};

const DIA_SEMANA_LABEL = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function frecuenciaDetalle(tarea: {
  tipoFrecuencia: string;
  diaSemana: number | null;
  diaMes: number | null;
  fechaPuntual: Date | null;
}): string {
  switch (tarea.tipoFrecuencia) {
    case "DIARIA":
      return "Cada día";
    case "SEMANAL":
      return `Cada ${DIA_SEMANA_LABEL[tarea.diaSemana ?? 0]}`;
    case "MENSUAL":
      return `Día ${tarea.diaMes}`;
    case "PUNTUAL":
      if (!tarea.fechaPuntual) return "Sin fecha";
      return tarea.fechaPuntual.toLocaleDateString("es-CO", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    default:
      return "";
  }
}

export function TareaFila({
  tarea,
  marcable = false,
}: {
  tarea: {
    id: string;
    titulo: string;
    descripcion: string | null;
    tipoFrecuencia: string;
    diaSemana: number | null;
    diaMes: number | null;
    fechaPuntual: Date | null;
    proyecto: { id: string; nombre: string } | null;
    activa: boolean;
  };
  marcable?: boolean;
}) {
  const [pendiente, marcar] = useTransition();

  async function marcarCompletada() {
    await accionCompletarTarea(tarea.id);
  }

  return (
    <li className="flex items-start justify-between gap-3 py-3">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{tarea.titulo}</span>
          <Insignia tono="info" contorno>
            {FRECUENCIA_LABEL[tarea.tipoFrecuencia] ?? tarea.tipoFrecuencia}
          </Insignia>
          <span className="text-sm opacity-70">{frecuenciaDetalle(tarea)}</span>
        </div>
        {tarea.descripcion && <p className="mt-1 text-sm opacity-70">{tarea.descripcion}</p>}
        {tarea.proyecto && (
          <p className="mt-1 text-xs opacity-60">Proyecto: {tarea.proyecto.nombre}</p>
        )}
        <div className="mt-1 flex gap-1">
          <Link href={`/tareas/${tarea.id}/editar`} className="btn btn-ghost btn-xs">
            Editar
          </Link>
          {marcable && (
            <Boton
              type="button"
              variante="fantasma"
              tamano="pequeno"
              cargando={pendiente}
              onClick={() => marcar(marcarCompletada)}
            >
              Marcar completada
            </Boton>
          )}
        </div>
      </div>
    </li>
  );
}
