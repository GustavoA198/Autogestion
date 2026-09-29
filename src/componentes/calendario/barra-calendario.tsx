"use client";

import Link from "next/link";
import { Boton } from "@/componentes/boton";
import { Icono } from "@/componentes/icono";
import { VISTAS, type Vista } from "@/lib/calendario/rango";

export const ETIQUETA_VISTA: Record<Vista, string> = {
  agenda: "Agenda",
  dia: "Día",
  semana: "Semana",
  mes: "Mes",
};

const ETIQUETA_PERIODO: Record<Vista, { anterior: string; siguiente: string }> = {
  agenda: { anterior: "30 días anteriores", siguiente: "30 días siguientes" },
  dia: { anterior: "Día anterior", siguiente: "Día siguiente" },
  semana: { anterior: "Semana anterior", siguiente: "Semana siguiente" },
  mes: { anterior: "Mes anterior", siguiente: "Mes siguiente" },
};

type PropiedadesBarra = {
  titulo: string;
  vista: Vista;
  // En móvil solo existe la agenda, así que el selector se oculta
  mostrarSelector: boolean;
  sincronizando: boolean;
  alHoy: () => void;
  alAnterior: () => void;
  alSiguiente: () => void;
  alCambiarVista: (vista: Vista) => void;
  alSincronizar: () => void;
  // Sin proveedor conectado no hay nada que sincronizar
  mostrarSincronizar?: boolean;
  // Texto relativo de la última actualización, por ejemplo "Actualizado hace 5 min"
  textoActualizacion?: string | null;
};

export function BarraCalendario({
  titulo,
  vista,
  mostrarSelector,
  sincronizando,
  alHoy,
  alAnterior,
  alSiguiente,
  alCambiarVista,
  alSincronizar,
  mostrarSincronizar = true,
  textoActualizacion = null,
}: PropiedadesBarra) {
  const etiquetas = ETIQUETA_PERIODO[vista];
  return (
    <div
      role="toolbar"
      aria-label="Navegación del calendario"
      className="tarjeta flex flex-wrap items-center gap-x-3 gap-y-2 p-3 sm:p-4"
    >
      <div className="flex items-center gap-1.5">
        <Boton variante="secundario" onClick={alHoy} title="Ir a hoy (T)">
          Hoy
        </Boton>
        <div className="flex items-center">
          <Boton
            variante="fantasma"
            className="btn-square"
            onClick={alAnterior}
            aria-label={etiquetas.anterior}
            title={`${etiquetas.anterior} (←)`}
          >
            <Icono nombre="chevron-izquierda" tamano={20} />
          </Boton>
          <Boton
            variante="fantasma"
            className="btn-square"
            onClick={alSiguiente}
            aria-label={etiquetas.siguiente}
            title={`${etiquetas.siguiente} (→)`}
          >
            <Icono nombre="chevron-derecha" tamano={20} />
          </Boton>
        </div>
      </div>

      <h2 className="order-last basis-full text-lg leading-7 font-extrabold tracking-tight first-letter:uppercase md:order-none md:flex-1 md:basis-auto md:text-xl">
        {titulo}
      </h2>

      <div className="ml-auto flex flex-wrap items-center justify-end gap-2 md:ml-0">
        {mostrarSelector ? (
          <div
            role="group"
            aria-label="Vista del calendario"
            className="border-linea-tarjeta bg-hundida inline-flex rounded-full border p-1"
          >
            {VISTAS.map((opcion) => {
              const activa = opcion === vista;
              return (
                <button
                  key={opcion}
                  type="button"
                  aria-pressed={activa}
                  onClick={() => alCambiarVista(opcion)}
                  className={`min-h-9 cursor-pointer rounded-full px-4 text-sm transition-colors duration-150 max-md:min-h-11 ${
                    activa
                      ? "bg-primary text-primary-content font-bold"
                      : "text-suave hover:text-base-content font-medium"
                  }`}
                >
                  {ETIQUETA_VISTA[opcion]}
                </button>
              );
            })}
          </div>
        ) : null}
        {mostrarSincronizar ? (
          <>
            <span
              aria-live="polite"
              className="text-suave font-mono text-xs whitespace-nowrap max-sm:sr-only"
            >
              {textoActualizacion}
            </span>
            <Boton
              variante="secundario"
              onClick={alSincronizar}
              cargando={sincronizando}
              title="Sincronizar ahora"
            >
              {sincronizando ? null : <Icono nombre="refrescar" tamano={18} />}
              <span className="max-xl:sr-only">
                {sincronizando ? "Sincronizando" : "Sincronizar ahora"}
              </span>
            </Boton>
          </>
        ) : null}
      </div>
    </div>
  );
}

type EstadoProveedor = { configurado: boolean; conectado: boolean };

type PropiedadesConexiones = {
  google: EstadoProveedor;
  microsoft: EstadoProveedor;
  sincronizando: boolean;
};

function ChipProveedor({
  nombre,
  estado,
  rutaConectar,
}: {
  nombre: string;
  estado: EstadoProveedor;
  rutaConectar: string;
}) {
  if (!estado.configurado) return null;
  return (
    <li className="border-linea-tarjeta bg-hundida inline-flex min-h-9 items-center gap-2 rounded-full border px-4 text-sm max-md:min-h-11">
      <span
        className={`size-2 rounded-full ${estado.conectado ? "bg-success" : "bg-tenue"}`}
        aria-hidden="true"
      />
      <span className="font-bold">{nombre}</span>
      {estado.conectado ? (
        <span className="text-suave">Conectado</span>
      ) : (
        <>
          <span className="text-suave">Sin conectar</span>
          <Link href={rutaConectar} className="enlace">
            Conectar
          </Link>
        </>
      )}
    </li>
  );
}

// Estado de conexión de cada proveedor y aviso mientras se sincroniza
export function EstadoConexiones({ google, microsoft, sincronizando }: PropiedadesConexiones) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <ul className="flex flex-wrap items-center gap-2" aria-label="Calendarios conectados">
        <ChipProveedor
          nombre="Google"
          estado={google}
          rutaConectar="/api/calendario/google/conectar"
        />
        <ChipProveedor
          nombre="Microsoft"
          estado={microsoft}
          rutaConectar="/api/calendario/microsoft/conectar"
        />
      </ul>
      <p
        role="status"
        aria-live="polite"
        className="text-suave ml-auto flex items-center gap-1.5 text-sm"
      >
        {sincronizando ? (
          <>
            <span className="loading loading-spinner loading-xs" aria-hidden="true" />
            Sincronizando calendarios…
          </>
        ) : null}
      </p>
    </div>
  );
}
