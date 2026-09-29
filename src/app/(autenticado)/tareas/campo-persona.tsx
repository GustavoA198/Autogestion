"use client";

import { EtiquetaCampo, MensajeCampo, unirClases, useCampo } from "@/componentes/campo";

type Propiedades = {
  etiqueta: string;
  name: string;
  value: string;
  onChange: (valor: string) => void;
  maxLength: number;
  invalido?: boolean;
  mensaje?: string;
};

// Texto libre para una persona con un atajo "Yo" que rellena el campo
export function CampoPersona({
  etiqueta,
  name,
  value,
  onChange,
  maxLength,
  invalido,
  mensaje,
}: Propiedades) {
  const { idCampo, idMensaje, descripcion } = useCampo(undefined, mensaje);
  return (
    <div className="w-full">
      <EtiquetaCampo htmlFor={idCampo}>{etiqueta}</EtiquetaCampo>
      <div className="join w-full">
        <input
          id={idCampo}
          name={name}
          type="text"
          autoComplete="off"
          maxLength={maxLength}
          value={value}
          onChange={(evento) => onChange(evento.target.value)}
          className={unirClases("input join-item w-full", invalido && "input-error")}
          aria-invalid={invalido || undefined}
          aria-describedby={descripcion}
        />
        <button
          type="button"
          className="btn btn-outline join-item"
          onClick={() => onChange("Yo")}
          aria-label={`Usar «Yo» en ${etiqueta.toLowerCase()}`}
        >
          Yo
        </button>
      </div>
      <MensajeCampo id={idMensaje} invalido={invalido}>
        {mensaje}
      </MensajeCampo>
    </div>
  );
}
