"use client";

import { useState, type InputHTMLAttributes } from "react";
import { unirClases } from "@/componentes/campo";
import { Icono } from "@/componentes/icono";

type Propiedades = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  etiqueta: string;
};

// Campo de contraseña o secreto con botón para mostrar y ocultar el valor
export function CampoClave({ etiqueta, className, ...resto }: Propiedades) {
  const [visible, setVisible] = useState(false);
  const nombre = etiqueta
    .replace(/\s*\(.*?\)\s*/g, " ")
    .trim()
    .toLowerCase();

  return (
    <div className="relative">
      <input
        {...resto}
        type={visible ? "text" : "password"}
        className={unirClases(className, "pr-12", visible && "font-mono")}
      />
      <button
        type="button"
        onClick={() => setVisible((estado) => !estado)}
        aria-label={`${visible ? "Ocultar" : "Mostrar"} ${nombre}`}
        aria-pressed={visible}
        aria-controls={resto.id}
        className="text-suave hover:text-base-content absolute inset-y-0 right-0 grid min-h-11 w-11 cursor-pointer place-items-center rounded-r-xl transition-colors duration-150"
      >
        <Icono nombre={visible ? "ojo-cerrado" : "ojo"} tamano={18} />
      </button>
    </div>
  );
}
