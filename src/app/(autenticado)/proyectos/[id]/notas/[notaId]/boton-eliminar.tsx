"use client";

import { BotonEliminar } from "@/componentes/boton-eliminar";
import { accionEliminarNota } from "../acciones";

export function BotonEliminarNota({ id, proyectoId }: { id: string; proyectoId: string }) {
  return (
    <BotonEliminar
      alConfirmar={() => accionEliminarNota(id, proyectoId)}
      titulo="Eliminar entrada"
      mensaje="Se eliminará esta entrada de la bitácora. Esta acción no se puede deshacer."
      textoConfirmar="Eliminar entrada"
    />
  );
}
