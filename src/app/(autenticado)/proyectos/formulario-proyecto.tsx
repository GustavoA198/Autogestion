"use client";

import { useActionState, useRef } from "react";
import { AreaTexto } from "@/componentes/area-texto";
import { Entrada } from "@/componentes/entrada";
import {
  MarcoFormulario,
  ResumenErrores,
  SeccionFormulario,
  useFocoPrimerError,
} from "@/componentes/formulario";
import { LIMITES_PROYECTO } from "@/lib/proyectos/validacion";
import type { EstadoFormulario } from "./acciones";

type Propiedades = {
  accion: (anterior: EstadoFormulario, formulario: FormData) => Promise<EstadoFormulario>;
  valoresIniciales?: { nombre: string; descripcion: string; enlaceDocumentacion: string };
  textoEnviar: string;
  rutaCancelar: string;
  // Montado dentro de ModalRuta: sin marco de página, con cuerpo desplazable, pie fijo y cierre al guardar
  enModal?: boolean;
};

const VACIOS = { nombre: "", descripcion: "", enlaceDocumentacion: "" };

export function FormularioProyecto({
  accion,
  valoresIniciales = VACIOS,
  textoEnviar,
  rutaCancelar,
  enModal = false,
}: Propiedades) {
  const [estado, enviar, pendiente] = useActionState(accion, {});
  const formulario = useRef<HTMLFormElement>(null);
  const valores = estado.valores ?? valoresIniciales;
  const errores = estado.errores ?? {};
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
      <ResumenErrores cantidad={Object.keys(errores).length} />
      <SeccionFormulario
        titulo="Datos del proyecto"
        descripcion="Solo el nombre es obligatorio; la documentación real vive en tu repositorio o SharePoint."
      >
        {/* La clave reinicia el valor por defecto tras un envío fallido */}
        <Entrada
          key={`nombre-${valores.nombre}`}
          etiqueta="Nombre"
          name="nombre"
          required
          autoComplete="off"
          maxLength={LIMITES_PROYECTO.nombre}
          defaultValue={valores.nombre}
          invalido={Boolean(errores.nombre)}
          mensaje={errores.nombre}
        />
        <AreaTexto
          key={`descripcion-${valores.descripcion}`}
          etiqueta="Descripción breve (opcional)"
          name="descripcion"
          rows={3}
          maxLength={LIMITES_PROYECTO.descripcion}
          defaultValue={valores.descripcion}
          invalido={Boolean(errores.descripcion)}
          mensaje={
            errores.descripcion ?? "Una o dos frases que te ubiquen en el frente de trabajo."
          }
        />
        <Entrada
          key={`enlace-${valores.enlaceDocumentacion}`}
          etiqueta="Enlace a la documentación (opcional)"
          name="enlaceDocumentacion"
          type="url"
          inputMode="url"
          placeholder="https://"
          maxLength={LIMITES_PROYECTO.enlace}
          defaultValue={valores.enlaceDocumentacion}
          invalido={Boolean(errores.enlaceDocumentacion)}
          mensaje={errores.enlaceDocumentacion ?? "Debe empezar por http:// o https://."}
        />
      </SeccionFormulario>
    </MarcoFormulario>
  );
}
