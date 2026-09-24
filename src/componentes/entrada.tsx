import type { InputHTMLAttributes } from "react";
import { MensajeCampo, unirClases, useCampo } from "@/componentes/campo";

type Propiedades = InputHTMLAttributes<HTMLInputElement> & {
  etiqueta: string;
  mensaje?: string;
  invalido?: boolean;
};

export function Entrada({
  etiqueta,
  mensaje,
  invalido,
  id,
  className,
  "aria-describedby": describedBy,
  ...resto
}: Propiedades) {
  const { idCampo, idMensaje, descripcion } = useCampo(id, mensaje, describedBy);
  return (
    <div className="form-control w-full">
      <label htmlFor={idCampo} className="label">
        <span className="label-text text-base-content">{etiqueta}</span>
      </label>
      <input
        id={idCampo}
        className={unirClases("input input-bordered w-full", invalido && "input-error", className)}
        aria-invalid={invalido || undefined}
        aria-describedby={descripcion}
        {...resto}
      />
      <MensajeCampo id={idMensaje} invalido={invalido}>
        {mensaje}
      </MensajeCampo>
    </div>
  );
}
