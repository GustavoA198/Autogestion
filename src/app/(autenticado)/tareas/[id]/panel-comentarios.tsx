"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useAvisos } from "@/componentes/aviso";
import { AreaTexto } from "@/componentes/area-texto";
import { Boton } from "@/componentes/boton";
import { Icono } from "@/componentes/icono";
import { Tarjeta } from "@/componentes/shell/tarjeta";
import { LIMITES_TAREA } from "@/lib/tareas/validacion";
import { accionAgregarComentario, accionEliminarComentario } from "../acciones";

// La fecha llega ya formateada desde el servidor para evitar diferencias de zona al hidratar
type Comentario = { id: string; texto: string; fechaTexto: string };

export function PanelComentarios({
  tareaId,
  comentarios,
}: {
  tareaId: string;
  comentarios: Comentario[];
}) {
  const { notificar } = useAvisos();
  const [, iniciar] = useTransition();
  const [agregando, iniciarAgregar] = useTransition();
  const [texto, setTexto] = useState("");
  const [error, setError] = useState<string | undefined>();

  function eliminar(id: string) {
    iniciar(async () => {
      const resultado = await accionEliminarComentario(id);
      if (resultado.ok) notificar("Comentario eliminado.", "exito");
      else notificar(resultado.error ?? "No se pudo eliminar el comentario.", "critico");
    });
  }

  function agregar(evento: FormEvent) {
    evento.preventDefault();
    iniciarAgregar(async () => {
      const resultado = await accionAgregarComentario(tareaId, texto);
      if (resultado.ok) {
        setTexto("");
        setError(undefined);
      } else {
        setError(resultado.error ?? "No se pudo agregar el comentario.");
      }
    });
  }

  return (
    <Tarjeta titulo="Comentarios y avances">
      <form onSubmit={agregar} className="space-y-3" noValidate>
        <AreaTexto
          etiqueta="Nuevo comentario o avance"
          rows={3}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          maxLength={LIMITES_TAREA.comentario}
          invalido={Boolean(error)}
          mensaje={error}
        />
        <div className="flex justify-end">
          <Boton type="submit" variante="secundario" cargando={agregando}>
            <Icono nombre="mensaje" tamano={16} />
            Publicar
          </Boton>
        </div>
      </form>
      {comentarios.length === 0 ? (
        <p className="text-suave text-sm">
          Aún no hay comentarios. Registra aquí lo que avanzas o lo que te bloquea.
        </p>
      ) : (
        <ul className="lista-filas">
          {comentarios.map((comentario) => (
            <li key={comentario.id} className="tarjeta-fila px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-suave font-mono text-xs">{comentario.fechaTexto}</p>
                <Boton
                  variante="fantasma"
                  tamano="pequeno"
                  className="btn-square text-suave hover:text-error"
                  onClick={() => eliminar(comentario.id)}
                  aria-label={`Eliminar el comentario del ${comentario.fechaTexto}`}
                >
                  <Icono nombre="papelera" tamano={16} />
                </Boton>
              </div>
              <p className="text-sm break-words whitespace-pre-wrap">{comentario.texto}</p>
            </li>
          ))}
        </ul>
      )}
    </Tarjeta>
  );
}
