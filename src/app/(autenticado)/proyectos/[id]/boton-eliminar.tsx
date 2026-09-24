"use client";

import { useState, useTransition } from "react";
import { Boton } from "@/componentes/boton";
import { Confirmacion } from "@/componentes/confirmacion";
import { accionEliminarProyecto } from "../acciones";

type Resumen = { exclusivas: string[]; desvinculadas: string[] };

// Advierte de forma explícita qué credenciales se borran y cuáles solo se desvinculan
function mensajeEliminacion(nombre: string, { exclusivas, desvinculadas }: Resumen): string {
  const partes = [`Se eliminará "${nombre}".`];
  if (exclusivas.length > 0) {
    partes.push(
      `Credenciales exclusivas que se borrarán (${exclusivas.length}): ${exclusivas.join(", ")}.`,
    );
  }
  if (desvinculadas.length > 0) {
    partes.push(
      `Credenciales compartidas o globales que solo se desvincularán y se conservan (${desvinculadas.length}): ${desvinculadas.join(", ")}.`,
    );
  }
  partes.push("Esta acción no se puede deshacer.");
  return partes.join(" ");
}

export function BotonEliminar({
  id,
  nombre,
  resumen,
}: {
  id: string;
  nombre: string;
  resumen: Resumen;
}) {
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
        mensaje={mensajeEliminacion(nombre, resumen)}
        textoConfirmar="Eliminar proyecto"
        cargando={pendiente}
        destructivo
      />
    </>
  );
}
