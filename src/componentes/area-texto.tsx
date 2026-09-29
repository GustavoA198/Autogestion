import type { TextareaHTMLAttributes } from "react";
import { EtiquetaCampo, MensajeCampo, unirClases, useCampo } from "@/componentes/campo";

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
    <div className="w-full">
      <EtiquetaCampo htmlFor={idCampo}>{etiqueta}</EtiquetaCampo>
      <textarea
        id={idCampo}
        className={unirClases(
          "textarea min-h-24 w-full py-2.5 leading-relaxed",
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
