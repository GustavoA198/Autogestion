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
import {
  accionCrearReunion,
  accionSincronizarCalendario,
  obtenerEstadoCalendario,
  type EstadoReunion,
} from "./acciones";
import type { EventoCalendario } from "@/lib/calendario/proveedor";
import { formatters } from "@/lib/tiempo";

export default function Calendario() {
  const searchParams = useSearchParams();
  const [modalAbierto, setModalAbierto] = useState(false);
  const [reuniones] = useState<EventoCalendario[]>([]);
  const [estado, setEstado] = useState<{ conectado: boolean; configurado: boolean }>({
    conectado: false,
    configurado: false,
  });
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [sincronizando, setSincronizando] = useState(false);

  useEffect(() => {
    obtenerEstadoCalendario()
      .then(setEstado)
      .catch(() => {
        setEstado({ conectado: false, configurado: false });
      });
  }, []);

  useEffect(() => {
    const error = searchParams.get("error");
    const conectado = searchParams.get("conectado");
    startTransition(() => {
      if (error) setErrorBanner(`Error de OAuth: ${decodeURIComponent(error)}`);
      if (conectado) setErrorBanner(null);
    });
  }, [searchParams]);

  async function sincronizar() {
    setSincronizando(true);
    const resultado = await accionSincronizarCalendario();
    setSincronizando(false);
    if (resultado.ok) {
      setErrorBanner(null);
    } else {
      setErrorBanner(resultado.mensaje);
    }
  }

  if (!estado.configurado) {
    return (
      <>
        <TituloSeccion
          modulo="Agenda"
          titulo="Calendario"
          descripcion="Integración con Google Calendar y Microsoft (próximamente)."
        />
        <EstadoVacio
          icono="calendario"
          titulo="Google Calendar pendiente de configurar"
          descripcion="Agrega GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET y GOOGLE_REDIRECT_URI en .env para activar la integración. El resto de la HU-10 funciona sin estas variables."
          accion={
            <a
              href="https://console.cloud.google.com/apis/credentials"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
            >
              Abrir Google Cloud Console
            </a>
          }
        />
      </>
    );
  }

  if (!estado.conectado) {
    return (
      <>
        <TituloSeccion
          modulo="Agenda"
          titulo="Calendario"
          descripcion="Conecta tu cuenta de Google Calendar para ver y agendar reuniones."
        />
        <EstadoVacio
          icono="calendario"
          titulo="Cuenta de Google Calendar no conectada"
          descripcion="Autoriza la aplicación para acceder a tu calendario de Google."
          accion={
            <Link href="/api/calendario/google/conectar" className="btn btn-primary">
              Conectar con Google Calendar
            </Link>
          }
        />
      </>
    );
  }

  const agrupadas = reuniones.reduce<Record<string, EventoCalendario[]>>((mapa, reunion) => {
    const clave = formatters.fecha(new Date(reunion.inicio));
    if (!mapa[clave]) mapa[clave] = [];
    mapa[clave].push(reunion);
    return mapa;
  }, {});

  return (
    <>
      <TituloSeccion
        modulo="Agenda"
        titulo="Calendario"
        descripcion="Reuniones sincronizadas desde Google Calendar."
        accion={
          <div className="flex gap-2">
            <Boton variante="secundario" onClick={sincronizar} cargando={sincronizando}>
              Sincronizar
            </Boton>
            <Boton onClick={() => setModalAbierto(true)}>Nueva reunión</Boton>
          </div>
        }
      />

      {errorBanner ? (
        <div className="alert alert-warning mb-4" role="alert">
          <span>{errorBanner}</span>
          <button className="btn btn-ghost btn-sm" onClick={() => setErrorBanner(null)}>
            Cerrar
          </button>
        </div>
      ) : null}

      {reuniones.length === 0 ? (
        <EstadoVacio
          icono="calendario"
          titulo="No hay reuniones sincronizadas"
          descripcion="Sincroniza para traer las reuniones de Google Calendar o crea una nueva."
        />
      ) : (
        <div className="space-y-6">
          {Object.entries(agrupadas).map(([dia, reunionesDelDia]) => (
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
        descripcion="Creará la reunión en Google Calendar."
      >
        <FormularioReunion onCancel={() => setModalAbierto(false)} />
      </Modal>
    </>
  );
}

function FormularioReunion({ onCancel }: { onCancel: () => void }) {
  const [estado, enviar, pendiente] = useActionState(accionCrearReunion, {} as EstadoReunion);

  if (!estado.errores && Object.keys(estado).length === 0) {
    // Éxito silencioso
  }

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
