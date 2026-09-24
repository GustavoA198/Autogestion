"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/componentes/modal";
import { Boton } from "@/componentes/boton";
import { Insignia } from "@/componentes/insignia";
import { accionClonarTareas } from "./clonar-tareas-acciones";
import type { TareaUI } from "@/lib/tareas/operaciones";

const FRECUENCIA_LABEL: Record<string, string> = {
  DIARIA: "Diaria",
  SEMANAL: "Semanal",
  MENSUAL: "Mensual",
  PUNTUAL: "Puntual",
};

type Propiedades = {
  proyectoId: string;
  proyectos: { id: string; nombre: string }[];
  tareas: TareaUI[];
};

export function ClonarTareas({ proyectoId, proyectos, tareas }: Propiedades) {
  const [abierto, setAbierto] = useState(false);
  const [destinoId, setDestinoId] = useState("");
  const [seleccionadas, setSeleccionadas] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const tareasDisponibles = tareas.filter((t) => t.tipoFrecuencia !== "PUNTUAL");
  const otrosProyectos = proyectos.filter((p) => p.id !== proyectoId);
  const destinoNombre = proyectos.find((p) => p.id === destinoId)?.nombre;

  function alternarTarea(id: string) {
    setSeleccionadas((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function cerrar() {
    setAbierto(false);
    setDestinoId("");
    setSeleccionadas(new Set());
    setError(null);
  }

  function confirmar() {
    if (!destinoId || seleccionadas.size === 0) return;
    setError(null);
    startTransition(async () => {
      const resultado = await accionClonarTareas(proyectoId, destinoId, Array.from(seleccionadas));
      if (!resultado.ok) {
        setError(resultado.error ?? "Error al clonar las tareas.");
      }
      // Si ok, redirect ocurre en la server action
    });
  }

  const confirmacion = (selectedCount: number) =>
    `Se clonarán ${selectedCount} tarea${selectedCount !== 1 ? "s" : ""} al proyecto "${destinoNombre}".`;

  return (
    <>
      <Boton variante="secundario" tamano="pequeno" onClick={() => setAbierto(true)}>
        Clonar tareas
      </Boton>

      <Modal
        abierto={abierto}
        alCerrar={cerrar}
        titulo="Clonar tareas a otro proyecto"
        descripcion="Selecciona las tareas recurrentes que quieres duplicar."
        pie={
          <>
            <Boton variante="fantasma" onClick={cerrar}>
              Cancelar
            </Boton>
            <Boton
              variante="primario"
              disabled={!destinoId || seleccionadas.size === 0 || isPending}
              cargando={isPending}
              onClick={confirmar}
            >
              Clonar {seleccionadas.size > 0 ? `(${seleccionadas.size})` : ""}
            </Boton>
          </>
        }
      >
        <div className="space-y-4">
          {error && (
            <div className="alert alert-error text-sm" role="alert">
              {error}
            </div>
          )}

          <fieldset>
            <legend className="mb-2 text-sm font-medium">Proyecto destino</legend>
            <select
              className="select select-bordered w-full"
              value={destinoId}
              onChange={(e) => setDestinoId(e.target.value)}
            >
              <option value="">Selecciona un proyecto…</option>
              {otrosProyectos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-sm font-medium">
              Tareas recurrentes ({tareasDisponibles.length})
            </legend>
            {tareasDisponibles.length === 0 ? (
              <p className="text-sm opacity-70">Este proyecto no tiene tareas recurrentes.</p>
            ) : (
              <ul className="max-h-60 space-y-2 overflow-y-auto">
                {tareasDisponibles.map((tarea) => (
                  <li key={tarea.id}>
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-sm"
                        checked={seleccionadas.has(tarea.id)}
                        onChange={() => alternarTarea(tarea.id)}
                      />
                      <span className="flex-1 text-sm">{tarea.titulo}</span>
                      <Insignia tono="info" contorno>
                        {FRECUENCIA_LABEL[tarea.tipoFrecuencia]}
                      </Insignia>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </fieldset>

          {seleccionadas.size > 0 && destinoId && (
            <div className="alert alert-info text-sm">{confirmacion(seleccionadas.size)}</div>
          )}
        </div>
      </Modal>
    </>
  );
}
