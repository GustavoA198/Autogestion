import type { InputHTMLAttributes } from "react";
import { unirClases, useCampo } from "@/componentes/campo";

type Propiedades = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  etiqueta: string;
};

export function Casilla({ etiqueta, id, className, ...resto }: Propiedades) {
  const { idCampo } = useCampo(id, undefined);
  return (
    <label htmlFor={idCampo} className="label cursor-pointer justify-start gap-3">
      <input
        id={idCampo}
        type="checkbox"
        className={unirClases("checkbox", className)}
        {...resto}
      />
      <span className="label-text text-base-content">{etiqueta}</span>
    </label>
  );
}
