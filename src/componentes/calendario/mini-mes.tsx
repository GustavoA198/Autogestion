"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Icono } from "@/componentes/icono";
import {
  claveDia,
  compararDias,
  mismoDia,
  primerDiaDelMes,
  sumarDias,
  sumarMeses,
  type DiaCivil,
} from "@/lib/calendario/fechas";
import { INICIALES_DIA, NOMBRES_DIA, fechaLarga, tituloMes } from "@/lib/calendario/formato";
import { rangoDeVista, diasDelRango, type RangoDias } from "@/lib/calendario/rango";

type Propiedades = {
  // Día seleccionado y rango que muestra la vista principal (se resalta)
  seleccionado: DiaCivil;
  rangoActivo: RangoDias | null;
  hoy: DiaCivil;
  alElegir: (dia: DiaCivil) => void;
  // Claves AAAA-MM-DD con reuniones (punto redondo) y con tareas (punto en rombo) en lo ya cargado
  diasConReuniones?: ReadonlySet<string>;
  diasConTareas?: ReadonlySet<string>;
};

function estaEnRango(dia: DiaCivil, rango: RangoDias | null): boolean {
  return (
    rango !== null && compararDias(dia, rango.desde) >= 0 && compararDias(dia, rango.hasta) < 0
  );
}

// Calendario pequeño para saltar de fecha; sigue el patrón de cuadrícula de fechas con teclado
export function MiniMes({
  seleccionado,
  rangoActivo,
  hoy,
  alElegir,
  diasConReuniones,
  diasConTareas,
}: Propiedades) {
  const [mostrado, setMostrado] = useState(() => primerDiaDelMes(seleccionado));
  const [seleccionAnterior, setSeleccionAnterior] = useState(seleccionado);
  const [foco, setFoco] = useState(seleccionado);
  const refBotones = useRef<Map<string, HTMLButtonElement>>(new Map());
  const refEnfocar = useRef(false);

  // Cuando la fecha cambia desde fuera (flechas, botón Hoy) el mes visible la sigue
  if (!mismoDia(seleccionado, seleccionAnterior)) {
    setSeleccionAnterior(seleccionado);
    setMostrado(primerDiaDelMes(seleccionado));
    setFoco(seleccionado);
  }

  const dias = useMemo(() => diasDelRango(rangoDeVista("mes", mostrado)), [mostrado]);
  const semanas = useMemo(
    () => Array.from({ length: 6 }, (_, fila) => dias.slice(fila * 7, fila * 7 + 7)),
    [dias],
  );

  // Si el día con foco quedó fuera del mes visible, la tecla Tab entra por el primer día del mes
  const focoEfectivo = dias.some((dia) => mismoDia(dia, foco)) ? foco : mostrado;

  // Tras una tecla de flecha el foco sigue al día nuevo una vez renderizado
  useEffect(() => {
    if (!refEnfocar.current) return;
    refEnfocar.current = false;
    refBotones.current.get(claveDia(foco))?.focus();
  }, [foco, mostrado]);

  function moverFoco(destino: DiaCivil) {
    refEnfocar.current = true;
    setFoco(destino);
    if (!dias.some((dia) => mismoDia(dia, destino))) setMostrado(primerDiaDelMes(destino));
  }

  function alPulsarTecla(evento: KeyboardEvent<HTMLTableElement>) {
    const cambios: Record<string, () => DiaCivil> = {
      ArrowLeft: () => sumarDias(foco, -1),
      ArrowRight: () => sumarDias(foco, 1),
      ArrowUp: () => sumarDias(foco, -7),
      ArrowDown: () => sumarDias(foco, 7),
      PageUp: () => sumarMeses(foco, -1),
      PageDown: () => sumarMeses(foco, 1),
    };
    const calcular = cambios[evento.key];
    if (!calcular) return;
    evento.preventDefault();
    evento.stopPropagation();
    moverFoco(calcular());
  }

  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold first-letter:uppercase" aria-live="polite">
          {tituloMes(mostrado)}
        </h3>
        <div className="flex items-center">
          <button
            type="button"
            className="btn btn-ghost btn-square btn-sm"
            aria-label="Mes anterior"
            onClick={() => setMostrado(sumarMeses(mostrado, -1))}
          >
            <Icono nombre="chevron-izquierda" tamano={18} />
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-square btn-sm"
            aria-label="Mes siguiente"
            onClick={() => setMostrado(sumarMeses(mostrado, 1))}
          >
            <Icono nombre="chevron-derecha" tamano={18} />
          </button>
        </div>
      </div>
      <table
        role="grid"
        aria-label={`Elegir fecha, ${tituloMes(mostrado)}`}
        onKeyDown={alPulsarTecla}
        className="w-full table-fixed border-collapse"
      >
        <thead>
          <tr>
            {INICIALES_DIA.map((inicial, indice) => (
              <th
                key={NOMBRES_DIA[indice]}
                scope="col"
                className="text-suave h-8 text-xs font-medium"
              >
                <span aria-hidden="true">{inicial}</span>
                <span className="sr-only">{NOMBRES_DIA[indice]}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {semanas.map((semana) => (
            <tr key={semana[0].dia + "-" + semana[0].mes}>
              {semana.map((dia) => {
                const clave = claveDia(dia);
                const esHoy = mismoDia(dia, hoy);
                const esSeleccion = mismoDia(dia, seleccionado);
                const delMes = dia.mes === mostrado.mes;
                const enRango = estaEnRango(dia, rangoActivo);
                const conReuniones = diasConReuniones?.has(clave) ?? false;
                const conTareas = diasConTareas?.has(clave) ?? false;
                return (
                  <td
                    key={clave}
                    role="gridcell"
                    aria-selected={esSeleccion}
                    className={`p-0 text-center ${enRango ? "bg-hover" : ""}`}
                  >
                    <button
                      type="button"
                      ref={(elemento) => {
                        if (elemento) refBotones.current.set(clave, elemento);
                        else refBotones.current.delete(clave);
                      }}
                      tabIndex={mismoDia(dia, focoEfectivo) ? 0 : -1}
                      aria-label={`${fechaLarga(dia, hoy, true)}${
                        conReuniones ? ", con reuniones" : ""
                      }${conTareas ? ", con tareas que vencen" : ""}`}
                      aria-current={esHoy ? "date" : undefined}
                      onClick={() => alElegir(dia)}
                      className={`relative mx-auto grid size-9 cursor-pointer place-items-center rounded-full text-xs tabular-nums transition-colors duration-150 [@media(pointer:coarse)]:size-11 ${
                        esSeleccion
                          ? "bg-primary text-primary-content font-bold"
                          : esHoy
                            ? "border-primary text-primary border-2 font-bold"
                            : delMes
                              ? "hover:bg-base-content/8 font-medium"
                              : "text-suave hover:bg-base-content/8"
                      }`}
                    >
                      {dia.dia}
                      {conReuniones || conTareas ? (
                        <span
                          className="absolute bottom-1 left-1/2 flex -translate-x-1/2 items-center gap-0.5"
                          aria-hidden="true"
                        >
                          {conReuniones ? (
                            <span className="size-1 rounded-full bg-current" />
                          ) : null}
                          {conTareas ? <span className="size-1 rotate-45 bg-current" /> : null}
                        </span>
                      ) : null}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
