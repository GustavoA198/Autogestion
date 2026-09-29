"use client";

import { useActionState, useRef } from "react";
import { AreaTexto } from "@/componentes/area-texto";
import { Entrada } from "@/componentes/entrada";
import {
  FilaCampos,
  MarcoFormulario,
  ResumenErrores,
  SeccionFormulario,
  useFocoPrimerError,
} from "@/componentes/formulario";
import { SelectorAlcance } from "@/componentes/selector-alcance";
import { LIMITES_CONTACTO, type ErroresContacto } from "@/lib/contactos/validacion";
import type { EstadoFormularioContacto, ValoresContacto } from "./acciones";

type Propiedades = {
  accion: (
    anterior: EstadoFormularioContacto,
    formulario: FormData,
  ) => Promise<EstadoFormularioContacto>;
  proyectos: { id: string; nombre: string }[];
  valoresIniciales?: ValoresContacto;
  textoEnviar: string;
  rutaCancelar: string;
  // Montado dentro de ModalRuta: sin marco de página, con cuerpo desplazable, pie fijo y cierre al guardar
  enModal?: boolean;
};

const VACIOS: ValoresContacto = {
  nombre: "",
  correo: "",
  telefono: "",
  empresaOCargo: "",
  nota: "",
  global: false,
  proyectoIds: [],
};

type PropiedadesCampos = {
  valores: ValoresContacto;
  errores: ErroresContacto;
  proyectos: { id: string; nombre: string }[];
};

// Se remonta con una clave nueva tras cada envío fallido para restaurar lo escrito
function Campos({ valores, errores, proyectos }: PropiedadesCampos) {
  return (
    <>
      <SeccionFormulario
        titulo="Datos de contacto"
        descripcion="Cómo y dónde encontrar a la persona."
      >
        <FilaCampos>
          <Entrada
            etiqueta="Nombre"
            name="nombre"
            required
            autoComplete="off"
            maxLength={LIMITES_CONTACTO.nombre}
            defaultValue={valores.nombre}
            invalido={Boolean(errores.nombre)}
            mensaje={errores.nombre}
          />
          <Entrada
            etiqueta="Correo"
            name="correo"
            type="email"
            required
            autoComplete="off"
            maxLength={LIMITES_CONTACTO.correo}
            defaultValue={valores.correo}
            invalido={Boolean(errores.correo)}
            mensaje={errores.correo}
          />
          <Entrada
            etiqueta="Teléfono (opcional)"
            name="telefono"
            type="tel"
            autoComplete="off"
            maxLength={LIMITES_CONTACTO.telefono}
            defaultValue={valores.telefono}
            invalido={Boolean(errores.telefono)}
            mensaje={errores.telefono}
          />
          <Entrada
            etiqueta="Empresa o cargo (opcional)"
            name="empresaOCargo"
            maxLength={LIMITES_CONTACTO.empresa}
            defaultValue={valores.empresaOCargo}
            invalido={Boolean(errores.empresaOCargo)}
            mensaje={errores.empresaOCargo}
          />
        </FilaCampos>
        <AreaTexto
          etiqueta="Nota (opcional)"
          name="nota"
          rows={3}
          maxLength={LIMITES_CONTACTO.nota}
          defaultValue={valores.nota}
          invalido={Boolean(errores.nota)}
          mensaje={errores.nota}
        />
      </SeccionFormulario>
      <SeccionFormulario
        titulo="Alcance"
        descripcion="Un contacto puede ser global o estar asociado a uno o varios proyectos."
      >
        <SelectorAlcance
          global={valores.global}
          proyectoIds={valores.proyectoIds}
          proyectos={proyectos}
          error={errores.proyectoIds}
        />
      </SeccionFormulario>
    </>
  );
}

export function FormularioContacto({
  accion,
  proyectos,
  valoresIniciales = VACIOS,
  textoEnviar,
  rutaCancelar,
  enModal = false,
}: Propiedades) {
  const [estado, enviar, pendiente] = useActionState(accion, {});
  const formulario = useRef<HTMLFormElement>(null);
  const valores = estado.valores ?? valoresIniciales;
  useFocoPrimerError(formulario, estado.errores);

  return (
    <MarcoFormulario
      formulario={formulario}
      accion={enviar}
      enModal={enModal}
      ok={estado.ok}
      pendiente={pendiente}
      textoEnviar={textoEnviar}
      rutaCancelar={rutaCancelar}
    >
      <ResumenErrores cantidad={Object.keys(estado.errores ?? {}).length} />
      <Campos
        key={JSON.stringify(valores)}
        valores={valores}
        errores={estado.errores ?? {}}
        proyectos={proyectos}
      />
    </MarcoFormulario>
  );
}
