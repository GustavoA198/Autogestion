"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { AreaTexto } from "@/componentes/area-texto";
import { Boton } from "@/componentes/boton";
import { Casilla } from "@/componentes/casilla";
import { Entrada } from "@/componentes/entrada";
import { Selector } from "@/componentes/selector";
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
  const [esGlobal, setEsGlobal] = useState(valores.global);

  return (
    <div className="space-y-4">
      <Entrada
        etiqueta="Nombre"
        name="nombre"
        required
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
      <fieldset className="space-y-1">
        <legend className="label-text text-base-content mb-1">Alcance</legend>
        <Casilla
          etiqueta="Global (visible desde cualquier proyecto)"
          name="global"
          defaultChecked={valores.global}
          onChange={(evento) => setEsGlobal(evento.target.checked)}
        />
        {proyectos.length === 0 ? (
          <p className="text-sm opacity-70">Aún no hay proyectos para asociar.</p>
        ) : (
          <div
            className="border-base-300 max-h-48 overflow-y-auto rounded-lg border p-2"
            role="group"
            aria-label="Proyectos asociados"
          >
            {proyectos.map((proyecto) => (
              <Casilla
                key={proyecto.id}
                etiqueta={proyecto.nombre}
                name="proyectoIds"
                value={proyecto.id}
                defaultChecked={valores.proyectoIds.includes(proyecto.id)}
                disabled={esGlobal}
              />
            ))}
          </div>
        )}
        {errores.proyectoIds ? <p className="text-error text-sm">{errores.proyectoIds}</p> : null}
      </fieldset>
    </div>
  );
}

export function FormularioCredencial({
  accion,
  proyectos,
  valoresIniciales = VACIOS,
  editando = false,
  textoEnviar,
  rutaCancelar,
}: Propiedades) {
  const [estado, enviar, pendiente] = useActionState(accion, {});
  const valores = estado.valores ?? valoresIniciales;

  return (
    <form action={enviar} className="max-w-xl space-y-4" noValidate>
      <Campos
        key={JSON.stringify(valores)}
        valores={valores}
        errores={estado.errores ?? {}}
        proyectos={proyectos}
        editando={editando}
      />
      <div className="flex gap-2 pt-2">
        <Boton type="submit" cargando={pendiente}>
          {textoEnviar}
        </Boton>
        <Link href={rutaCancelar} className="btn btn-ghost">
          Cancelar
        </Link>
      </div>
    </form>
  );
}
