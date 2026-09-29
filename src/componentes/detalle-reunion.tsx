"use client";

import { useState, type ReactNode } from "react";
import { Boton } from "@/componentes/boton";
import { Icono } from "@/componentes/icono";
import { Insignia } from "@/componentes/insignia";
import { useZonaNavegador } from "@/componentes/calendario/hooks";
import { Modal } from "@/componentes/modal";
import { dividirEnSegmentos } from "@/lib/calendario/enlaces";
import {
  ZONA_PREDETERMINADA,
  diaCivilDe,
  mismoDia,
  zonaDelNavegador,
  type DiaCivil,
} from "@/lib/calendario/fechas";
import {
  diaCorto,
  diasDeDiaCompleto,
  etiquetaDia,
  fechaDeReunion,
  formatoHora,
  rangoHoras,
} from "@/lib/calendario/formato";
import type { ReunionDetalle } from "@/lib/calendario/operaciones";
import { enlaceSeguro } from "@/lib/calendario/proveedor";

const RESPUESTAS: Record<string, string> = {
  accepted: "Aceptó",
  declined: "Rechazó",
  tentative: "Tal vez",
  needsAction: "Sin responder",
  tentativelyAccepted: "Tal vez",
  notResponded: "Sin responder",
  organizer: "Organizador",
  none: "Sin responder",
};

const ESTADOS: Record<string, string> = {
  confirmed: "Confirmado",
  tentative: "Provisional",
  cancelled: "Cancelado",
};

// Texto del horario de una reunión en la zona del navegador; los de día completo no muestran horas
export function rangoHorario(r: ReunionDetalle, zona: string = zonaDelNavegador()): string {
  return rangoHoras(r, zona);
}

// Muestra texto plano con las URLs http/https como enlaces; nunca inserta HTML
function TextoConEnlaces({ texto }: { texto: string }) {
  return (
    <>
      {dividirEnSegmentos(texto).map((s, i) =>
        s.url ? (
          <a
            key={i}
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            className="enlace break-all"
          >
            {s.texto}
          </a>
        ) : (
          <span key={i}>{s.texto}</span>
        ),
      )}
    </>
  );
}

const INVITADOS_VISIBLES = 5;

const TONO_ESTADO: Record<string, "success" | "warning" | "error"> = {
  confirmed: "success",
  tentative: "warning",
  cancelled: "error",
};

// Cuenta las respuestas de los invitados agrupando las que equivalen a "sin responder"
function resumenRespuestas(invitados: ReunionDetalle["invitados"]): string {
  let aceptaron = 0;
  let rechazaron = 0;
  let talVez = 0;
  let sinResponder = 0;
  for (const invitado of invitados) {
    const respuesta = invitado.respuesta;
    if (respuesta === "accepted" || respuesta === "organizer") aceptaron++;
    else if (respuesta === "declined") rechazaron++;
    else if (respuesta === "tentative" || respuesta === "tentativelyAccepted") talVez++;
    else sinResponder++;
  }
  return [
    aceptaron ? `${aceptaron} aceptaron` : null,
    rechazaron ? `${rechazaron} rechazaron` : null,
    talVez ? `${talVez} tal vez` : null,
    sinResponder ? `${sinResponder} sin responder` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

// Detalle completo de una reunión sincronizada
export function DetalleReunion({ reunion }: { reunion: ReunionDetalle }) {
  const zona = useZonaNavegador() ?? ZONA_PREDETERMINADA;
  const [verTodos, setVerTodos] = useState(false);
  const enlaceUnirse = enlaceSeguro(reunion.enlaceReunion);
  const enlaceEvento = enlaceSeguro(reunion.enlaceEvento);
  const invitados = verTodos ? reunion.invitados : reunion.invitados.slice(0, INVITADOS_VISIBLES);
  const ocultos = reunion.invitados.length - INVITADOS_VISIBLES;

  const filas: { etiqueta: string; valor: ReactNode }[] = [
    {
      etiqueta: "Fecha",
      valor: `${fechaDeReunion(reunion, zona)} · ${rangoHorario(reunion, zona)}`,
    },
    { etiqueta: "Calendario", valor: reunion.proveedor === "GOOGLE" ? "Google" : "Microsoft" },
    {
      etiqueta: "Estado",
      valor: reunion.estado ? (
        <Insignia tono={TONO_ESTADO[reunion.estado] ?? "ghost"}>
          {ESTADOS[reunion.estado] ?? reunion.estado}
        </Insignia>
      ) : null,
    },
    {
      etiqueta: "Ubicación",
      valor: reunion.ubicacion ? <TextoConEnlaces texto={reunion.ubicacion} /> : null,
    },
    { etiqueta: "Organizador", valor: reunion.organizador },
  ].filter((f) => f.valor);

  return (
    <div className="space-y-5 text-sm">
      {enlaceUnirse || enlaceEvento ? (
        <div className="flex flex-wrap gap-2">
          {enlaceUnirse ? (
            <a
              href={enlaceUnirse}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
            >
              <Icono nombre="video" tamano={18} />
              Unirse a la reunión
            </a>
          ) : null}
          {enlaceEvento ? (
            <a
              href={enlaceEvento}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline"
            >
              <Icono nombre="enlace-externo" tamano={18} />
              Abrir en el calendario
            </a>
          ) : null}
        </div>
      ) : null}

      <dl className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-[7rem_minmax(0,1fr)]">
        {filas.map((f) => (
          <div key={f.etiqueta} className="contents">
            <dt className="text-suave text-xs font-bold tracking-wide uppercase sm:pt-0.5">
              {f.etiqueta}
            </dt>
            <dd className="min-w-0 break-words">{f.valor}</dd>
          </div>
        ))}
      </dl>

      {reunion.descripcion ? (
        <section>
          <h3 className="text-suave mb-2 text-xs font-bold tracking-wide uppercase">Descripción</h3>
          <div className="bg-hundida border-linea-tarjeta max-h-56 overflow-y-auto rounded-2xl border p-4 leading-relaxed whitespace-pre-wrap">
            <TextoConEnlaces texto={reunion.descripcion} />
          </div>
        </section>
      ) : null}

      {reunion.invitados.length > 0 ? (
        <section>
          <h3 className="text-suave text-xs font-bold tracking-wide uppercase">
            Invitados ({reunion.invitados.length})
          </h3>
          <p className="text-suave mt-0.5 text-xs">{resumenRespuestas(reunion.invitados)}</p>
          <ul className="bg-hundida border-linea-tarjeta divide-linea-tarjeta/60 mt-2 divide-y overflow-hidden rounded-2xl border">
            {invitados.map((i, idx) => (
              <li
                key={`${i.email ?? i.nombre ?? "invitado"}-${idx}`}
                className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-3 py-2"
              >
                <span className="min-w-0">
                  <span className="block font-medium">{i.nombre ?? i.email}</span>
                  {i.nombre && i.email ? (
                    <span className="text-suave block text-xs break-all">{i.email}</span>
                  ) : null}
                </span>
                <span className="flex flex-wrap gap-1.5">
                  {i.respuesta ? (
                    <Insignia tono="ghost">{RESPUESTAS[i.respuesta] ?? i.respuesta}</Insignia>
                  ) : null}
                  {i.opcional ? <Insignia tono="ghost">Opcional</Insignia> : null}
                </span>
              </li>
            ))}
          </ul>
          {ocultos > 0 ? (
            <Boton
              variante="fantasma"
              tamano="pequeno"
              className="mt-2"
              aria-expanded={verTodos}
              onClick={() => setVerTodos((estado) => !estado)}
            >
              {verTodos ? "Mostrar menos" : `Mostrar los ${ocultos} restantes`}
            </Boton>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

// Lista compacta de reuniones del panel; cada fila abre el detalle completo en un modal
export function ListaReunionesPanel({
  reuniones,
  zona,
  hoy,
}: {
  reuniones: ReunionDetalle[];
  zona: string;
  // Con el día de referencia, las reuniones de otros días muestran su etiqueta ("Mañana", "vie 26")
  hoy?: DiaCivil;
}) {
  const [seleccionada, setSeleccionada] = useState<ReunionDetalle | null>(null);
  return (
    <>
      <ul className="lista-filas">
        {reuniones.map((r) => {
          const dia = r.diaCompleto
            ? diasDeDiaCompleto(r).desde
            : diaCivilDe(new Date(r.inicio), zona);
          const etiqueta = hoy && !mismoDia(dia, hoy) ? etiquetaCorta(dia, hoy) : null;
          return (
            <li key={r.idExterno}>
              <button
                type="button"
                className="tarjeta-fila flex min-h-11 w-full cursor-pointer items-start gap-3 px-4 py-3 text-left"
                onClick={() => setSeleccionada(r)}
              >
                <span className="w-16 shrink-0 pt-0.5 text-xs">
                  {etiqueta ? (
                    <span className="text-primary block font-bold capitalize">{etiqueta}</span>
                  ) : null}
                  <span className="text-suave block font-mono">
                    {r.diaCompleto ? "Todo el día" : formatoHora(new Date(r.inicio), zona)}
                  </span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold" title={r.titulo}>
                    {r.titulo}
                  </span>
                  {enlaceSeguro(r.enlaceReunion) ? (
                    <span className="text-primary mt-0.5 inline-flex items-center gap-1 text-xs">
                      <Icono nombre="video" tamano={14} />
                      Con enlace de reunión
                    </span>
                  ) : null}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <Modal
        abierto={seleccionada !== null}
        alCerrar={() => setSeleccionada(null)}
        titulo={seleccionada?.titulo ?? ""}
        ancho="amplio"
      >
        {seleccionada ? <DetalleReunion reunion={seleccionada} /> : null}
      </Modal>
    </>
  );
}

function etiquetaCorta(dia: DiaCivil, hoy: DiaCivil): string {
  const texto = etiquetaDia(dia, hoy);
  return texto === "Hoy" || texto === "Mañana" || texto === "Ayer"
    ? texto
    : `${diaCorto(dia)} ${dia.dia}`;
}
