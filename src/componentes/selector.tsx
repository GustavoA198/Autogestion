import type { SelectHTMLAttributes } from "react";
import { EtiquetaCampo, MensajeCampo, unirClases, useCampo } from "@/componentes/campo";

type Propiedades = SelectHTMLAttributes<HTMLSelectElement> & {
  etiqueta: string;
  mensaje?: string;
  invalido?: boolean;
};

export function Selector({
  etiqueta,
  mensaje,
  invalido,
  id,
  className,
  children,
  "aria-describedby": describedBy,
  ...resto
}: Propiedades) {
  const { idCampo, idMensaje, descripcion } = useCampo(id, mensaje, describedBy);
  return (
    <div className="w-full">
      <EtiquetaCampo htmlFor={idCampo}>{etiqueta}</EtiquetaCampo>
      <select
        id={idCampo}
        className={unirClases("select w-full", invalido && "select-error", className)}
        aria-invalid={invalido || undefined}
        aria-describedby={descripcion}
        {...resto}
      >
        {children}
      </select>
      <MensajeCampo id={idMensaje} invalido={invalido}>
        {mensaje}
      </MensajeCampo>
    </div>
  );
}
