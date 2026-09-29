"use client";

import { useId, useRef, useState, useTransition, type KeyboardEvent } from "react";
import { useAvisos } from "@/componentes/aviso";
import { Boton, clasesBoton } from "@/componentes/boton";
import { Icono } from "@/componentes/icono";
import { accionAsignarFecha } from "./acciones";

// Hoy en la zona del navegador como AAAA-MM-DD, para proponer una fecha inicial
function hoyLocal(): string {
  const ahora = new Date();
  const mes = String(ahora.getMonth() + 1).padStart(2, "0");
  const dia = String(ahora.getDate()).padStart(2, "0");
  return `${ahora.getFullYear()}-${mes}-${dia}`;
}

type Propiedades = { tareaId: string; titulo: string };

// Botón "Asignar fecha" con un control inline mínimo: al guardar la tarea sale de Pendientes y pasa al calendario
export function AsignarFecha({ tareaId, titulo }: Propiedades) {
  const { notificar } = useAvisos();
  const [abierto, setAbierto] = useState(false);
  const [fecha, setFecha] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [guardando, guardar] = useTransition();
  const idCampo = useId();
  const idError = `${idCampo}-error`;
  const refCampo = useRef<HTMLInputElement>(null);
  const refBoton = useRef<HTMLButtonElement>(null);

  function abrir() {
    setFecha(hoyLocal());
    setError(null);
    setAbierto(true);
    // El campo existe tras el render: se enfoca en el siguiente cuadro
    requestAnimationFrame(() => refCampo.current?.focus());
  }

  function cerrar() {
    setAbierto(false);
    setError(null);
    requestAnimationFrame(() => refBoton.current?.focus());
  }

  function confirmar() {
    if (fecha === "") {
      setError("Elige una fecha.");
      refCampo.current?.focus();
      return;
    }
    guardar(async () => {
      const resultado = await accionAsignarFecha(tareaId, fecha);
      if (!resultado.ok) {
        setError(resultado.error ?? "No se pudo asignar la fecha.");
        refCampo.current?.focus();
        return;
      }
      setAbierto(false);
      notificar(`"${titulo}" pasó al calendario.`, "exito");
    });
  }

  function alPulsarTecla(evento: KeyboardEvent<HTMLDivElement>) {
    if (evento.key === "Escape") {
      evento.stopPropagation();
      cerrar();
    } else if (evento.key === "Enter" && evento.target instanceof HTMLInputElement) {
      evento.preventDefault();
      confirmar();
    }
  }

  if (!abierto) {
    return (
      <button
        ref={refBoton}
        type="button"
        className={clasesBoton("secundario", "pequeno")}
        onClick={abrir}
        aria-label={`Asignar fecha a "${titulo}"`}
      >
        <Icono nombre="calendario" tamano={16} />
        Asignar fecha
      </button>
    );
  }

  return (
    <div role="group" aria-label={`Asignar fecha a "${titulo}"`} onKeyDown={alPulsarTecla}>
      <div className="flex flex-wrap items-end gap-2">
        <div>
          <label htmlFor={idCampo} className="text-suave mb-1 block text-xs font-medium">
            Fecha
          </label>
          <input
            ref={refCampo}
            id={idCampo}
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className={`input input-sm ${error ? "input-error" : ""}`}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? idError : undefined}
            disabled={guardando}
          />
        </div>
        <Boton type="button" tamano="pequeno" onClick={confirmar} cargando={guardando}>
          Guardar
        </Boton>
        <Boton
          type="button"
          variante="fantasma"
          tamano="pequeno"
          onClick={cerrar}
          disabled={guardando}
        >
          Cancelar
        </Boton>
      </div>
      {error ? (
        <p id={idError} role="alert" className="text-error mt-1.5 flex items-start gap-1.5 text-sm">
          <Icono nombre="error" tamano={16} className="mt-0.5 shrink-0" />
          {error}
        </p>
      ) : null}
    </div>
  );
}
