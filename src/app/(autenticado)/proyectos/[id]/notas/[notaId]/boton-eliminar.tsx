"use client";

import { useState, useTransition } from "react";
import { Boton } from "@/componentes/boton";
import { Confirmacion } from "@/componentes/confirmacion";
import { accionEliminarNota } from "../acciones";

export function BotonEliminarNota({ id, proyectoId }: { id: string; proyectoId: string }) {
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
        alConfirmar={() => iniciar(() => accionEliminarNota(id, proyectoId))}
        titulo="Eliminar entrada"
        mensaje="Se eliminará esta entrada de la bitácora. Esta acción no se puede deshacer."
        textoConfirmar="Eliminar entrada"
        cargando={pendiente}
        destructivo
      />
    </>
  );
}
