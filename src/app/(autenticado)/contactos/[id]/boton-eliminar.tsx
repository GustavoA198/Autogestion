"use client";

import { useState, useTransition } from "react";
import { Boton } from "@/componentes/boton";
import { Confirmacion } from "@/componentes/confirmacion";
import { accionEliminarContacto } from "../acciones";

export function BotonEliminarContacto({ id, nombre }: { id: string; nombre: string }) {
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
        alConfirmar={() => iniciar(() => accionEliminarContacto(id))}
        titulo="Eliminar contacto"
        mensaje={`Se eliminara "${nombre}" con todos sus vinculos. Esta accion no se puede deshacer.`}
        textoConfirmar="Eliminar contacto"
        cargando={pendiente}
        destructivo
      />
    </>
  );
}
