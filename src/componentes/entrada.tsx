import type { InputHTMLAttributes } from "react";
import { CampoClave } from "@/componentes/campo-clave";
import { EtiquetaCampo, MensajeCampo, unirClases, useCampo } from "@/componentes/campo";

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
  type,
  "aria-describedby": describedBy,
  ...resto
}: Propiedades) {
  const { idCampo, idMensaje, descripcion } = useCampo(id, mensaje, describedBy);
  const clases = unirClases("input w-full", invalido && "input-error", className);
  const comunes = {
    id: idCampo,
    className: clases,
    "aria-invalid": invalido || undefined,
    "aria-describedby": descripcion,
  };

  return (
    <div className="w-full">
      <EtiquetaCampo htmlFor={idCampo}>{etiqueta}</EtiquetaCampo>
      {type === "password" ? (
        <CampoClave etiqueta={etiqueta} {...comunes} {...resto} />
      ) : (
        <input type={type} {...comunes} {...resto} />
      )}
      <MensajeCampo id={idMensaje} invalido={invalido}>
        {mensaje}
      </MensajeCampo>
    </div>
  );
}
