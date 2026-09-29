"use client";

import {
  useEffect,
  useOptimistic,
  useRef,
  useState,
  useTransition,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { useAvisos } from "@/componentes/aviso";
import { Boton } from "@/componentes/boton";
import { Confirmacion } from "@/componentes/confirmacion";
import { Entrada } from "@/componentes/entrada";
import { Icono } from "@/componentes/icono";
import { Tarjeta } from "@/componentes/shell/tarjeta";
import { BarraAvance } from "@/componentes/tarea/barra-avance";
import { avisarCambioNotificaciones } from "@/lib/notificaciones/eventos";
import { avanceDeTarea } from "@/lib/tareas/avance";
import { LIMITES_TAREA, validarSubtarea } from "@/lib/tareas/validacion";
import {
  accionAgregarSubtarea,
  accionAlternarSubtarea,
  accionEditarSubtarea,
  accionEliminarSubtarea,
  accionMoverSubtarea,
  type ResultadoAccionTarea,
} from "../acciones";

type Subtarea = {
  id: string;
  texto: string;
  descripcion: string | null;
  hecho: boolean;
  pendiente?: boolean;
};
type Sentido = "arriba" | "abajo";

// Cambios que se reflejan al instante mientras el servidor confirma
type Cambio =
  | { tipo: "alternar"; id: string }
  | { tipo: "editar"; id: string; texto: string; descripcion: string | null }
  | { tipo: "eliminar"; id: string }
  | { tipo: "mover"; id: string; sentido: Sentido }
  | { tipo: "agregar"; id: string; texto: string; descripcion: string | null };

function aplicarCambio(actuales: Subtarea[], cambio: Cambio): Subtarea[] {
  switch (cambio.tipo) {
    case "alternar":
      return actuales.map((s) => (s.id === cambio.id ? { ...s, hecho: !s.hecho } : s));
    case "editar":
      return actuales.map((s) =>
        s.id === cambio.id ? { ...s, texto: cambio.texto, descripcion: cambio.descripcion } : s,
      );
    case "eliminar":
      return actuales.filter((s) => s.id !== cambio.id);
    case "agregar":
      return [
        ...actuales,
        {
          id: cambio.id,
          texto: cambio.texto,
          descripcion: cambio.descripcion,
          hecho: false,
          pendiente: true,
        },
      ];
    case "mover": {
      const indice = actuales.findIndex((s) => s.id === cambio.id);
      const destino = cambio.sentido === "arriba" ? indice - 1 : indice + 1;
      if (indice < 0 || destino < 0 || destino >= actuales.length) return actuales;
      const copia = [...actuales];
      [copia[indice], copia[destino]] = [copia[destino]!, copia[indice]!];
      return copia;
    }
  }
}

type PropiedadesFila = {
  subtarea: Subtarea;
  indice: number;
  total: number;
  bloqueada: boolean;
  alAlternar: (id: string) => void;
  // Devuelve un mensaje si el texto no es válido; sin mensaje, el cambio ya se envió
  alEditar: (id: string, texto: string, descripcion: string | null) => string | undefined;
  alMover: (id: string, sentido: Sentido) => void;
  alPedirEliminar: (subtarea: Subtarea) => void;
};

// Fila con casilla, texto editable en línea y acciones de orden y borrado
function FilaSubtarea({
  subtarea,
  indice,
  total,
  bloqueada,
  alAlternar,
  alEditar,
  alMover,
  alPedirEliminar,
}: PropiedadesFila) {
  const [editando, setEditando] = useState(false);
  const [borrador, setBorrador] = useState("");
  const [borradorDesc, setBorradorDesc] = useState("");
  const [descExpandida, setDescExpandida] = useState(false);
  const [error, setError] = useState<string | undefined>();
  // Evita guardar dos veces cuando Enter o Esc desmontan el campo y disparan el blur
  const cerrado = useRef(false);
  const devolverFoco = useRef(false);
  const ultimoMovimiento = useRef<Sentido | null>(null);
  const fila = useRef<HTMLLIElement>(null);

  const inactiva = bloqueada || subtarea.pendiente === true;
  const esPrimera = indice === 0;
  const esUltima = indice === total - 1;
  const tieneDescripcion = Boolean(subtarea.descripcion);

  // Botón de la fila por su marca; los refs no se pasan a Boton
  function botonDe(accion: string) {
    return fila.current?.querySelector<HTMLButtonElement>(`[data-accion="${accion}"]`);
  }

  // Al llegar al extremo el botón pulsado se oculta: el foco pasa al botón opuesto
  useEffect(() => {
    if (ultimoMovimiento.current === "arriba" && esPrimera) botonDe("bajar")?.focus();
    if (ultimoMovimiento.current === "abajo" && esUltima) botonDe("subir")?.focus();
    ultimoMovimiento.current = null;
  }, [esPrimera, esUltima, indice]);

  useEffect(() => {
    if (!editando && devolverFoco.current) {
      devolverFoco.current = false;
      botonDe("editar")?.focus();
    }
  }, [editando]);

  function empezar() {
    if (inactiva) return;
    cerrado.current = false;
    setBorrador(subtarea.texto);
    setBorradorDesc(subtarea.descripcion ?? "");
    setError(undefined);
    setEditando(true);
  }

  function cerrar(conFoco: boolean) {
    cerrado.current = true;
    devolverFoco.current = conFoco;
    setEditando(false);
  }

  function guardar(conFoco: boolean) {
    if (cerrado.current) return;
    const nuevo = borrador.trim();
    const nuevaDesc = borradorDesc.trim();
    const descNormalizada = nuevaDesc === "" ? null : nuevaDesc;
    if (nuevo === subtarea.texto && descNormalizada === (subtarea.descripcion ?? null)) {
      return cerrar(conFoco);
    }
    const problema = alEditar(subtarea.id, nuevo, descNormalizada);
    if (problema) return setError(problema);
    cerrar(conFoco);
  }

  function alPulsar(evento: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) {
    if (evento.key === "Enter" && !(evento.target instanceof HTMLTextAreaElement)) {
      evento.preventDefault();
      guardar(true);
    } else if (evento.key === "Escape") {
      evento.preventDefault();
      cerrar(true);
    }
  }

  function mover(sentido: Sentido) {
    ultimoMovimiento.current = sentido;
    alMover(subtarea.id, sentido);
  }

  const claseBoton = "btn-square text-suave";
  return (
    <li
      ref={fila}
      className="tarjeta-fila flex flex-wrap items-center gap-x-1 px-2 py-1 sm:flex-nowrap sm:px-3"
    >
      <label className="hover:bg-hover grid size-11 shrink-0 cursor-pointer place-items-center rounded-full transition-colors duration-150 has-[:disabled]:cursor-not-allowed has-[:disabled]:hover:bg-transparent md:size-9">
        <input
          type="checkbox"
          className="checkbox checkbox-primary checkbox-sm"
          checked={subtarea.hecho}
          disabled={inactiva}
          onChange={() => alAlternar(subtarea.id)}
          aria-label={subtarea.texto}
        />
      </label>

      <div className="min-w-0 basis-[calc(100%-3rem)] sm:flex-1 sm:basis-0">
        {editando ? (
          <div className="space-y-1.5 py-1.5">
            <input
              type="text"
              value={borrador}
              autoFocus
              autoComplete="off"
              maxLength={LIMITES_TAREA.subtareaTexto}
              onChange={(e) => setBorrador(e.target.value)}
              onKeyDown={alPulsar}
              onBlur={() => guardar(false)}
              className={`input input-sm w-full ${error ? "input-error" : ""}`}
              aria-label={`Editar el texto de la subtarea «${subtarea.texto}»`}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? `error-${subtarea.id}` : undefined}
            />
            <textarea
              value={borradorDesc}
              rows={2}
              maxLength={LIMITES_TAREA.subtareaDescripcion}
              onChange={(e) => setBorradorDesc(e.target.value)}
              onKeyDown={alPulsar}
              placeholder="Descripción opcional (Enter guarda · Esc cancela)"
              className="textarea textarea-sm w-full resize-y text-sm"
              aria-label={`Editar la descripción de la subtarea «${subtarea.texto}»`}
            />
            {error ? (
              <p id={`error-${subtarea.id}`} role="alert" className="text-error text-xs">
                {error}
              </p>
            ) : (
              <p className="text-tenue text-xs">Enter guarda · Esc cancela</p>
            )}
          </div>
        ) : (
          <div className={`min-w-0 ${subtarea.pendiente ? "opacity-60" : ""}`}>
            <div className="flex items-start gap-1.5">
              {tieneDescripcion ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDescExpandida((v) => !v);
                  }}
                  aria-expanded={descExpandida}
                  aria-label={descExpandida ? "Ocultar descripción" : "Ver descripción"}
                  title={descExpandida ? "Ocultar descripción" : "Ver descripción"}
                  className="text-suave hover:text-base-content hover:bg-hover mt-0.5 grid size-7 shrink-0 cursor-pointer place-items-center rounded-md transition-colors duration-150"
                >
                  <Icono
                    nombre="chevron-derecha"
                    tamano={14}
                    className={`transition-transform duration-150 ${descExpandida ? "rotate-90" : ""}`}
                  />
                </button>
              ) : (
                <span aria-hidden="true" className="w-7 shrink-0" />
              )}
              <span
                onDoubleClick={empezar}
                title={inactiva ? undefined : "Doble clic para editar"}
                className={`block min-w-0 py-1 text-sm break-words ${subtarea.hecho ? "text-tenue line-through" : ""}`}
              >
                {subtarea.texto}
              </span>
            </div>
            {tieneDescripcion && descExpandida ? (
              <p
                className={`text-tenue mt-0.5 ml-7 whitespace-pre-wrap break-words pb-1 text-xs ${subtarea.hecho ? "line-through" : ""}`}
              >
                {subtarea.descripcion}
              </p>
            ) : null}
          </div>
        )}
      </div>

      <div className="ml-auto flex shrink-0 items-center">
        <Boton
          data-accion="editar"
          variante="fantasma"
          tamano="pequeno"
          className={`${claseBoton} hover:text-base-content ${editando ? "hidden" : ""}`}
          disabled={inactiva}
          onClick={empezar}
          aria-label={`Editar la subtarea «${subtarea.texto}»`}
        >
          <Icono nombre="editar" tamano={16} />
        </Boton>
        <Boton
          data-accion="subir"
          variante="fantasma"
          tamano="pequeno"
          className={`${claseBoton} ${esPrimera ? "invisible" : ""}`}
          disabled={inactiva || esPrimera}
          onClick={() => mover("arriba")}
          aria-label={`Subir la subtarea «${subtarea.texto}»`}
          aria-hidden={esPrimera || undefined}
          tabIndex={esPrimera ? -1 : undefined}
        >
          <Icono nombre="chevron-arriba" tamano={16} />
        </Boton>
        <Boton
          data-accion="bajar"
          variante="fantasma"
          tamano="pequeno"
          className={`${claseBoton} ${esUltima ? "invisible" : ""}`}
          disabled={inactiva || esUltima}
          onClick={() => mover("abajo")}
          aria-label={`Bajar la subtarea «${subtarea.texto}»`}
          aria-hidden={esUltima || undefined}
          tabIndex={esUltima ? -1 : undefined}
        >
          <Icono nombre="chevron-abajo" tamano={16} />
        </Boton>
        <Boton
          variante="fantasma"
          tamano="pequeno"
          className={`${claseBoton} hover:text-error`}
          disabled={inactiva}
          onClick={() => alPedirEliminar(subtarea)}
          aria-label={`Eliminar la subtarea «${subtarea.texto}»`}
        >
          <Icono nombre="papelera" tamano={16} />
        </Boton>
      </div>
    </li>
  );
}

type Propiedades = {
  tareaId: string;
  estado: string;
  subtareas: Subtarea[];
  cerrada: boolean;
};

// CRUD de subtareas: cada cambio se ve al instante y luego se confirma en el servidor
export function PanelSubtareas({ tareaId, estado, subtareas, cerrada }: Propiedades) {
  const { notificar } = useAvisos();
  const [, iniciar] = useTransition();
  const [, iniciarAgregar] = useTransition();
  const [eliminando, iniciarEliminar] = useTransition();
  const [texto, setTexto] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [mostrarDescripcion, setMostrarDescripcion] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [anuncio, setAnuncio] = useState("");
  const [porEliminar, setPorEliminar] = useState<Subtarea | null>(null);
  const formulario = useRef<HTMLFormElement>(null);
  const contadorTemporal = useRef(0);
  const [visibles, cambiar] = useOptimistic(subtareas, aplicarCambio);
  const avance = avanceDeTarea({ estado, subtareas: visibles });

  // Ejecuta la acción; si falla, avisa y el estado optimista se descarta al refrescar
  function ejecutar(cambio: Cambio, accion: () => Promise<ResultadoAccionTarea>, fallo: string) {
    iniciar(async () => {
      cambiar(cambio);
      const resultado = await accion();
      if (resultado.ok) avisarCambioNotificaciones();
      else notificar(resultado.error ?? fallo, "critico");
    });
  }

  function alternar(id: string) {
    ejecutar(
      { tipo: "alternar", id },
      () => accionAlternarSubtarea(id),
      "No se pudo actualizar la subtarea.",
    );
  }

  function editar(id: string, nuevo: string, nuevaDesc: string | null): string | undefined {
    const validado = validarSubtarea(nuevo);
    if (!validado.ok) return validado.error;
    ejecutar(
      { tipo: "editar", id, texto: validado.texto, descripcion: nuevaDesc },
      () => accionEditarSubtarea(id, validado.texto, nuevaDesc ?? undefined),
      "No se pudo guardar la subtarea.",
    );
    return undefined;
  }

  function mover(id: string, sentido: Sentido) {
    const posicion = visibles.findIndex((s) => s.id === id) + (sentido === "arriba" ? 0 : 2);
    setAnuncio(`Subtarea movida a la posición ${posicion} de ${visibles.length}.`);
    ejecutar(
      { tipo: "mover", id, sentido },
      () => accionMoverSubtarea(id, sentido),
      "No se pudo mover la subtarea.",
    );
  }

  function confirmarEliminar() {
    if (!porEliminar) return;
    const { id } = porEliminar;
    iniciarEliminar(async () => {
      cambiar({ tipo: "eliminar", id });
      const resultado = await accionEliminarSubtarea(id);
      if (resultado.ok) {
        notificar("Subtarea eliminada.", "exito");
        avisarCambioNotificaciones();
      } else notificar(resultado.error ?? "No se pudo eliminar la subtarea.", "critico");
      setPorEliminar(null);
    });
  }

  function agregar(evento: FormEvent) {
    evento.preventDefault();
    const validado = validarSubtarea(texto);
    if (!validado.ok) {
      setError(validado.error);
      return;
    }
    const descripcionLimpia = descripcion.trim() === "" ? null : descripcion.trim();
    setError(undefined);
    setTexto("");
    setDescripcion("");
    setMostrarDescripcion(false);
    contadorTemporal.current += 1;
    const idTemporal = `temporal-${contadorTemporal.current}`;
    iniciarAgregar(async () => {
      cambiar({
        tipo: "agregar",
        id: idTemporal,
        texto: validado.texto,
        descripcion: descripcionLimpia,
      });
      const resultado = await accionAgregarSubtarea(tareaId, validado.texto, descripcionLimpia ?? undefined);
      if (resultado.ok) avisarCambioNotificaciones();
      else {
        setTexto(validado.texto);
        setError(resultado.error ?? "No se pudo agregar la subtarea.");
      }
    });
    formulario.current?.querySelector("input")?.focus();
  }

  return (
    <Tarjeta
      titulo="Subtareas"
      accion={
        avance.total > 0 ? (
          <span className="bg-hundida border-linea-tarjeta text-suave rounded-full border px-3 py-1 font-mono text-xs font-bold tabular-nums">
            {avance.hechas} de {avance.total} · {avance.porcentaje} %
          </span>
        ) : undefined
      }
    >
      {avance.total > 0 ? (
        <BarraAvance
          valor={avance.porcentaje}
          etiqueta={`Avance de subtareas: ${avance.hechas} de ${avance.total}`}
          mostrarTexto={false}
        />
      ) : null}

      {cerrada ? (
        <p
          role="note"
          className="border-linea-tarjeta bg-hundida text-suave flex items-start gap-2 rounded-2xl border px-3 py-2 text-sm"
        >
          <Icono nombre="info" tamano={16} className="mt-0.5 shrink-0" />
          Reabre la tarea para cambiar sus subtareas.
        </p>
      ) : null}

      {visibles.length === 0 ? (
        <p className="text-suave text-sm">
          Esta tarea no tiene subtareas. Agrega pasos para medir su avance.
        </p>
      ) : (
        <ul className="lista-filas">
          {visibles.map((subtarea, indice) => (
            <FilaSubtarea
              key={subtarea.id}
              subtarea={subtarea}
              indice={indice}
              total={visibles.length}
              bloqueada={cerrada}
              alAlternar={alternar}
              alEditar={editar}
              alMover={mover}
              alPedirEliminar={setPorEliminar}
            />
          ))}
        </ul>
      )}

      {cerrada ? null : (
        <form
          ref={formulario}
          onSubmit={agregar}
          className="border-linea-tarjeta bg-hundida/40 space-y-3 rounded-2xl border p-3 sm:p-4"
          noValidate
        >
          <div className="flex items-start gap-2">
            <button
              type="button"
              onClick={() => setMostrarDescripcion((v) => !v)}
              aria-expanded={mostrarDescripcion}
              aria-label={mostrarDescripcion ? "Ocultar descripción" : "Agregar descripción"}
              title={mostrarDescripcion ? "Ocultar descripción" : "Agregar descripción"}
              className="text-suave hover:text-base-content hover:bg-hover mt-0.5 grid size-9 shrink-0 cursor-pointer place-items-center rounded-md transition-colors duration-150"
            >
              <Icono
                nombre="chevron-derecha"
                tamano={14}
                className={`transition-transform duration-150 ${mostrarDescripcion ? "rotate-90" : ""}`}
              />
            </button>
            <div className="min-w-0 flex-1">
              <Entrada
                etiqueta="Nueva subtarea"
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                maxLength={LIMITES_TAREA.subtareaTexto}
                autoComplete="off"
                enterKeyHint="done"
                invalido={Boolean(error)}
                mensaje={error ?? "Presiona Enter para agregar varias seguidas."}
              />
            </div>
          </div>
          {mostrarDescripcion ? (
            <div className="ml-11">
              <label htmlFor="descripcion-nueva-subtarea" className="sr-only">
                Descripción de la nueva subtarea
              </label>
              <textarea
                id="descripcion-nueva-subtarea"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                maxLength={LIMITES_TAREA.subtareaDescripcion}
                rows={2}
                placeholder="Descripción (opcional)"
                className="textarea textarea-sm w-full resize-y text-sm"
              />
            </div>
          ) : null}
          <div className="flex justify-end">
            {/* Sin estado de carga: un botón deshabilitado bloquearía el Enter de la siguiente subtarea */}
            <Boton type="submit" variante="secundario">
              <Icono nombre="mas" tamano={16} />
              Agregar
            </Boton>
          </div>
        </form>
      )}

      <p className="sr-only" role="status" aria-live="polite">
        {anuncio}
      </p>

      <Confirmacion
        abierto={porEliminar !== null}
        alCancelar={() => setPorEliminar(null)}
        alConfirmar={confirmarEliminar}
        titulo="Eliminar subtarea"
        mensaje={`¿Eliminar la subtarea «${porEliminar?.texto ?? ""}»? Esta acción no se puede deshacer.`}
        textoConfirmar="Eliminar"
        cargando={eliminando}
        destructivo
      />
    </Tarjeta>
  );
}
