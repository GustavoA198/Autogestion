import type { TextareaHTMLAttributes } from "react";
import { MensajeCampo, unirClases, useCampo } from "@/componentes/campo";

type Propiedades = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  etiqueta: string;
  mensaje?: string;
  invalido?: boolean;
};

export function AreaTexto({
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
      <textarea
        id={idCampo}
        className={unirClases(
          "textarea textarea-bordered w-full",
          invalido && "textarea-error",
          className,
        )}
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
