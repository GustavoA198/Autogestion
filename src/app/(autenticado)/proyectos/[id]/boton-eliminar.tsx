"use client";

import { useState, useTransition } from "react";
import { Boton } from "@/componentes/boton";
import { Confirmacion } from "@/componentes/confirmacion";
import { accionEliminarProyecto } from "../acciones";

type Resumen = { exclusivas: string[]; desvinculadas: string[] };

function mensajeEliminacion(
  nombre: string,
  resumenCredenciales: Resumen,
  resumenContactos: Resumen,
): string {
  const partes = [`Se eliminara "${nombre}".`];
  if (resumenCredenciales.exclusivas.length > 0) {
    partes.push(
      `Credenciales exclusivas que se borraran (${resumenCredenciales.exclusivas.length}): ${resumenCredenciales.exclusivas.join(", ")}.`,
    );
  }
  if (resumenCredenciales.desvinculadas.length > 0) {
    partes.push(
      `Credenciales compartidas o globales que solo se desvinculan (${resumenCredenciales.desvinculadas.length}): ${resumenCredenciales.desvinculadas.join(", ")}.`,
    );
  }
  if (resumenContactos.exclusivas.length > 0) {
    partes.push(
      `Contactos exclusivos que se borraran (${resumenContactos.exclusivas.length}): ${resumenContactos.exclusivas.join(", ")}.`,
    );
  }
  if (resumenContactos.desvinculadas.length > 0) {
    partes.push(
      `Contactos compartidos o globales que solo se desvinculan (${resumenContactos.desvinculadas.length}): ${resumenContactos.desvinculadas.join(", ")}.`,
    );
  }
  partes.push("Esta accion no se puede deshacer.");
  return partes.join(" ");
}

export function BotonEliminar({
  id,
  nombre,
  resumenCredenciales,
  resumenContactos,
}: {
  id: string;
  nombre: string;
  resumenCredenciales: Resumen;
  resumenContactos: Resumen;
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
        mensaje={mensajeEliminacion(nombre, resumenCredenciales, resumenContactos)}
        textoConfirmar="Eliminar proyecto"
        cargando={pendiente}
        destructivo
      />
    </>
  );
}
