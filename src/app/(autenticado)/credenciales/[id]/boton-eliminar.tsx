"use client";

import { useState, useTransition } from "react";
import { Boton } from "@/componentes/boton";
import { Confirmacion } from "@/componentes/confirmacion";
import { accionEliminarCredencial } from "../acciones";

export function BotonEliminarCredencial({ id, nombre }: { id: string; nombre: string }) {
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
        alConfirmar={() => iniciar(() => accionEliminarCredencial(id))}
        titulo="Eliminar credencial"
        mensaje={`Se eliminará "${nombre}" con su secreto y su historial. Esta acción no se puede deshacer.`}
        textoConfirmar="Eliminar credencial"
        cargando={pendiente}
        destructivo
      />
    </>
  );
}
