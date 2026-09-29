"use client";

import { useEffect, useEffectEvent, useMemo, useState } from "react";
import { useAvisos } from "@/componentes/aviso";
import { Alerta } from "@/componentes/alerta";
import { Boton } from "@/componentes/boton";
import { BotonEnlace } from "@/componentes/enlace";
import {
  BarraCalendario,
  EstadoConexiones,
  ETIQUETA_VISTA,
} from "@/componentes/calendario/barra-calendario";
import { textoCantidad } from "@/componentes/calendario/comun";
import { FiltrosCapas } from "@/componentes/calendario/filtros-capas";
import {
  useAhora,
  useCapasGuardadas,
  useEsEscritorio,
  useVistaGuardada,
  useZonaNavegador,
} from "@/componentes/calendario/hooks";
import { MiniMes } from "@/componentes/calendario/mini-mes";
import { EsqueletoAgenda, VistaAgenda } from "@/componentes/calendario/vista-agenda";
import { EsqueletoCuadricula, VistaCuadricula } from "@/componentes/calendario/vista-cuadricula";
import { EsqueletoMes, VistaMes } from "@/componentes/calendario/vista-mes";
import { DetalleReunion } from "@/componentes/detalle-reunion";
import { EstadoError } from "@/componentes/estado-error";
import { EstadoVacio } from "@/componentes/estado-vacio";
import { Icono } from "@/componentes/icono";
import { Modal } from "@/componentes/modal";
import { EVENTO_DATOS_GUARDADOS } from "@/componentes/modal-ruta";
import { TituloSeccion } from "@/componentes/shell/titulo-seccion";
import { reunionesPorDia } from "@/lib/calendario/disposicion";
import {
  claveDia,
  compararDias,
  diaCivilDe,
  diaDesdeClave,
  type DiaCivil,
} from "@/lib/calendario/fechas";
import {
  EVENTO_CALENDARIO_SINCRONIZADO,
  type DetalleSincronizacion,
} from "@/lib/calendario/eventos";
import { fechaLarga, textoActualizado, tituloRango } from "@/lib/calendario/formato";
import type { ReunionDetalle } from "@/lib/calendario/operaciones";
import { guardarVista, type CapasVisibles } from "@/lib/calendario/preferencias";
import { tareasPorDia, tareasVencidas, type EventoTarea } from "@/lib/calendario/tareas";
import {
  DIAS_EXTENSION_ADELANTE,
  DIAS_EXTENSION_ATRAS,
  SIN_EXTENSION,
  diasDelRango,
  navegar,
  rangoConsulta,
  rangoDeVista,
  type ExtensionAgenda,
  type Vista,
} from "@/lib/calendario/rango";
import {
  accionSincronizarCalendario,
  obtenerReunionesEnRango,
  obtenerTareasEnRango,
} from "./acciones";
import { ModalFormulario } from "@/componentes/modal-formulario";
import { FormularioReunion } from "./formulario-reunion";

export type EstadoProveedor = {
  configurado: boolean;
  conectado: boolean;
  // Fecha ISO de la última sincronización correcta de la cuenta
  ultimaSincronizacion?: string | null;
};
export type EstadoCalendario = { google: EstadoProveedor; microsoft: EstadoProveedor };
export type ErrorOAuth = { mensaje: string; origen: "google" | "microsoft" } | null;

type Proveedor = "google" | "microsoft";
type AvisoError = { mensaje: string; reintentable: boolean };
type ErroresPorProveedor = Partial<Record<Proveedor, AvisoError>>;
type Datos = {
  clave: string;
  reuniones: ReunionDetalle[];
  tareas: EventoTarea[];
  error: string | null;
  errorTareas: string | null;
};

const SIN_REUNIONES: ReunionDetalle[] = [];
const SIN_TAREAS: EventoTarea[] = [];
const SIN_TAREAS_POR_DIA: ReadonlyMap<string, readonly EventoTarea[]> = new Map();
const ESPERA_CONSULTA_MS = 120;
const NOMBRE_PROVEEDOR: Record<Proveedor, string> = { google: "Google", microsoft: "Microsoft" };

type MarcasSincronizacion = Partial<Record<Proveedor, number>>;

// Convierte una fecha ISO en milisegundos; ignora valores ausentes o inválidos
function aMilisegundos(iso: string | null | undefined): number | null {
  const ms = iso ? Date.parse(iso) : Number.NaN;
  return Number.isNaN(ms) ? null : ms;
}

function marcasIniciales(estado: EstadoCalendario): MarcasSincronizacion {
  const marcas: MarcasSincronizacion = {};
  const google = aMilisegundos(estado.google.ultimaSincronizacion);
  const microsoft = aMilisegundos(estado.microsoft.ultimaSincronizacion);
  if (google !== null) marcas.google = google;
  if (microsoft !== null) marcas.microsoft = microsoft;
  return marcas;
}

type PropiedadesCliente = {
  estado: EstadoCalendario;
  errorOAuth: ErrorOAuth;
  // Tareas sin fecha que viven en Pendientes, fuera del calendario
  pendientes: number;
};

// Siempre muestra el calendario: sin proveedor conectado queda la capa de tareas y un aviso para conectar
export function CalendarioCliente({ estado, errorOAuth, pendientes }: PropiedadesCliente) {
  return <CalendarioEnNavegador estado={estado} errorOAuth={errorOAuth} pendientes={pendientes} />;
}

// Espera a conocer zona horaria, reloj y ancho de pantalla del navegador antes de calcular fechas
function CalendarioEnNavegador({ estado, errorOAuth, pendientes }: PropiedadesCliente) {
  const zona = useZonaNavegador();
  const ahora = useAhora();
  const esEscritorio = useEsEscritorio();

  if (zona === null || ahora === null || esEscritorio === null) {
    return (
      <>
        <TituloSeccion
          modulo="Agenda"
          titulo="Calendario"
          descripcion="Reuniones sincronizadas desde tus calendarios."
        />
        <div className="space-y-3" role="status" aria-live="polite">
          <span className="sr-only">Cargando calendario</span>
          <div className="tarjeta flex min-h-[4.25rem] items-center gap-3 p-3" aria-hidden="true">
            <span className="skeleton h-10 w-16" />
            <span className="skeleton h-10 w-20" />
            <span className="skeleton h-6 w-44" />
          </div>
          <EsqueletoAgenda />
        </div>
      </>
    );
  }

  return (
    <CalendarioActivo
      estado={estado}
      errorOAuth={errorOAuth}
      pendientes={pendientes}
      zona={zona}
      ahora={ahora}
      esEscritorio={esEscritorio}
    />
  );
}

function erroresIniciales(errorOAuth: ErrorOAuth): ErroresPorProveedor {
  if (!errorOAuth) return {};
  return { [errorOAuth.origen]: { mensaje: errorOAuth.mensaje, reintentable: false } };
}

function mensajeVacio(
  vista: Vista,
  ancla: DiaCivil,
  hoy: DiaCivil,
  conTareas: boolean,
): { titulo: string; texto: string } {
  // Con tareas visibles el aviso nombra ambos tipos para no confundir
  const nombre = conTareas ? "reuniones ni tareas" : "reuniones";
  if (vista === "dia") {
    return {
      titulo: `No hay ${nombre} este día`,
      texto: `No tienes nada agendado el ${fechaLarga(ancla, hoy)}.`,
    };
  }
  if (vista === "semana") {
    return {
      titulo: `No hay ${nombre} esta semana`,
      texto: conTareas
        ? "Esta semana no tiene reuniones ni tareas con vencimiento."
        : "Esta semana no tiene reuniones sincronizadas ni agendadas.",
    };
  }
  return {
    titulo: `No hay ${nombre} este mes`,
    texto: conTareas
      ? "Este mes no tiene reuniones ni tareas con vencimiento."
      : "Este mes no tiene reuniones sincronizadas ni agendadas.",
  };
}

// Frase para el anuncio de cambio de rango según los tipos visibles
function describirContenido(reuniones: number, tareas: number, capas: CapasVisibles): string {
  const partes: string[] = [];
  if (capas.reuniones) {
    partes.push(
      reuniones === 0 ? "no hay reuniones" : textoCantidad(reuniones, "reunión", "reuniones"),
    );
  }
  if (capas.tareas) {
    partes.push(tareas === 0 ? "no hay tareas" : textoCantidad(tareas, "tarea", "tareas"));
  }
  const frase = partes.join(" y ");
  return frase.charAt(0).toUpperCase() + frase.slice(1);
}

type PropiedadesActivo = PropiedadesCliente & {
  zona: string;
  ahora: number;
  esEscritorio: boolean;
};

function CalendarioActivo({
  estado,
  errorOAuth,
  pendientes,
  zona,
  ahora,
  esEscritorio,
}: PropiedadesActivo) {
  const { google, microsoft } = estado;
  const hayProveedor = google.conectado || microsoft.conectado;
  const { notificar } = useAvisos();
  const vistaGuardada = useVistaGuardada();
  const capas = useCapasGuardadas();

  const claveHoy = claveDia(diaCivilDe(ahora, zona));
  // La clave sale de claveDia, así que siempre es válida y el día conserva su identidad todo el día
  const hoy = useMemo(() => diaDesdeClave(claveHoy) as DiaCivil, [claveHoy]);

  const [anclaElegida, setAnclaElegida] = useState<DiaCivil | null>(null);
  const [extension, setExtension] = useState<ExtensionAgenda>(SIN_EXTENSION);
  const [seleccionada, setSeleccionada] = useState<ReunionDetalle | null>(null);
  const [modalNueva, setModalNueva] = useState(false);
  const [claveFormulario, setClaveFormulario] = useState(0);
  const [datos, setDatos] = useState<Datos | null>(null);
  const [version, setVersion] = useState(0);
  // Recarga sin pantalla de carga: la usa la sincronización automática para no interrumpir la vista
  const [versionSilenciosa, setVersionSilenciosa] = useState(0);
  const [sincronizando, setSincronizando] = useState(false);
  const [marcas, setMarcas] = useState<MarcasSincronizacion>(() => marcasIniciales(estado));
  const [errores, setErrores] = useState<ErroresPorProveedor>(() => erroresIniciales(errorOAuth));

  // En móvil solo existe la agenda; en escritorio se recuerda la última vista elegida
  const vista: Vista = esEscritorio ? (vistaGuardada ?? "agenda") : "agenda";
  const ancla = anclaElegida ?? hoy;

  const rango = useMemo(() => rangoDeVista(vista, ancla, extension), [vista, ancla, extension]);
  const consulta = useMemo(() => rangoConsulta(rango, zona), [rango, zona]);
  const desdeIso = consulta.desde.toISOString();
  const hastaIso = consulta.hasta.toISOString();
  const rangoIncluyeHoy = compararDias(hoy, rango.desde) >= 0 && compararDias(hoy, rango.hasta) < 0;
  // La agenda arrastra a hoy las tareas vencidas sin cerrar, aunque su fecha quede antes del rango
  const arrastraVencidas = vista === "agenda" && rangoIncluyeHoy;
  const desdeClave = claveDia(rango.desde);
  const hastaClave = claveDia(rango.hasta);
  const claveCarga = `${desdeIso}|${hastaIso}|${version}|${arrastraVencidas ? "v" : "-"}`;

  // Trae reuniones y tareas del rango visible; una breve espera evita encolar peticiones al navegar rápido
  useEffect(() => {
    let vigente = true;
    const temporizador = setTimeout(() => {
      Promise.all([
        obtenerReunionesEnRango(desdeIso, hastaIso),
        obtenerTareasEnRango(desdeClave, hastaClave, arrastraVencidas),
      ])
        .then(([resReuniones, resTareas]) => {
          if (!vigente) return;
          setDatos({
            clave: claveCarga,
            reuniones: resReuniones.ok ? resReuniones.reuniones : [],
            tareas: resTareas.ok ? resTareas.tareas : [],
            error: resReuniones.ok ? null : resReuniones.mensaje,
            errorTareas: resTareas.ok ? null : resTareas.mensaje,
          });
        })
        .catch(() => {
          if (!vigente) return;
          setDatos({
            clave: claveCarga,
            reuniones: [],
            tareas: [],
            error: "No se pudieron cargar las reuniones.",
            errorTareas: null,
          });
        });
    }, ESPERA_CONSULTA_MS);
    return () => {
      vigente = false;
      clearTimeout(temporizador);
    };
  }, [desdeIso, hastaIso, desdeClave, hastaClave, arrastraVencidas, claveCarga, versionSilenciosa]);

  // La sincronización automática avisa por evento: se actualiza la marca y se recarga solo si hubo cambios
  useEffect(() => {
    const oyente = (evento: Event) => {
      const detalle = (evento as CustomEvent<DetalleSincronizacion>).detail;
      if (!detalle) return;
      const marca = aMilisegundos(detalle.ultimaSincronizacion);
      const clave: Proveedor = detalle.proveedor === "GOOGLE" ? "google" : "microsoft";
      if (marca !== null) setMarcas((previas) => ({ ...previas, [clave]: marca }));
      if (detalle.huboCambios) setVersionSilenciosa((v) => v + 1);
    };
    window.addEventListener(EVENTO_CALENDARIO_SINCRONIZADO, oyente);
    return () => window.removeEventListener(EVENTO_CALENDARIO_SINCRONIZADO, oyente);
  }, []);

  // Al guardar una tarea en el modal de ruta se vuelve a pedir el rango sin pantalla de carga
  useEffect(() => {
    const oyente = () => setVersionSilenciosa((v) => v + 1);
    window.addEventListener(EVENTO_DATOS_GUARDADOS, oyente);
    return () => window.removeEventListener(EVENTO_DATOS_GUARDADOS, oyente);
  }, []);

  const cargando = datos === null || datos.clave !== claveCarga;
  const reunionesCargadas = datos?.reuniones ?? SIN_REUNIONES;
  const tareasCargadas = datos?.tareas ?? SIN_TAREAS;
  const errorCarga = !cargando && datos ? datos.error : null;
  const errorTareas = !cargando && datos ? datos.errorTareas : null;

  const dias = useMemo(() => diasDelRango(rango), [rango]);
  // Los interruptores solo ocultan: la carga y los contadores usan siempre lo cargado
  const porDiaCargadas = useMemo(
    () => reunionesPorDia(reunionesCargadas, dias, zona),
    [reunionesCargadas, dias, zona],
  );
  const porDia = useMemo(
    () =>
      capas.reuniones
        ? porDiaCargadas
        : porDiaCargadas.map((dia) => ({ ...dia, todoElDia: [], conHora: [] })),
    [capas.reuniones, porDiaCargadas],
  );
  const totalReuniones = useMemo(() => {
    const ids = new Set<string>();
    for (const dia of porDiaCargadas) {
      for (const reunion of dia.todoElDia) ids.add(reunion.id);
      for (const tramo of dia.conHora) ids.add(tramo.reunion.id);
    }
    return ids.size;
  }, [porDiaCargadas]);

  // Con la agenda mostrando hoy, las vencidas van todas al bloque de hoy y no se repiten en su día
  const vencidasCargadas = useMemo(
    () => (arrastraVencidas ? tareasVencidas(tareasCargadas, claveHoy) : SIN_TAREAS),
    [arrastraVencidas, tareasCargadas, claveHoy],
  );
  const tareasDeDiasCargadas = useMemo(
    () =>
      tareasPorDia(
        arrastraVencidas
          ? tareasCargadas.filter((tarea) => tarea.fecha >= claveHoy)
          : tareasCargadas,
        dias,
      ),
    [arrastraVencidas, tareasCargadas, claveHoy, dias],
  );
  const totalTareas = useMemo(() => {
    let total = vencidasCargadas.length;
    for (const lista of tareasDeDiasCargadas.values()) total += lista.length;
    return total;
  }, [vencidasCargadas, tareasDeDiasCargadas]);
  const vencidas = capas.tareas ? vencidasCargadas : SIN_TAREAS;
  const tareasDeDias = capas.tareas ? tareasDeDiasCargadas : SIN_TAREAS_POR_DIA;

  // Días con contenido para los puntos del mini-mes (círculo para reuniones, rombo para tareas)
  const diasConReuniones = useMemo(
    () =>
      new Set(
        porDiaCargadas.filter((d) => d.todoElDia.length + d.conHora.length > 0).map((d) => d.clave),
      ),
    [porDiaCargadas],
  );
  const diasConTareas = useMemo(
    () => new Set(tareasCargadas.map((tarea) => tarea.fecha)),
    [tareasCargadas],
  );

  const hayContenido =
    (capas.reuniones ? totalReuniones : 0) + (capas.tareas ? totalTareas : 0) > 0;

  const titulo = tituloRango(vista, ancla, hoy, rango);
  const mensajeVivo = cargando
    ? ""
    : errorCarga
      ? "No se pudieron cargar las reuniones."
      : `${titulo}. ${describirContenido(totalReuniones, totalTareas, capas)}.`;

  function irA(dia: DiaCivil | null) {
    setAnclaElegida(dia);
    setExtension(SIN_EXTENSION);
  }

  function alCambiarVista(nueva: Vista) {
    guardarVista(nueva);
    setExtension(SIN_EXTENSION);
  }

  function alIrADia(dia: DiaCivil) {
    guardarVista("dia");
    irA(dia);
  }

  // Atajos: T lleva a hoy y las flechas cambian de periodo, salvo al escribir o con un diálogo abierto
  const alPulsarTecla = useEffectEvent((evento: KeyboardEvent) => {
    if (evento.defaultPrevented || evento.ctrlKey || evento.metaKey || evento.altKey) return;
    if (document.querySelector("dialog[open]")) return;
    const destino = evento.target instanceof Element ? evento.target : null;
    if (destino?.closest("input, textarea, select, [contenteditable='true'], [role='menu']"))
      return;
    if (evento.key === "t" || evento.key === "T") {
      evento.preventDefault();
      irA(null);
    } else if (evento.key === "ArrowLeft") {
      evento.preventDefault();
      irA(navegar(vista, ancla, -1));
    } else if (evento.key === "ArrowRight") {
      evento.preventDefault();
      irA(navegar(vista, ancla, 1));
    }
  });

  useEffect(() => {
    const oyente = (evento: KeyboardEvent) => alPulsarTecla(evento);
    document.addEventListener("keydown", oyente);
    return () => document.removeEventListener("keydown", oyente);
  }, []);

  async function sincronizar() {
    if (sincronizando) return;
    setSincronizando(true);
    const proveedores: Proveedor[] = [
      ...(google.conectado ? (["google"] as const) : []),
      ...(microsoft.conectado ? (["microsoft"] as const) : []),
    ];
    const resultados = await Promise.all(
      proveedores.map(async (proveedor) => {
        try {
          const resultado = await accionSincronizarCalendario(
            proveedor === "google" ? "GOOGLE" : "MICROSOFT",
          );
          return { proveedor, resultado };
        } catch {
          return {
            proveedor,
            resultado: { ok: false as const, mensaje: "No se pudo sincronizar. Intenta de nuevo." },
          };
        }
      }),
    );

    let total = 0;
    let algunaCorrecta = false;
    const nuevasMarcas: MarcasSincronizacion = {};
    for (const { proveedor, resultado } of resultados) {
      if (resultado.ok) {
        total += resultado.cantidad;
        algunaCorrecta = true;
        nuevasMarcas[proveedor] = aMilisegundos(resultado.ultimaSincronizacion) ?? Date.now();
      }
    }
    setErrores((previos) => {
      const siguiente = { ...previos };
      for (const { proveedor, resultado } of resultados) {
        if (resultado.ok) delete siguiente[proveedor];
        else siguiente[proveedor] = { mensaje: resultado.mensaje, reintentable: true };
      }
      return siguiente;
    });
    setSincronizando(false);
    if (algunaCorrecta) {
      setMarcas((previas) => ({ ...previas, ...nuevasMarcas }));
      notificar(
        total === 0
          ? "Sincronización completada: tu calendario ya estaba al día."
          : `Sincronización completada: ${textoCantidad(total, "reunión actualizada", "reuniones actualizadas")}.`,
        "exito",
      );
      setVersion((v) => v + 1);
    }
  }

  function alCrearReunion() {
    setModalNueva(false);
    setClaveFormulario((k) => k + 1);
    setVersion((v) => v + 1);
    notificar("Reunión creada correctamente.", "exito");
  }

  // La tarea nueva nace para el día visible (hoy en la agenda) y al crearla se vuelve al calendario
  const diaNuevaTarea = vista === "agenda" ? hoy : ancla;
  const hrefNuevaTarea = `/tareas/nueva?fecha=${claveDia(diaNuevaTarea)}&volver=calendario`;

  const acciones = (
    <>
      {!rangoIncluyeHoy ? (
        <Boton variante="secundario" onClick={() => irA(null)}>
          Ir a hoy
        </Boton>
      ) : null}
      {hayProveedor ? (
        <Boton variante="secundario" onClick={sincronizar} cargando={sincronizando}>
          Sincronizar
        </Boton>
      ) : null}
    </>
  );

  // Se muestra la marca más antigua entre los calendarios conectados para no aparentar frescura de más
  const marcasConectadas = [
    google.conectado ? marcas.google : undefined,
    microsoft.conectado ? marcas.microsoft : undefined,
  ].filter((marca): marca is number => marca !== undefined);
  const textoActualizacion =
    marcasConectadas.length > 0 ? textoActualizado(Math.min(...marcasConectadas), ahora) : null;

  const mostrarVacio = !cargando && !hayContenido && !errorCarga;
  const textoVacio = mensajeVacio(vista, ancla, hoy, capas.tareas);
  const superposicionVacia = mostrarVacio ? (
    <div className="pointer-events-none absolute inset-0 z-30 grid place-items-center p-4">
      <div className="bg-base-100 border-linea-tarjeta shadow-flotante rounded-box pointer-events-auto flex max-w-sm flex-col items-center gap-2 border px-6 py-6 text-center">
        <span className="bg-primary/15 text-primary mb-1 grid size-12 place-items-center rounded-full">
          <Icono nombre="calendario" tamano={24} />
        </span>
        <h3 className="text-lg font-bold">{textoVacio.titulo}</h3>
        <p className="text-suave text-sm">{textoVacio.texto}</p>
        <div className="mt-2 flex flex-wrap justify-center gap-2">{acciones}</div>
      </div>
    </div>
  ) : undefined;

  return (
    <>
      <TituloSeccion
        modulo={`Vista ${ETIQUETA_VISTA[vista].toLowerCase()}`}
        titulo="Calendario"
        descripcion="Reuniones sincronizadas desde tus calendarios y tareas con su vencimiento."
        accion={
          <>
            <BotonEnlace href={hrefNuevaTarea} variante="secundario">
              <Icono nombre="mas" tamano={18} />
              Nueva tarea
            </BotonEnlace>
            {hayProveedor ? (
              <Boton onClick={() => setModalNueva(true)}>
                <Icono nombre="mas" tamano={18} />
                Nueva reunión
              </Boton>
            ) : null}
          </>
        }
      />

      {(["google", "microsoft"] as const).map((origen) => {
        const error = errores[origen];
        if (!error) return null;
        return (
          <div
            key={origen}
            role="alert"
            className="border-warning/30 bg-warning/8 text-warning mb-4 flex flex-wrap items-center gap-3 rounded-2xl border px-4 py-3 text-sm"
          >
            <Icono nombre="alerta" tamano={20} />
            <span>
              {NOMBRE_PROVEEDOR[origen]}: {error.mensaje}
            </span>
            <div className="flex gap-1">
              {error.reintentable ? (
                <Boton variante="fantasma" tamano="pequeno" onClick={sincronizar}>
                  Reintentar
                </Boton>
              ) : null}
              <Boton
                variante="fantasma"
                tamano="pequeno"
                onClick={() => setErrores((previos) => ({ ...previos, [origen]: undefined }))}
              >
                Cerrar
              </Boton>
            </div>
          </div>
        );
      })}

      <div className="space-y-4">
        {!hayProveedor ? (
          <Alerta tono="info">
            <p>Conecta un calendario para ver tus reuniones.</p>
            {google.configurado || microsoft.configurado ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {google.configurado ? (
                  <BotonEnlace href="/api/calendario/google/conectar" variante="secundario">
                    Conectar con Google Calendar
                  </BotonEnlace>
                ) : null}
                {microsoft.configurado ? (
                  <BotonEnlace href="/api/calendario/microsoft/conectar" variante="secundario">
                    Conectar con Microsoft Calendar
                  </BotonEnlace>
                ) : null}
              </div>
            ) : (
              <p className="mt-1">
                Agrega las variables de Google o Microsoft en .env para activar las integraciones.
              </p>
            )}
          </Alerta>
        ) : null}

        <EstadoConexiones google={google} microsoft={microsoft} sincronizando={sincronizando} />

        <div className="xl:grid xl:grid-cols-[16rem_minmax(0,1fr)] xl:items-start xl:gap-5">
          <aside className="sticky top-24 hidden space-y-4 xl:block" aria-label="Selector de fecha">
            <div className="tarjeta p-4">
              <MiniMes
                seleccionado={ancla}
                rangoActivo={vista === "agenda" ? null : rango}
                hoy={hoy}
                alElegir={irA}
                diasConReuniones={capas.reuniones ? diasConReuniones : undefined}
                diasConTareas={capas.tareas ? diasConTareas : undefined}
              />
            </div>
            <div className="text-suave px-1 text-xs">
              <p className="mb-1.5 font-bold">Atajos de teclado</p>
              <ul className="space-y-1">
                <li className="flex items-center gap-2">
                  <kbd className="border-linea-fuerte bg-base-100 rounded-lg border px-2 py-0.5 font-mono font-bold">
                    T
                  </kbd>
                  Ir a hoy
                </li>
                <li className="flex items-center gap-2">
                  <span className="flex gap-1">
                    <kbd className="border-linea-fuerte bg-base-100 rounded-lg border px-2 py-0.5 font-mono font-bold">
                      ←
                    </kbd>
                    <kbd className="border-linea-fuerte bg-base-100 rounded-lg border px-2 py-0.5 font-mono font-bold">
                      →
                    </kbd>
                  </span>
                  Periodo anterior o siguiente
                </li>
              </ul>
            </div>
          </aside>

          <div className="min-w-0 space-y-3">
            <BarraCalendario
              titulo={titulo}
              vista={vista}
              mostrarSelector={esEscritorio}
              sincronizando={sincronizando}
              alHoy={() => irA(null)}
              alAnterior={() => irA(navegar(vista, ancla, -1))}
              alSiguiente={() => irA(navegar(vista, ancla, 1))}
              alCambiarVista={alCambiarVista}
              alSincronizar={sincronizar}
              mostrarSincronizar={hayProveedor}
              textoActualizacion={textoActualizacion}
            />

            <FiltrosCapas
              capas={capas}
              totalReuniones={cargando ? null : totalReuniones}
              totalTareas={cargando ? null : totalTareas}
              pendientes={pendientes}
            />

            <p className="sr-only" role="status" aria-live="polite">
              {mensajeVivo}
            </p>

            {errorTareas ? (
              <div
                role="alert"
                className="border-warning/30 bg-warning/8 text-warning flex flex-wrap items-center gap-3 rounded-2xl border px-4 py-3 text-sm"
              >
                <Icono nombre="alerta" tamano={20} />
                <span>{errorTareas}</span>
                <Boton
                  variante="fantasma"
                  tamano="pequeno"
                  onClick={() => setVersion((v) => v + 1)}
                >
                  Reintentar
                </Boton>
              </div>
            ) : null}

            {errorCarga ? (
              <EstadoError
                titulo="No se pudieron cargar las reuniones"
                mensaje={errorCarga}
                accion={
                  <Boton variante="secundario" onClick={() => setVersion((v) => v + 1)}>
                    Reintentar
                  </Boton>
                }
              />
            ) : null}

            <div aria-busy={cargando} className="relative">
              {cargando ? (
                <div
                  className="bg-base-300/60 rounded-t-box absolute inset-x-0 top-0 z-40 h-0.5 overflow-hidden"
                  aria-hidden="true"
                >
                  <span className="barra-carga bg-primary block h-full w-1/3" />
                </div>
              ) : null}
              {vista === "agenda" ? (
                datos === null ? (
                  <EsqueletoAgenda />
                ) : mostrarVacio ? (
                  <EstadoVacio
                    icono="calendario"
                    titulo={
                      capas.tareas
                        ? "No hay reuniones ni tareas en este periodo"
                        : "No hay reuniones en este periodo"
                    }
                    descripcion={
                      hayProveedor
                        ? `Periodo ${titulo}. Sincroniza para traer las reuniones de tus calendarios o mira más adelante.`
                        : `Periodo ${titulo}. Mira más adelante o conecta un calendario para ver tus reuniones.`
                    }
                    accion={
                      <div className="flex flex-wrap justify-center gap-2">
                        {!rangoIncluyeHoy ? (
                          <Boton variante="secundario" onClick={() => irA(null)}>
                            Ir a hoy
                          </Boton>
                        ) : null}
                        <Boton
                          variante="secundario"
                          onClick={() =>
                            setExtension((previa) => ({
                              ...previa,
                              adelante: previa.adelante + DIAS_EXTENSION_ADELANTE,
                            }))
                          }
                        >
                          Ver más adelante
                        </Boton>
                        {hayProveedor ? (
                          <Boton
                            variante="secundario"
                            onClick={sincronizar}
                            cargando={sincronizando}
                          >
                            Sincronizar
                          </Boton>
                        ) : null}
                      </div>
                    }
                  />
                ) : (
                  <VistaAgenda
                    dias={porDia}
                    tareasPorDia={tareasDeDias}
                    vencidas={vencidas}
                    capas={capas}
                    hoy={hoy}
                    ahora={ahora}
                    zona={zona}
                    cargando={cargando}
                    alSeleccionar={setSeleccionada}
                    alVerAnteriores={() =>
                      setExtension((previa) => ({
                        ...previa,
                        atras: previa.atras + DIAS_EXTENSION_ATRAS,
                      }))
                    }
                    alVerMas={() =>
                      setExtension((previa) => ({
                        ...previa,
                        adelante: previa.adelante + DIAS_EXTENSION_ADELANTE,
                      }))
                    }
                  />
                )
              ) : vista === "mes" ? (
                datos === null ? (
                  <EsqueletoMes />
                ) : (
                  <VistaMes
                    dias={porDia}
                    tareasPorDia={tareasDeDias}
                    mes={ancla}
                    hoy={hoy}
                    zona={zona}
                    cargando={cargando}
                    alSeleccionar={setSeleccionada}
                    alIrADia={alIrADia}
                    vacio={superposicionVacia}
                  />
                )
              ) : datos === null ? (
                <EsqueletoCuadricula columnas={vista === "dia" ? 1 : 7} />
              ) : (
                <VistaCuadricula
                  dias={porDia}
                  tareasPorDia={tareasDeDias}
                  hoy={hoy}
                  ahora={ahora}
                  zona={zona}
                  cargando={cargando}
                  claveDesplazamiento={`${vista}|${claveDia(rango.desde)}`}
                  alSeleccionar={setSeleccionada}
                  alIrADia={alIrADia}
                  vacio={superposicionVacia}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <Modal
        abierto={seleccionada !== null}
        alCerrar={() => setSeleccionada(null)}
        titulo={seleccionada?.titulo ?? ""}
        ancho="amplio"
      >
        {seleccionada ? <DetalleReunion reunion={seleccionada} /> : null}
      </Modal>

      <ModalFormulario
        abierto={modalNueva}
        alCerrar={() => setModalNueva(false)}
        titulo="Nueva reunión"
        descripcion="Creará la reunión en el calendario seleccionado."
      >
        <FormularioReunion key={claveFormulario} zona={zona} alCrear={alCrearReunion} />
      </ModalFormulario>
    </>
  );
}
