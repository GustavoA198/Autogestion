"use client";

import { useState, useTransition } from "react";
import { Boton } from "@/componentes/boton";
import { Confirmacion } from "@/componentes/confirmacion";
import { accionEliminarTarea } from "../acciones";

export function BotonEliminarTarea({ id, nombre }: { id: string; nombre: string }) {
  const [abierto, setAbierto] = useState(false);
  const [pendiente, iniciar] = useTransition();

  return (
    <>
      <Boton type="button" variante="fantasma" onClick={() => setAbierto(true)}>
        Eliminar
      </Boton>
      <Confirmacion
        abierto={abierto}
        alCancelar={() => setAbierto(false)}
        alConfirmar={() => iniciar(() => accionEliminarTarea(id))}
        titulo="Eliminar tarea"
        mensaje={`¿Eliminar "${nombre}"? No se puede deshacer.`}
        textoConfirmar="Eliminar"
        cargando={pendiente}
        destructivo
      />
    </>
  );
}
