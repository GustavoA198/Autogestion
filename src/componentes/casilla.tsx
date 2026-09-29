import type { InputHTMLAttributes } from "react";
import { unirClases, useCampo } from "@/componentes/campo";

type Propiedades = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  etiqueta: string;
};

export function Casilla({ etiqueta, id, className, ...resto }: Propiedades) {
  const { idCampo } = useCampo(id, undefined);
  return (
    <label
      htmlFor={idCampo}
      className="hover:bg-hover flex min-h-11 cursor-pointer items-center gap-3 rounded-full px-2 transition-colors duration-150 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60 has-[:disabled]:hover:bg-transparent md:min-h-9"
    >
      <input
        id={idCampo}
        type="checkbox"
        className={unirClases("checkbox", className)}
        {...resto}
      />
      <span className="text-base-content text-sm">{etiqueta}</span>
    </label>
  );
}
