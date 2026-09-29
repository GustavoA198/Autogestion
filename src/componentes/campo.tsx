import { useId, type ReactNode } from "react";
import { Icono } from "@/componentes/icono";

// Une clases descartando los valores vacíos
export function unirClases(...clases: Array<string | false | null | undefined>): string {
  return clases.filter(Boolean).join(" ");
}

// Resuelve el id del campo (propio o generado) y enlaza el mensaje de ayuda o error
export function useCampo(
  id: string | undefined,
  mensaje: string | undefined,
  describedBy?: string,
) {
  const generado = useId();
  const idCampo = id ?? generado;
  const idMensaje = mensaje ? `${idCampo}-mensaje` : undefined;
  const descripcion = unirClases(describedBy, idMensaje) || undefined;
  return { idCampo, idMensaje, descripcion };
}

export function EtiquetaCampo({ htmlFor, children }: { htmlFor: string; children: ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="text-base-content mb-1.5 block text-sm font-bold">
      {children}
    </label>
  );
}

type PropiedadesMensaje = { id?: string; invalido?: boolean; children?: ReactNode };

// El error se anuncia junto al campo; la ayuda es texto de apoyo sin rol
export function MensajeCampo({ id, invalido, children }: PropiedadesMensaje) {
  if (!children) return null;
  if (invalido) {
    return (
      <p id={id} role="alert" className="text-error mt-1.5 flex items-start gap-1.5 text-sm">
        <Icono nombre="error" tamano={16} className="mt-0.5" />
        {children}
      </p>
    );
  }
  return (
    <p id={id} className="text-suave mt-1.5 text-sm">
      {children}
    </p>
  );
}
