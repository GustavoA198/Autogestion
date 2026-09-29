"use client";

import { useState, useTransition } from "react";
import { Boton, type TamanoBoton, type VarianteBoton } from "@/componentes/boton";
import { Confirmacion } from "@/componentes/confirmacion";
import { Icono } from "@/componentes/icono";

type Propiedades = {
  titulo: string;
  mensaje: string;
  textoConfirmar: string;
  alConfirmar: () => void | Promise<void>;
  texto?: string;
  variante?: VarianteBoton;
  tamano?: TamanoBoton;
  etiquetaAccesible?: string;
};

// Botón de eliminar con confirmación destructiva y estado de carga
export function BotonEliminar({
  titulo,
  mensaje,
  textoConfirmar,
  alConfirmar,
  texto = "Eliminar",
  variante = "peligro",
  tamano = "mediano",
  etiquetaAccesible,
}: Propiedades) {
  const [abierto, setAbierto] = useState(false);
  const [pendiente, iniciar] = useTransition();

  return (
    <>
      <Boton
        type="button"
        variante={variante}
        tamano={tamano}
        onClick={() => setAbierto(true)}
        aria-label={etiquetaAccesible}
      >
        <Icono nombre="papelera" tamano={16} />
        {texto}
      </Boton>
      <Confirmacion
        abierto={abierto}
        alCancelar={() => setAbierto(false)}
        alConfirmar={() => iniciar(async () => await alConfirmar())}
        titulo={titulo}
        mensaje={mensaje}
        textoConfirmar={textoConfirmar}
        cargando={pendiente}
        destructivo
      />
    </>
  );
}
