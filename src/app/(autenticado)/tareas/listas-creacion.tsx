"use client";

import { Boton } from "@/componentes/boton";
import { MensajeCampo, unirClases, useCampo } from "@/componentes/campo";
import { Entrada } from "@/componentes/entrada";
import { Icono } from "@/componentes/icono";
import { LIMITES_TAREA } from "@/lib/tareas/validacion";

export type FilaEnlace = { clave: number; etiqueta: string; url: string };
export type FilaSubtarea = {
  clave: number;
  texto: string;
  descripcion?: string;
  mostrarDescripcion?: boolean;
  enfocar?: boolean;
};

export function siguienteClave(filas: { clave: number }[]): number {
  return filas.reduce((maximo, fila) => Math.max(maximo, fila.clave), 0) + 1;
}

type PropiedadesEnlaces = {
  filas: FilaEnlace[];
  alCambiar: (filas: FilaEnlace[]) => void;
  errores?: Record<number, { etiqueta?: string; url?: string }>;
};

// Filas de enlaces (etiqueta y dirección) que se envían como campos repetidos
export function EditorEnlaces({ filas, alCambiar, errores }: PropiedadesEnlaces) {
  function editar(clave: number, cambio: Partial<FilaEnlace>) {
    alCambiar(filas.map((f) => (f.clave === clave ? { ...f, ...cambio } : f)));
  }

  return (
    <div className="space-y-4">
      {filas.length === 0 ? (
        <p className="text-suave text-sm">
          Sin enlaces. Agrega documentos, tickets o cualquier referencia útil.
        </p>
      ) : null}
      {filas.map((fila, indice) => (
        <div
          key={fila.clave}
          className="grid items-start gap-x-3 gap-y-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)_auto]"
        >
          <Entrada
            etiqueta="Etiqueta"
            name="enlaceEtiqueta"
            autoComplete="off"
            maxLength={LIMITES_TAREA.enlaceEtiqueta}
            value={fila.etiqueta}
            onChange={(e) => editar(fila.clave, { etiqueta: e.target.value })}
            invalido={Boolean(errores?.[indice]?.etiqueta)}
            mensaje={errores?.[indice]?.etiqueta}
          />
          <Entrada
            etiqueta="Dirección"
            name="enlaceUrl"
            type="url"
            inputMode="url"
            autoComplete="off"
            maxLength={LIMITES_TAREA.enlaceUrl}
            value={fila.url}
            onChange={(e) => editar(fila.clave, { url: e.target.value })}
            invalido={Boolean(errores?.[indice]?.url)}
            mensaje={errores?.[indice]?.url}
          />
          <Boton
            variante="fantasma"
            tamano="pequeno"
            className="text-error justify-self-end sm:mt-[1.75rem]"
            onClick={() => alCambiar(filas.filter((f) => f.clave !== fila.clave))}
            aria-label={`Quitar el enlace ${indice + 1}`}
          >
            <Icono nombre="papelera" tamano={16} />
            Quitar
          </Boton>
        </div>
      ))}
      <Boton
        variante="secundario"
        tamano="pequeno"
        onClick={() =>
          alCambiar([...filas, { clave: siguienteClave(filas), etiqueta: "", url: "" }])
        }
      >
        <Icono nombre="mas" tamano={16} />
        Agregar enlace
      </Boton>
    </div>
  );
}

type PropiedadesSubtarea = {
  fila: FilaSubtarea;
  numero: number;
  error?: string;
  alEditar: (texto: string, descripcion?: string, mostrarDescripcion?: boolean) => void;
  alQuitar: () => void;
  alAlternarDescripcion: () => void;
  alAgregarDebajo: () => void;
};

// La etiqueta es solo para lectores de pantalla: el número visible hace de guía visual
function CampoSubtarea({
  fila,
  numero,
  error,
  alEditar,
  alQuitar,
  alAlternarDescripcion,
  alAgregarDebajo,
}: PropiedadesSubtarea) {
  const { idCampo, idMensaje, descripcion } = useCampo(undefined, error);
  const mostrarDesc = fila.mostrarDescripcion === true;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-start gap-2">
        <span aria-hidden="true" className="text-tenue mt-2.5 w-6 text-sm tabular-nums">
          {numero}.
        </span>
        <button
          type="button"
          onClick={alAlternarDescripcion}
          aria-expanded={mostrarDesc}
          aria-label={mostrarDesc ? "Ocultar descripción" : "Agregar descripción"}
          title={mostrarDesc ? "Ocultar descripción" : "Agregar descripción"}
          className="text-suave hover:text-base-content hover:bg-hover mt-0.5 grid size-9 shrink-0 cursor-pointer place-items-center rounded-md transition-colors duration-150"
        >
          <Icono
            nombre="chevron-derecha"
            tamano={14}
            className={`transition-transform duration-150 ${mostrarDesc ? "rotate-90" : ""}`}
          />
        </button>
        <div className="min-w-0 flex-1">
          <label htmlFor={idCampo} className="sr-only">
            {`Subtarea ${numero}`}
          </label>
          <input
            id={idCampo}
            name="subtarea"
            type="text"
            autoComplete="off"
            autoFocus={fila.enfocar}
            maxLength={LIMITES_TAREA.subtareaTexto}
            value={fila.texto}
            onChange={(e) => alEditar(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              e.preventDefault();
              alAgregarDebajo();
            }}
            className={unirClases("input w-full", error && "input-error")}
            aria-invalid={error ? true : undefined}
            aria-describedby={descripcion}
          />
          <MensajeCampo id={idMensaje} invalido={Boolean(error)}>
            {error}
          </MensajeCampo>
        </div>
        <Boton
          variante="fantasma"
          tamano="pequeno"
          className="btn-square text-error mt-0.5"
          onClick={alQuitar}
          aria-label={`Quitar la subtarea ${numero}`}
        >
          <Icono nombre="papelera" tamano={16} />
        </Boton>
      </div>
      {mostrarDesc ? (
        <div className="ml-8">
          <label htmlFor={`${idCampo}-desc`} className="sr-only">
            {`Descripción de la subtarea ${numero}`}
          </label>
          <textarea
            id={`${idCampo}-desc`}
            name="subtareaDescripcion"
            rows={2}
            maxLength={LIMITES_TAREA.subtareaDescripcion}
            placeholder="Descripción (opcional)"
            value={fila.descripcion ?? ""}
            onChange={(e) =>
              alEditar(fila.texto, e.target.value, fila.mostrarDescripcion ?? false)
            }
            className="textarea textarea-sm w-full resize-y text-sm"
          />
        </div>
      ) : null}
    </div>
  );
}

type PropiedadesSubtareas = {
  filas: FilaSubtarea[];
  alCambiar: (filas: FilaSubtarea[]) => void;
  errores?: Record<number, string>;
};

// Subtareas iniciales; Enter agrega otra subtarea en lugar de enviar el formulario
export function EditorSubtareas({ filas, alCambiar, errores }: PropiedadesSubtareas) {
  function agregar() {
    alCambiar([...filas, { clave: siguienteClave(filas), texto: "", enfocar: true }]);
  }

  return (
    <div className="space-y-3">
      {filas.length === 0 ? (
        <p className="text-suave text-sm">
          Sin subtareas. Con subtareas, el avance se calcula según las que vayas marcando.
        </p>
      ) : null}
      {filas.map((fila, indice) => (
        <CampoSubtarea
          key={fila.clave}
          fila={fila}
          numero={indice + 1}
          error={errores?.[indice]}
          alEditar={(texto, descripcion, mostrarDescripcion) =>
            alCambiar(
              filas.map((f) =>
                f.clave === fila.clave
                  ? { ...f, texto, descripcion, mostrarDescripcion }
                  : f,
              ),
            )
          }
          alAlternarDescripcion={() =>
            alCambiar(
              filas.map((f) =>
                f.clave === fila.clave
                  ? {
                      ...f,
                      mostrarDescripcion: !(f.mostrarDescripcion ?? false),
                      descripcion: f.descripcion ?? "",
                    }
                  : f,
              ),
            )
          }
          alQuitar={() => alCambiar(filas.filter((f) => f.clave !== fila.clave))}
          alAgregarDebajo={agregar}
        />
      ))}
      <Boton variante="secundario" tamano="pequeno" onClick={agregar}>
        <Icono nombre="mas" tamano={16} />
        Agregar subtarea
      </Boton>
    </div>
  );
}
