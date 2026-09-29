"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/componentes/modal";
import { Boton } from "@/componentes/boton";
import { Casilla } from "@/componentes/casilla";
import { EstadoError } from "@/componentes/estado-error";
import { Icono } from "@/componentes/icono";
import { Insignia } from "@/componentes/insignia";
import { Selector } from "@/componentes/selector";
import { FRECUENCIA_LABEL } from "@/lib/tareas/presentacion";
import { accionClonarTareas } from "./clonar-tareas-acciones";
import type { TareaUI } from "@/lib/tareas/operaciones";

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
      <Boton variante="fantasma" tamano="pequeno" onClick={() => setAbierto(true)}>
        <Icono nombre="copiar" tamano={14} />
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
        <div className="space-y-5">
          {error ? <EstadoError titulo="No se pudo clonar" mensaje={error} /> : null}

          <Selector
            etiqueta="Proyecto destino"
            value={destinoId}
            onChange={(e) => setDestinoId(e.target.value)}
            mensaje={
              otrosProyectos.length === 0 ? "No hay otros proyectos disponibles." : undefined
            }
          >
            <option value="">Selecciona un proyecto…</option>
            {otrosProyectos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </Selector>

          <fieldset>
            <legend className="mb-1.5 text-sm font-medium">
              Tareas recurrentes ({tareasDisponibles.length})
            </legend>
            {tareasDisponibles.length === 0 ? (
              <p className="text-suave text-sm">Este proyecto no tiene tareas recurrentes.</p>
            ) : (
              <div className="bg-hundida border-linea-tarjeta rounded-2xl border p-2">
                <ul className="divide-linea-tarjeta/60 divide-y">
                  {tareasDisponibles.map((tarea) => (
                    <li key={tarea.id} className="flex items-center justify-between gap-2 pr-2">
                      <Casilla
                        etiqueta={tarea.titulo}
                        checked={seleccionadas.has(tarea.id)}
                        onChange={() => alternarTarea(tarea.id)}
                      />
                      <Insignia tono="info" contorno>
                        {FRECUENCIA_LABEL[tarea.tipoFrecuencia]}
                      </Insignia>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </fieldset>

          {seleccionadas.size > 0 && destinoId ? (
            <p
              role="status"
              className="border-info/30 bg-info/8 text-info rounded-2xl border px-4 py-3 text-sm"
            >
              {confirmacion(seleccionadas.size)}
            </p>
          ) : null}
        </div>
      </Modal>
    </>
  );
}
