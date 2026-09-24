"use client";

import { useState, useEffect, useActionState, startTransition } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { TituloSeccion } from "@/componentes/shell/titulo-seccion";
import { EstadoVacio } from "@/componentes/estado-vacio";
import { Boton } from "@/componentes/boton";
import { Modal } from "@/componentes/modal";
import { Entrada } from "@/componentes/entrada";
import { AreaTexto } from "@/componentes/area-texto";
import { Selector } from "@/componentes/selector";
import { Insignia } from "@/componentes/insignia";
import {
  accionCrearReunion,
  accionSincronizarCalendario,
  obtenerEstadoCalendario,
  type EstadoReunion,
} from "./acciones";
import type { EventoCalendario } from "@/lib/calendario/proveedor";
import { formatters } from "@/lib/tiempo";

type EstadoCalendario = {
  google: { conectado: boolean; configurado: boolean };
  microsoft: { conectado: boolean; configurado: boolean };
};

export default function Calendario() {
  const searchParams = useSearchParams();
  const [modalAbierto, setModalAbierto] = useState(false);
  const [reuniones] = useState<EventoCalendario[]>([]);
  const [estado, setEstado] = useState<EstadoCalendario>({
    google: { conectado: false, configurado: false },
    microsoft: { conectado: false, configurado: false },
  });
  const [errorBanner, setErrorBanner] = useState<{ google?: string; microsoft?: string }>({});
  const [sincronizando, setSincronizando] = useState<{ google: boolean; microsoft: boolean }>({
    google: false,
    microsoft: false,
  });

  useEffect(() => {
    obtenerEstadoCalendario()
      .then(setEstado)
      .catch(() => {
        setEstado({
          google: { conectado: false, configurado: false },
          microsoft: { conectado: false, configurado: false },
        });
      });
  }, []);

  useEffect(() => {
    const error = searchParams.get("error");
    const conectado = searchParams.get("conectado");
    startTransition(() => {
      if (error) {
        const origen = searchParams.get("origen") ?? "google";
        setErrorBanner((prev) => ({
          ...prev,
          [origen]: `Error de OAuth: ${decodeURIComponent(error)}`,
        }));
      }
      if (conectado) setErrorBanner({});
    });
  }, [searchParams]);

  const { google, microsoft } = estado;

  // Ningún calendario configurado
  if (!google.configurado && !microsoft.configurado) {
    return (
      <>
        <TituloSeccion
          modulo="Agenda"
          titulo="Calendario"
          descripcion="Integración con Google Calendar y Microsoft Calendar."
        />
        <EstadoVacio
          icono="calendario"
          titulo="Calendarios pendientes de configurar"
          descripcion="Agrega las variables de Google y/o Microsoft en .env para activar las integraciones."
        />
      </>
    );
  }

  // Ningún calendario conectado
  if (!google.conectado && !microsoft.conectado) {
    return (
      <>
        <TituloSeccion
          modulo="Agenda"
          titulo="Calendario"
          descripcion="Conecta al menos una cuenta de calendario para ver y agendar reuniones."
        />
        <div className="space-y-4">
          {google.configurado && (
            <EstadoVacio
              icono="calendario"
              titulo="Google Calendar no conectado"
              descripcion="Autoriza la aplicación para acceder a tu calendario de Google."
              accion={
                <Link href="/api/calendario/google/conectar" className="btn btn-primary">
                  Conectar con Google Calendar
                </Link>
              }
            />
          )}
          {microsoft.configurado && (
            <EstadoVacio
              icono="calendario"
              titulo="Microsoft Calendar no conectado"
              descripcion="Autoriza la aplicación para acceder a tu calendario de Microsoft."
              accion={
                <Link href="/api/calendario/microsoft/conectar" className="btn btn-primary">
                  Conectar con Microsoft Calendar
                </Link>
              }
            />
          )}
          {!google.configurado && !microsoft.configurado && (
            <EstadoVacio
              icono="calendario"
              titulo="Sin calendarios configurados"
              descripcion="Configura las variables de entorno para activar la integración."
            />
          )}
        </div>
      </>
    );
  }

  return (
    <>
      <TituloSeccion
        modulo="Agenda"
        titulo="Calendario"
        descripcion="Reuniones sincronizadas desde tus calendarios."
        accion={
          <div className="flex gap-2">
            {google.conectado && (
              <Boton
                variante="secundario"
                onClick={() => sincronizar("google")}
                cargando={sincronizando.google}
              >
                Sincronizar Google
              </Boton>
            )}
            {microsoft.conectado && (
              <Boton
                variante="secundario"
                onClick={() => sincronizar("microsoft")}
                cargando={sincronizando.microsoft}
              >
                Sincronizar Microsoft
              </Boton>
            )}
            <Boton onClick={() => setModalAbierto(true)}>Nueva reunión</Boton>
          </div>
        }
      />

      {errorBanner.google && (
        <div className="alert alert-warning mb-4" role="alert">
          <span>Google: {errorBanner.google}</span>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setErrorBanner((p) => ({ ...p, google: undefined }))}
          >
            Cerrar
          </button>
        </div>
      )}
      {errorBanner.microsoft && (
        <div className="alert alert-warning mb-4" role="alert">
          <span>Microsoft: {errorBanner.microsoft}</span>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setErrorBanner((p) => ({ ...p, microsoft: undefined }))}
          >
            Cerrar
          </button>
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        {google.conectado && (
          <div className="badge badge-outline gap-2">
            Google
            <span className="badge badge-success badge-xs">Conectado</span>
          </div>
        )}
        {microsoft.conectado && (
          <div className="badge badge-outline gap-2">
            Microsoft
            <span className="badge badge-success badge-xs">Conectado</span>
          </div>
        )}
      </div>

      {reuniones.length === 0 ? (
        <EstadoVacio
          icono="calendario"
          titulo="No hay reuniones sincronizadas"
          descripcion="Sincroniza para traer las reuniones de tus calendarios o crea una nueva."
        />
      ) : (
        <div className="space-y-6">
          {Object.entries(agruparPorDia(reuniones)).map(([dia, reunionesDelDia]) => (
            <section key={dia}>
              <h2 className="mb-2 text-sm font-semibold opacity-70">{dia}</h2>
              <ul className="space-y-2">
                {reunionesDelDia.map((reunion) => (
                  <li key={reunion.idExterno} className="card card-border bg-base-200 shadow-sm">
                    <div className="card-body flex-row items-start gap-3 p-4">
                      <div className="flex-1">
                        <p className="font-medium">{reunion.titulo}</p>
                        {reunion.descripcion ? (
                          <p className="mt-1 text-sm opacity-70">{reunion.descripcion}</p>
                        ) : null}
                        <p className="mt-1 text-sm opacity-70">
                          {formatters.hora(new Date(reunion.inicio))} —{" "}
                          {formatters.hora(new Date(reunion.fin))}
                        </p>
                      </div>
                      {reunion.enlaceReunion ? (
                        <a
                          href={reunion.enlaceReunion}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-ghost btn-sm"
                        >
                          Unirse
                        </a>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <Modal
        abierto={modalAbierto}
        alCerrar={() => setModalAbierto(false)}
        titulo="Nueva reunión"
        descripcion="Creará la reunión en el calendario seleccionado."
      >
        <FormularioReunion onCancel={() => setModalAbierto(false)} />
      </Modal>
    </>
  );

  async function sincronizar(cual: "google" | "microsoft") {
    setSincronizando((p) => ({ ...p, [cual]: true }));
    const resultado = await accionSincronizarCalendario(cual === "google" ? "GOOGLE" : "MICROSOFT");
    setSincronizando((p) => ({ ...p, [cual]: false }));
    if (resultado.ok) {
      setErrorBanner((p) => ({ ...p, [cual]: undefined }));
    } else {
      setErrorBanner((p) => ({ ...p, [cual]: resultado.mensaje }));
    }
  }
}

function agruparPorDia(reuniones: EventoCalendario[]) {
  return reuniones.reduce<Record<string, EventoCalendario[]>>((mapa, reunion) => {
    const clave = formatters.fecha(new Date(reunion.inicio));
    if (!mapa[clave]) mapa[clave] = [];
    mapa[clave].push(reunion);
    return mapa;
  }, {});
}

function FormularioReunion({ onCancel }: { onCancel: () => void }) {
  const [estado, enviar, pendiente] = useActionState(accionCrearReunion, {} as EstadoReunion);

  return (
    <form action={enviar} className="space-y-4">
      <Entrada
        etiqueta="Título"
        name="titulo"
        required
        defaultValue={estado.valores?.titulo ?? ""}
        invalido={Boolean(estado.errores?.mensaje)}
        mensaje={estado.errores?.mensaje}
      />
      <AreaTexto
        etiqueta="Descripción (opcional)"
        name="descripcion"
        rows={3}
        defaultValue={estado.valores?.descripcion ?? ""}
      />
      <Entrada
        etiqueta="Inicio"
        name="inicio"
        type="datetime-local"
        required
        defaultValue={estado.valores?.inicio ?? ""}
      />
      <Entrada
        etiqueta="Fin"
        name="fin"
        type="datetime-local"
        required
        defaultValue={estado.valores?.fin ?? ""}
      />
      <Selector etiqueta="Calendario" name="proveedor" defaultValue="GOOGLE">
        <option value="GOOGLE">Google Calendar</option>
        <option value="MICROSOFT">Microsoft Calendar</option>
      </Selector>
      {estado.errores?.mensaje ? (
        <p className="text-error text-sm">{estado.errores.mensaje}</p>
      ) : null}
      <div className="flex gap-2 pt-2">
        <Boton type="submit" cargando={pendiente}>
          Crear reunión
        </Boton>
        <Boton type="button" variante="fantasma" onClick={onCancel}>
          Cancelar
        </Boton>
      </div>
    </form>
  );
}
