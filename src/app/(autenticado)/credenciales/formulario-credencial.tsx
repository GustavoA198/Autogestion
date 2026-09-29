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
import { Selector } from "@/componentes/selector";
import { SelectorAlcance } from "@/componentes/selector-alcance";
import { CATEGORIAS } from "@/lib/credenciales/categorias";
import { LIMITES_CREDENCIAL, type ErroresCredencial } from "@/lib/credenciales/validacion";
import type { EstadoFormularioCredencial, ValoresCredencial } from "./acciones";

type Propiedades = {
  accion: (
    anterior: EstadoFormularioCredencial,
    formulario: FormData,
  ) => Promise<EstadoFormularioCredencial>;
  proyectos: { id: string; nombre: string }[];
  valoresIniciales?: ValoresCredencial;
  // En edición el secreto es opcional: vacío conserva el actual
  editando?: boolean;
  textoEnviar: string;
  rutaCancelar: string;
  // Montado dentro de ModalRuta: sin marco de página, con cuerpo desplazable, pie fijo y cierre al guardar
  enModal?: boolean;
};

const VACIOS: ValoresCredencial = {
  nombre: "",
  categoria: "OTRO",
  usuario: "",
  host: "",
  nota: "",
  global: false,
  proyectoIds: [],
};

type PropiedadesCampos = {
  valores: ValoresCredencial;
  errores: ErroresCredencial;
  proyectos: { id: string; nombre: string }[];
  editando: boolean;
};

// Se remonta con una clave nueva tras cada envío fallido para restaurar lo escrito
function Campos({ valores, errores, proyectos, editando }: PropiedadesCampos) {
  return (
    <>
      <SeccionFormulario
        titulo="Identificación"
        descripcion="Un nombre que te permita reconocerla al instante."
      >
        <FilaCampos>
          <Entrada
            etiqueta="Nombre"
            name="nombre"
            required
            autoComplete="off"
            maxLength={LIMITES_CREDENCIAL.nombre}
            defaultValue={valores.nombre}
            invalido={Boolean(errores.nombre)}
            mensaje={errores.nombre}
          />
          <Selector
            etiqueta="Categoría"
            name="categoria"
            defaultValue={valores.categoria}
            invalido={Boolean(errores.categoria)}
            mensaje={errores.categoria}
          >
            {Object.entries(CATEGORIAS).map(([valor, etiqueta]) => (
              <option key={valor} value={valor}>
                {etiqueta}
              </option>
            ))}
          </Selector>
        </FilaCampos>
      </SeccionFormulario>
      <SeccionFormulario
        titulo="Acceso"
        descripcion="El secreto se guarda cifrado y nunca aparece en los listados."
      >
        <FilaCampos>
          <Entrada
            etiqueta="Usuario (opcional)"
            name="usuario"
            autoComplete="off"
            maxLength={LIMITES_CREDENCIAL.usuario}
            defaultValue={valores.usuario}
            invalido={Boolean(errores.usuario)}
            mensaje={errores.usuario}
          />
          <Entrada
            etiqueta={editando ? "Nuevo secreto (opcional)" : "Secreto"}
            name="secreto"
            type="password"
            autoComplete="new-password"
            required={!editando}
            maxLength={LIMITES_CREDENCIAL.secreto}
            invalido={Boolean(errores.secreto)}
            mensaje={
              errores.secreto ??
              (editando ? "Déjalo vacío para conservar el secreto actual." : undefined)
            }
          />
        </FilaCampos>
        <Entrada
          etiqueta="Host o URL (opcional)"
          name="host"
          autoComplete="off"
          maxLength={LIMITES_CREDENCIAL.host}
          defaultValue={valores.host}
          invalido={Boolean(errores.host)}
          mensaje={errores.host}
        />
        <AreaTexto
          etiqueta="Nota (opcional)"
          name="nota"
          rows={3}
          maxLength={LIMITES_CREDENCIAL.nota}
          defaultValue={valores.nota}
          invalido={Boolean(errores.nota)}
          mensaje={errores.nota}
        />
      </SeccionFormulario>
      <SeccionFormulario
        titulo="Alcance"
        descripcion="Una credencial puede ser global o estar asociada a uno o varios proyectos."
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

export function FormularioCredencial({
  accion,
  proyectos,
  valoresIniciales = VACIOS,
  editando = false,
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
        editando={editando}
      />
    </MarcoFormulario>
  );
}
