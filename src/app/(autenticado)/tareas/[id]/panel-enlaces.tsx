"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useAvisos } from "@/componentes/aviso";
import { Boton } from "@/componentes/boton";
import { Entrada } from "@/componentes/entrada";
import { Icono } from "@/componentes/icono";
import { Tarjeta } from "@/componentes/shell/tarjeta";
import { LIMITES_TAREA } from "@/lib/tareas/validacion";
import { accionAgregarEnlace, accionEliminarEnlace } from "../acciones";

type Enlace = { id: string; etiqueta: string; url: string };

// Solo se enlazan direcciones http o https; el nombre del sitio ayuda a reconocer el destino
function destinoSeguro(url: string): { href: string; sitio: string } | null {
  try {
    const u = new URL(url);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return { href: u.href, sitio: u.hostname.replace(/^www\./, "") };
  } catch {
    return null;
  }
}

export function PanelEnlaces({ tareaId, enlaces }: { tareaId: string; enlaces: Enlace[] }) {
  const { notificar } = useAvisos();
  const [, iniciar] = useTransition();
  const [agregando, iniciarAgregar] = useTransition();
  const [etiqueta, setEtiqueta] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | undefined>();

  function eliminar(id: string) {
    iniciar(async () => {
      const resultado = await accionEliminarEnlace(id);
      if (resultado.ok) notificar("Enlace eliminado.", "exito");
      else notificar(resultado.error ?? "No se pudo eliminar el enlace.", "critico");
    });
  }

  function agregar(evento: FormEvent) {
    evento.preventDefault();
    iniciarAgregar(async () => {
      const resultado = await accionAgregarEnlace(tareaId, etiqueta, url);
      if (resultado.ok) {
        setEtiqueta("");
        setUrl("");
        setError(undefined);
      } else {
        setError(resultado.error ?? "No se pudo agregar el enlace.");
      }
    });
  }

  return (
    <Tarjeta titulo="Enlaces">
      {enlaces.length === 0 ? (
        <p className="text-suave text-sm">
          Sin enlaces. Agrega documentos, tickets o cualquier referencia útil.
        </p>
      ) : (
        <ul className="lista-filas">
          {enlaces.map((enlace) => {
            const destino = destinoSeguro(enlace.url);
            return (
              <li key={enlace.id} className="tarjeta-fila flex items-center gap-2 px-4 py-2.5">
                <div className="min-w-0 flex-1">
                  {destino ? (
                    <a
                      href={destino.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="enlace inline-flex max-w-full items-center gap-1.5 text-sm font-bold"
                    >
                      <span className="truncate" title={enlace.etiqueta}>{enlace.etiqueta}</span>
                      <Icono nombre="enlace-externo" tamano={14} />
                      <span className="sr-only"> (se abre en una pestaña nueva)</span>
                    </a>
                  ) : (
                    <span className="text-sm font-bold break-words">{enlace.etiqueta}</span>
                  )}
                  <p
                    className="text-suave truncate font-mono text-xs"
                    title={destino?.sitio ?? enlace.url}
                  >
                    {destino?.sitio ?? enlace.url}
                  </p>
                </div>
                <Boton
                  variante="fantasma"
                  tamano="pequeno"
                  className="btn-square text-suave hover:text-error"
                  onClick={() => eliminar(enlace.id)}
                  aria-label={`Eliminar el enlace «${enlace.etiqueta}»`}
                >
                  <Icono nombre="papelera" tamano={16} />
                </Boton>
              </li>
            );
          })}
        </ul>
      )}
      <form onSubmit={agregar} className="space-y-3" noValidate>
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
          <Entrada
            etiqueta="Etiqueta"
            value={etiqueta}
            onChange={(e) => setEtiqueta(e.target.value)}
            maxLength={LIMITES_TAREA.enlaceEtiqueta}
            autoComplete="off"
          />
          <Entrada
            etiqueta="Dirección"
            type="url"
            inputMode="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            maxLength={LIMITES_TAREA.enlaceUrl}
            autoComplete="off"
            invalido={Boolean(error)}
            mensaje={error}
          />
        </div>
        <Boton type="submit" variante="secundario" cargando={agregando}>
          <Icono nombre="mas" tamano={16} />
          Agregar enlace
        </Boton>
      </form>
    </Tarjeta>
  );
}
