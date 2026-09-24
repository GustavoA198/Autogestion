import { useId, type ReactNode } from "react";

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

type PropiedadesMensaje = { id?: string; invalido?: boolean; children?: ReactNode };

export function MensajeCampo({ id, invalido, children }: PropiedadesMensaje) {
  if (!children) return null;
  return (
    <p id={id} className={invalido ? "text-error mt-1 text-sm" : "mt-1 text-sm opacity-70"}>
      {children}
    </p>
  );
}
