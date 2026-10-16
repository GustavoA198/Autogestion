"use client";

import { useActionState, useRef, useState } from "react";
import { AreaTexto } from "@/componentes/area-texto";
import { EditorEnlaces, type FilaEnlace } from "@/componentes/editor-enlaces";
import { Entrada } from "@/componentes/entrada";
import {
  MarcoFormulario,
  ResumenErrores,
  SeccionFormulario,
  useFocoPrimerError,
} from "@/componentes/formulario";
import { LIMITES_PROYECTO } from "@/lib/proyectos/validacion";
import type { EnlaceEscrito, EstadoFormulario } from "./acciones";

type Propiedades = {
  accion: (anterior: EstadoFormulario, formulario: FormData) => Promise<EstadoFormulario>;
  valoresIniciales?: { nombre: string; descripcion: string; enlaces: EnlaceEscrito[] };
  textoEnviar: string;
  rutaCancelar: string;
  // Montado dentro de ModalRuta: sin marco de página, con cuerpo desplazable, pie fijo y cierre al guardar
  enModal?: boolean;
};

const VACIOS = { nombre: "", descripcion: "", enlaces: [] };

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
  const erroresEnlaces = estado.erroresEnlaces;
  const [enlaces, setEnlaces] = useState<FilaEnlace[]>(() =>
    valores.enlaces.map((e, i) => ({ clave: i + 1, etiqueta: e.nombre, url: e.url })),
  );
  // El editor compartido nombra el primer campo etiqueta; aquí es el nombre del enlace
  const erroresFilas = Object.fromEntries(
    Object.entries(erroresEnlaces ?? {}).map(([i, e]) => [i, { etiqueta: e.nombre, url: e.url }]),
  );
  useFocoPrimerError(formulario, Object.keys(errores).length > 0 ? errores : erroresEnlaces);

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
      <ResumenErrores cantidad={Object.keys(errores).length + Object.keys(erroresFilas).length} />
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
      </SeccionFormulario>
      <SeccionFormulario
        titulo="Documentación"
        descripcion="Opcional: enlaces a la documentación real (SharePoint, repositorio, wiki). Se guarda el enlace, nunca el documento."
      >
        <EditorEnlaces
          filas={enlaces}
          alCambiar={setEnlaces}
          errores={erroresFilas}
          textoEtiqueta="Nombre"
          textoDireccion="Enlace"
          nombreEtiqueta="enlaceNombre"
          maxEtiqueta={LIMITES_PROYECTO.enlaceNombre}
          maxUrl={LIMITES_PROYECTO.enlaceUrl}
          textoVacio="Sin enlaces. Agrega SharePoint, el repositorio o cualquier referencia útil."
        />
        {errores.enlaces ? (
          <p role="alert" className="text-error text-sm">
            {errores.enlaces}
          </p>
        ) : null}
      </SeccionFormulario>
    </MarcoFormulario>
  );
}
