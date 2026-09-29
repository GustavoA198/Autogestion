"use client";

import { useOptimistic, useTransition } from "react";
import { useAvisos } from "@/componentes/aviso";
import { Selector } from "@/componentes/selector";
import { avisarCambioNotificaciones } from "@/lib/notificaciones/eventos";
import { ESTADO_LABEL } from "@/lib/tareas/presentacion";
import { accionCambiarEstadoTarea } from "../acciones";

// Cambio rápido de estado con actualización inmediata y aviso del resultado
export function SelectorEstado({ id, estado }: { id: string; estado: string }) {
  const { notificar } = useAvisos();
  const [pendiente, iniciar] = useTransition();
  const [estadoVisible, mostrarEstado] = useOptimistic(estado);

  function cambiar(nuevo: string) {
    iniciar(async () => {
      mostrarEstado(nuevo);
      const resultado = await accionCambiarEstadoTarea(id, nuevo);
      if (resultado.ok) {
        notificar(`Estado cambiado a «${ESTADO_LABEL[nuevo] ?? nuevo}».`, "exito");
        avisarCambioNotificaciones();
      } else notificar(resultado.error ?? "No se pudo cambiar el estado.", "critico");
    });
  }

  return (
    <Selector
      etiqueta="Estado"
      value={estadoVisible}
      disabled={pendiente}
      aria-busy={pendiente || undefined}
      onChange={(evento) => cambiar(evento.target.value)}
    >
      {Object.entries(ESTADO_LABEL).map(([valor, texto]) => (
        <option key={valor} value={valor}>
          {texto}
        </option>
      ))}
    </Selector>
  );
}
