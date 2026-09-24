"use client";

import { Boton } from "@/componentes/boton";
import { Modal } from "@/componentes/modal";

type Propiedades = {
  abierto: boolean;
  alCancelar: () => void;
  alConfirmar: () => void;
  titulo: string;
  mensaje: string;
  textoConfirmar?: string;
  textoCancelar?: string;
  cargando?: boolean;
  destructivo?: boolean;
};

export function Confirmacion({
  abierto,
  alCancelar,
  alConfirmar,
  titulo,
  mensaje,
  textoConfirmar = "Confirmar",
  textoCancelar = "Cancelar",
  cargando = false,
  destructivo = false,
}: Propiedades) {
  return (
    <Modal
      abierto={abierto}
      alCerrar={alCancelar}
      titulo={titulo}
      descripcion={mensaje}
      rol={destructivo ? "alertdialog" : "dialog"}
      pie={
        <>
          <Boton variante="fantasma" onClick={alCancelar} disabled={cargando} data-foco-inicial>
            {textoCancelar}
          </Boton>
          <Boton
            variante={destructivo ? "peligro" : "primario"}
            onClick={alConfirmar}
            cargando={cargando}
          >
            {textoConfirmar}
          </Boton>
        </>
      }
    />
  );
}
