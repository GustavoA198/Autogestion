"use client";

import { BotonEliminar } from "@/componentes/boton-eliminar";
import { accionEliminarTarea } from "../acciones";

export function BotonEliminarTarea({ id, nombre }: { id: string; nombre: string }) {
  return (
    <BotonEliminar
      alConfirmar={() => accionEliminarTarea(id)}
      titulo="Eliminar tarea"
      mensaje={`Se eliminará "${nombre}". Esta acción no se puede deshacer.`}
      textoConfirmar="Eliminar tarea"
    />
  );
}
