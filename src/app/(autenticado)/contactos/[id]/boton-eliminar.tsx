"use client";

import { BotonEliminar } from "@/componentes/boton-eliminar";
import { accionEliminarContacto } from "../acciones";

export function BotonEliminarContacto({ id, nombre }: { id: string; nombre: string }) {
  return (
    <BotonEliminar
      alConfirmar={() => accionEliminarContacto(id)}
      titulo="Eliminar contacto"
      mensaje={`Se eliminará "${nombre}" con todos sus vínculos. Esta acción no se puede deshacer.`}
      textoConfirmar="Eliminar contacto"
    />
  );
}
