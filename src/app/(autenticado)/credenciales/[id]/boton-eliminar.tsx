"use client";

import { BotonEliminar } from "@/componentes/boton-eliminar";
import { accionEliminarCredencial } from "../acciones";

export function BotonEliminarCredencial({ id, nombre }: { id: string; nombre: string }) {
  return (
    <BotonEliminar
      alConfirmar={() => accionEliminarCredencial(id)}
      titulo="Eliminar credencial"
      mensaje={`Se eliminará "${nombre}" con su secreto y su historial. Esta acción no se puede deshacer.`}
      textoConfirmar="Eliminar credencial"
    />
  );
}
