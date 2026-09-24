"use client";

import { useState, useTransition } from "react";
import { Boton } from "@/componentes/boton";
import { Confirmacion } from "@/componentes/confirmacion";
import { accionEliminarProyecto } from "../acciones";

export function BotonEliminar({ id, nombre }: { id: string; nombre: string }) {
  const [abierto, setAbierto] = useState(false);
  const [pendiente, iniciar] = useTransition();

  return (
    <>
      <Boton variante="peligro" onClick={() => setAbierto(true)}>
        Eliminar
      </Boton>
      <Confirmacion
        abierto={abierto}
        alCancelar={() => setAbierto(false)}
        alConfirmar={() => iniciar(() => accionEliminarProyecto(id))}
        titulo="Eliminar proyecto"
        mensaje={`Se eliminará "${nombre}". Esta acción no se puede deshacer.`}
        textoConfirmar="Eliminar proyecto"
        cargando={pendiente}
        destructivo
      />
    </>
  );
}
