"use client";

import { BotonEliminar } from "@/componentes/boton-eliminar";
import { accionEliminarProyecto } from "../acciones";

type Resumen = { exclusivas: string[]; desvinculadas: string[] };

function mensajeEliminacion(
  nombre: string,
  resumenCredenciales: Resumen,
  resumenContactos: Resumen,
): string {
  const partes = [`Se eliminará "${nombre}".`];
  if (resumenCredenciales.exclusivas.length > 0) {
    partes.push(
      `Credenciales exclusivas que se borrarán (${resumenCredenciales.exclusivas.length}): ${resumenCredenciales.exclusivas.join(", ")}.`,
    );
  }
  if (resumenCredenciales.desvinculadas.length > 0) {
    partes.push(
      `Credenciales compartidas o globales que solo se desvinculan (${resumenCredenciales.desvinculadas.length}): ${resumenCredenciales.desvinculadas.join(", ")}.`,
    );
  }
  if (resumenContactos.exclusivas.length > 0) {
    partes.push(
      `Contactos exclusivos que se borrarán (${resumenContactos.exclusivas.length}): ${resumenContactos.exclusivas.join(", ")}.`,
    );
  }
  if (resumenContactos.desvinculadas.length > 0) {
    partes.push(
      `Contactos compartidos o globales que solo se desvinculan (${resumenContactos.desvinculadas.length}): ${resumenContactos.desvinculadas.join(", ")}.`,
    );
  }
  partes.push("Esta acción no se puede deshacer.");
  return partes.join(" ");
}

export function BotonEliminarProyecto({
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
  return (
    <BotonEliminar
      alConfirmar={() => accionEliminarProyecto(id)}
      titulo="Eliminar proyecto"
      mensaje={mensajeEliminacion(nombre, resumenCredenciales, resumenContactos)}
      textoConfirmar="Eliminar proyecto"
    />
  );
}
