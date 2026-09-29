"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, type CSSProperties, type ReactNode } from "react";
import { Icono } from "@/componentes/icono";
import {
  MINUTOS_DIA,
  disponerColumnas,
  horaInicialDeDesplazamiento,
  posicionEnDia,
  posicionHorizontal,
  type ReunionesDelDia,
  type TramoColocado,
} from "@/lib/calendario/disposicion";
import { mismoDia, minutosDelDia, type DiaCivil } from "@/lib/calendario/fechas";
import {
  diaCorto,
  etiquetaHora,
  fechaLarga,
  formatoHora,
  nombreDia,
} from "@/lib/calendario/formato";
import type { ReunionDetalle } from "@/lib/calendario/operaciones";
import { nombreAccesibleTarea, type EventoTarea } from "@/lib/calendario/tareas";
import { CLASES_SEMAFORO } from "@/lib/tareas/semaforo";
import {
  BORDE_SEMAFORO,
  ESTILO_PROVEEDOR,
  enlaceDeUnion,
  esCancelada,
  esProvisional,
  nombreAccesible,
  textoCantidad,
  type AlSeleccionar,
} from "./comun";

const HORAS = Array.from({ length: 24 }, (_, hora) => hora);
const ANCHO_GUTTER = "4rem";
// Ancho mínimo de cada día en la semana: por debajo se desplaza dentro del calendario, nunca la página
const ANCHO_MINIMO_DIA = "5.5rem";

// Altura de una hora: mayor con puntero táctil para que un evento de 30 min mida 44 px
const CLASE_ALTO_HORA = "[--alto-hora:3.5rem] [@media(pointer:coarse)]:[--alto-hora:5.5rem]";
const ALTO_DIA = "calc(24 * var(--alto-hora))";
const ALTO_MARCO = "max(28rem, calc(100dvh - 18rem))";

// Líneas horizontales de cada hora dibujadas como filas de 1 px, sin fondos degradados
function LineasHora({ enLista = false }: { enLista?: boolean }) {
  const Envoltorio = enLista ? "li" : "span";
  return (
    <Envoltorio aria-hidden="true" className="pointer-events-none absolute inset-0 block list-none">
      {HORAS.map((hora) => (
        <span
          key={hora}
          className="bg-linea-tarjeta absolute inset-x-0 h-px"
          style={{ top: `calc(${hora} * var(--alto-hora))` }}
        />
      ))}
    </Envoltorio>
  );
}

const MAX_TAREAS_SEMANA = 3;
const SIN_TAREAS: readonly EventoTarea[] = [];

type Propiedades = {
  dias: ReunionesDelDia<ReunionDetalle>[];
  // Tareas por clave de día (AAAA-MM-DD); van en la franja de todo el día
  tareasPorDia: ReadonlyMap<string, readonly EventoTarea[]>;
  hoy: DiaCivil;
  ahora: number;
  zona: string;
  cargando: boolean;
  // Cambia al navegar para volver a situar el desplazamiento vertical
  claveDesplazamiento: string;
  alSeleccionar: AlSeleccionar;
  alIrADia?: (dia: DiaCivil) => void;
  // Mensaje superpuesto cuando el rango no tiene reuniones
  vacio?: ReactNode;
};

function estiloColumnas(cantidad: number): CSSProperties {
  return { gridTemplateColumns: `${ANCHO_GUTTER} repeat(${cantidad}, minmax(0, 1fr))` };
}

// La semana no baja de un ancho legible por día; el día único ocupa todo el marco
function anchoMinimoCuadricula(cantidad: number): CSSProperties | undefined {
  if (cantidad < 2) return undefined;
  return { minWidth: `calc(${ANCHO_GUTTER} + ${cantidad} * ${ANCHO_MINIMO_DIA})` };
}

// Columna de horas fija al desplazar en horizontal
const CLASE_GUTTER_FIJO = "bg-base-100 sticky left-0 z-10";

function BloqueEvento({
  tramo,
  hoy,
  zona,
  alSeleccionar,
}: {
  tramo: TramoColocado<ReunionDetalle>;
  hoy: DiaCivil;
  zona: string;
  alSeleccionar: AlSeleccionar;
}) {
  const { reunion } = tramo;
  const { arriba, alto } = posicionEnDia(tramo);
  const { izquierda, ancho } = posicionHorizontal(tramo);
  const minutos = tramo.visualFin - tramo.inicioMin;
  const estilo = ESTILO_PROVEEDOR[reunion.proveedor];
  const enlace = enlaceDeUnion(reunion);
  const cancelada = esCancelada(reunion);
  const inicio = formatoHora(new Date(reunion.inicio), zona);
  const dosLineas = minutos >= 45;
  const conUnirse = Boolean(enlace) && dosLineas;

  return (
    <li
      className="@container absolute px-px pb-px"
      style={{
        top: `${arriba}%`,
        height: `${alto}%`,
        left: `${izquierda}%`,
        width: `${ancho}%`,
      }}
    >
      <button
        type="button"
        onClick={() => alSeleccionar(reunion)}
        aria-label={nombreAccesible(reunion, zona, hoy)}
        title={nombreAccesible(reunion, zona, hoy)}
        className={`foco-interior text-base-content flex h-full w-full cursor-pointer flex-col overflow-hidden rounded-lg border-l-[3px] px-1.5 py-1 text-left text-xs leading-tight transition-colors duration-150 ${estilo.bloque} ${
          esProvisional(reunion) ? "border-dashed" : ""
        }`}
      >
        {dosLineas ? (
          <>
            <span
              className={`${minutos >= 75 ? "line-clamp-2" : "line-clamp-1"} font-bold break-words ${conUnirse ? "@[8rem]:pr-6 [@media(pointer:coarse)]:@[8rem]:pr-11" : ""} ${cancelada ? "line-through" : ""}`}
            >
              {reunion.titulo}
            </span>
            <span className="text-suave mt-0.5 truncate tabular-nums">
              {tramo.continuaAntes ? (
                "Continúa"
              ) : (
                <>
                  {inicio}
                  <span className="hidden @[9rem]:inline">
                    {" "}
                    – {formatoHora(new Date(reunion.fin), zona)}
                  </span>
                </>
              )}
              {cancelada ? " · Cancelado" : ""}
            </span>
          </>
        ) : (
          <span className="truncate">
            <span className={`font-bold ${cancelada ? "line-through" : ""}`}>{reunion.titulo}</span>{" "}
            <span className="text-suave tabular-nums">{inicio}</span>
          </span>
        )}
      </button>
      {conUnirse && enlace ? (
        <a
          href={enlace}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Unirse a ${reunion.titulo} (se abre en una pestaña nueva)`}
          title="Unirse"
          className="foco-interior text-primary hover:bg-primary/15 absolute top-1 right-1.5 hidden size-6 place-items-center rounded-lg transition-colors duration-150 @[8rem]:grid [@media(pointer:coarse)]:size-11"
        >
          <Icono nombre="video" tamano={16} />
        </a>
      ) : null}
    </li>
  );
}

function ChipTodoElDia({
  reunion,
  hoy,
  zona,
  alSeleccionar,
}: {
  reunion: ReunionDetalle;
  hoy: DiaCivil;
  zona: string;
  alSeleccionar: AlSeleccionar;
}) {
  const estilo = ESTILO_PROVEEDOR[reunion.proveedor];
  return (
    <li>
      <button
        type="button"
        onClick={() => alSeleccionar(reunion)}
        aria-label={nombreAccesible(reunion, zona, hoy)}
        className={`foco-interior text-base-content flex min-h-6 w-full cursor-pointer items-center rounded-lg border-l-[3px] px-1.5 text-left text-xs font-medium transition-colors duration-150 [@media(pointer:coarse)]:min-h-11 ${estilo.bloque} ${
          esCancelada(reunion) ? "line-through" : ""
        }`}
      >
        <span className="truncate" title={reunion.titulo}>
          {reunion.titulo}
        </span>
      </button>
    </li>
  );
}

// Chip de tarea en la franja de todo el día: franja lateral del semáforo, ícono y texto del vencimiento
function ChipTareaDiaCompleto({ tarea, compacto }: { tarea: EventoTarea; compacto: boolean }) {
  const { nivel } = tarea.semaforo;
  return (
    <li>
      <Link
        href={`/tareas/${tarea.id}`}
        aria-label={nombreAccesibleTarea(tarea)}
        title={`${tarea.titulo} · ${tarea.semaforo.texto}`}
        className={`foco-interior text-base-content flex min-h-6 w-full cursor-pointer flex-col justify-center rounded-lg border-l-[3px] py-0.5 text-left text-xs leading-tight transition-colors duration-150 hover:brightness-95 [@media(pointer:coarse)]:min-h-11 ${compacto ? "px-1" : "px-1.5"} ${BORDE_SEMAFORO[nivel]} ${CLASES_SEMAFORO[nivel].fondo}`}
      >
        {/* En la semana el título admite dos líneas para que se lea más; el semáforo va siempre debajo */}
        <span className="flex items-start gap-1 font-medium">
          <Icono nombre="bandera" tamano={12} className="mt-px shrink-0" />
          <span className={compacto ? "line-clamp-2 break-words" : "truncate"}>{tarea.titulo}</span>
        </span>
        <span className="text-suave truncate pl-4 text-[0.6875rem]" title={tarea.semaforo.texto}>
          {tarea.semaforo.texto}
        </span>
      </Link>
    </li>
  );
}

function LineaAhora({ minutos }: { minutos: number }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 z-10 flex items-center"
      style={{ top: `${(minutos / MINUTOS_DIA) * 100}%`, transform: "translateY(-50%)" }}
    >
      <span className="bg-error -ml-1 size-2.5 rounded-full" />
      <span className="bg-error h-0.5 flex-1" />
    </div>
  );
}

// Cuadrícula horaria de uno o siete días con franja de todo el día, línea de la hora actual y solapamientos
export function VistaCuadricula({
  dias,
  tareasPorDia,
  hoy,
  ahora,
  zona,
  cargando,
  claveDesplazamiento,
  alSeleccionar,
  alIrADia,
  vacio,
}: Propiedades) {
  const refDesplazable = useRef<HTMLDivElement | null>(null);
  const refCuerpo = useRef<HTMLDivElement | null>(null);
  const esDia = dias.length === 1;
  const incluyeHoy = dias.some((dia) => mismoDia(dia.dia, hoy));

  // La disposición solo depende de las reuniones y la zona, no del reloj
  const colocados = useMemo(() => dias.map((dia) => disponerColumnas(dia.conHora)), [dias]);

  const primerInicioMin = useMemo(() => {
    let primero: number | null = null;
    for (const dia of dias) {
      for (const tramo of dia.conHora) {
        if (primero === null || tramo.inicioMin < primero) primero = tramo.inicioMin;
      }
    }
    return primero;
  }, [dias]);

  // Al cambiar de rango se sitúa la hora actual o la primera reunión cerca del borde superior
  useEffect(() => {
    const contenedor = refDesplazable.current;
    const cuerpo = refCuerpo.current;
    if (!contenedor || !cuerpo) return;
    const pxPorHora = cuerpo.offsetHeight / 24;
    const hora = horaInicialDeDesplazamiento({
      incluyeHoy,
      minutosAhora: minutosDelDia(Date.now(), zona),
      primerInicioMin,
      mostrarPrimeraReunion: true,
    });
    contenedor.scrollTop = hora * pxPorHora;
  }, [claveDesplazamiento, incluyeHoy, zona, primerInicioMin]);

  const minutosAhora = minutosDelDia(ahora, zona);

  return (
    <div
      className={`${CLASE_ALTO_HORA} tarjeta relative flex flex-col overflow-hidden`}
      style={{ maxHeight: ALTO_MARCO }}
    >
      {/* Con poco ancho la semana se desplaza en horizontal dentro del marco y la columna de horas queda fija */}
      <div className="flex min-h-0 flex-1 flex-col overflow-x-auto overflow-y-hidden">
        <div className="flex min-h-0 flex-1 flex-col" style={anchoMinimoCuadricula(dias.length)}>
          {/* El encabezado queda fuera del área con scroll y reserva el mismo espacio de la barra lateral */}
          <div className="border-linea-tarjeta bg-base-100 relative z-20 shrink-0 [scrollbar-gutter:stable] overflow-y-hidden rounded-t-[calc(1.25rem-1px)] border-b">
            <div className="grid" style={estiloColumnas(dias.length)}>
              <div aria-hidden="true" className={CLASE_GUTTER_FIJO} />
              {dias.map((dia) => {
                const esHoy = mismoDia(dia.dia, hoy);
                const contenido = (
                  <>
                    <span
                      className={`text-xs font-medium tracking-wide uppercase ${esHoy ? "text-primary" : "text-suave"}`}
                    >
                      {esDia ? nombreDia(dia.dia) : diaCorto(dia.dia)}
                    </span>
                    <span
                      className={`grid size-9 place-items-center rounded-full text-lg font-bold tabular-nums ${
                        esHoy ? "bg-primary text-primary-content" : ""
                      }`}
                    >
                      {dia.dia.dia}
                    </span>
                  </>
                );
                return alIrADia && !esDia ? (
                  <button
                    key={dia.clave}
                    type="button"
                    onClick={() => alIrADia(dia.dia)}
                    aria-label={`Ver ${fechaLarga(dia.dia, hoy)}${esHoy ? " (hoy)" : ""}`}
                    aria-current={esHoy ? "date" : undefined}
                    className="foco-interior hover:bg-base-content/5 border-linea-tarjeta flex min-h-16 cursor-pointer flex-col items-center justify-center gap-0.5 border-l py-1 transition-colors duration-150"
                  >
                    {contenido}
                  </button>
                ) : (
                  <div
                    key={dia.clave}
                    aria-current={esHoy ? "date" : undefined}
                    className="border-linea-tarjeta flex min-h-16 flex-row-reverse items-center justify-end gap-3 border-l px-4 py-1"
                  >
                    {contenido}
                  </div>
                );
              })}
            </div>
            <div className="border-linea-tarjeta grid border-t" style={estiloColumnas(dias.length)}>
              <div
                className={`${CLASE_GUTTER_FIJO} text-suave flex items-start justify-end pt-1.5 pr-2 text-[0.6875rem] leading-tight`}
              >
                <span className="text-right whitespace-nowrap">Todo el día</span>
              </div>
              {dias.map((dia) => {
                const tareas = tareasPorDia.get(dia.clave) ?? SIN_TAREAS;
                // En la semana cada columna es angosta: se muestran pocas tareas y el resto lleva al día
                const visibles = esDia ? tareas : tareas.slice(0, MAX_TAREAS_SEMANA);
                const restantes = tareas.length - visibles.length;
                return (
                  <ul
                    key={dia.clave}
                    role="list"
                    aria-label={`Eventos y tareas de todo el día, ${fechaLarga(dia.dia, hoy)}`}
                    aria-hidden={dia.todoElDia.length + tareas.length === 0 || undefined}
                    className={`border-linea-tarjeta flex min-h-8 flex-col gap-0.5 border-l p-0.5 ${
                      esDia ? "max-h-[40vh] overflow-y-auto" : ""
                    }`}
                  >
                    {dia.todoElDia.map((reunion) => (
                      <ChipTodoElDia
                        key={reunion.id}
                        reunion={reunion}
                        hoy={hoy}
                        zona={zona}
                        alSeleccionar={alSeleccionar}
                      />
                    ))}
                    {visibles.map((tarea) => (
                      <ChipTareaDiaCompleto key={tarea.id} tarea={tarea} compacto={!esDia} />
                    ))}
                    {restantes > 0 && alIrADia ? (
                      <li>
                        <button
                          type="button"
                          onClick={() => alIrADia(dia.dia)}
                          aria-label={`Ver ${textoCantidad(restantes, "tarea más", "tareas más")} del ${fechaLarga(dia.dia, hoy)}`}
                          className="foco-interior text-primary hover:bg-primary/10 flex min-h-6 w-full cursor-pointer items-center rounded-lg px-1.5 text-left text-xs font-bold transition-colors duration-150 [@media(pointer:coarse)]:min-h-11"
                        >
                          +{restantes} más
                        </button>
                      </li>
                    ) : null}
                  </ul>
                );
              })}
            </div>
          </div>

          <div className="relative flex min-h-0 flex-1 flex-col">
            <div
              ref={refDesplazable}
              className="min-h-0 flex-1 [scrollbar-gutter:stable] overflow-y-auto rounded-b-[calc(1.25rem-1px)] pt-3"
            >
              <div
                ref={refCuerpo}
                className={`grid transition-opacity duration-200 ${cargando ? "opacity-60" : "opacity-100"}`}
                style={estiloColumnas(dias.length)}
              >
                <div
                  aria-hidden="true"
                  className={`${CLASE_GUTTER_FIJO} relative`}
                  style={{ height: ALTO_DIA }}
                >
                  {HORAS.map((hora) => (
                    <span
                      key={hora}
                      className="text-suave absolute right-2 -translate-y-1/2 text-xs tabular-nums"
                      style={{ top: `calc(${hora} * var(--alto-hora))` }}
                    >
                      {etiquetaHora(hora)}
                    </span>
                  ))}
                </div>
                {dias.map((dia, indice) => {
                  const esHoy = mismoDia(dia.dia, hoy);
                  return (
                    <ul
                      key={dia.clave}
                      role="list"
                      aria-label={`Reuniones con hora, ${fechaLarga(dia.dia, hoy)}`}
                      aria-hidden={colocados[indice].length === 0 || undefined}
                      className={`border-linea-tarjeta relative border-l ${esHoy ? "bg-primary/5" : ""}`}
                      style={{ height: ALTO_DIA }}
                    >
                      <LineasHora enLista />
                      {colocados[indice].map((tramo) => (
                        <BloqueEvento
                          key={`${tramo.reunion.id}-${dia.clave}`}
                          tramo={tramo}
                          hoy={hoy}
                          zona={zona}
                          alSeleccionar={alSeleccionar}
                        />
                      ))}
                      {esHoy ? <LineaAhora minutos={minutosAhora} /> : null}
                    </ul>
                  );
                })}
              </div>
            </div>
            {vacio}
          </div>
        </div>
      </div>
    </div>
  );
}

// Bloques falsos por columna como [hora de inicio, duración en horas]
const PATRON_ESQUELETO: [number, number][][] = [
  [
    [9, 2],
    [13, 1.5],
  ],
  [[10, 1]],
  [
    [8.5, 2],
    [15, 1],
  ],
  [[11, 1.5]],
  [
    [9.5, 1],
    [14, 2],
  ],
  [],
  [[10, 1]],
];

// Marcador de posición con el mismo marco y alto que la cuadrícula: solo cambian los bloques
export function EsqueletoCuadricula({ columnas }: { columnas: 1 | 7 }) {
  const cuerpo = Array.from({ length: columnas });
  return (
    <div
      className={`${CLASE_ALTO_HORA} tarjeta flex flex-col overflow-hidden`}
      style={{ height: ALTO_MARCO }}
      aria-hidden="true"
    >
      <div className="border-linea-tarjeta border-b">
        <div className="grid" style={estiloColumnas(columnas)}>
          <div />
          {cuerpo.map((_, indice) => (
            <div
              key={indice}
              className="border-linea-tarjeta flex min-h-16 flex-col items-center justify-center gap-1.5 border-l"
            >
              <span className="skeleton h-3 w-8" />
              <span className="skeleton size-9 rounded-full" />
            </div>
          ))}
        </div>
        <div
          className="border-linea-tarjeta grid min-h-8 border-t"
          style={estiloColumnas(columnas)}
        >
          <div />
          {cuerpo.map((_, indice) => (
            <div key={indice} className="border-linea-tarjeta border-l" />
          ))}
        </div>
      </div>
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <div className="grid" style={{ ...estiloColumnas(columnas), height: ALTO_DIA }}>
          <div />
          {cuerpo.map((_, indice) => (
            <div key={indice} className="border-linea-tarjeta relative border-l">
              <LineasHora />
              {PATRON_ESQUELETO[indice % PATRON_ESQUELETO.length].map(([inicio, duracion]) => (
                <span
                  key={inicio}
                  className="skeleton absolute inset-x-1 rounded-lg"
                  style={{
                    top: `calc(${inicio} * var(--alto-hora))`,
                    height: `calc(${duracion} * var(--alto-hora))`,
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
