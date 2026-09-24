"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { AreaTexto } from "@/componentes/area-texto";
import { Boton } from "@/componentes/boton";
import { Casilla } from "@/componentes/casilla";
import { Entrada } from "@/componentes/entrada";
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

function Campos({ valores, errores, proyectos }: PropiedadesCampos) {
  const [esGlobal, setEsGlobal] = useState(valores.global);

  return (
    <div className="space-y-4">
      <Entrada
        etiqueta="Nombre"
        name="nombre"
        required
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
        maxLength={LIMITES_CONTACTO.correo}
        defaultValue={valores.correo}
        invalido={Boolean(errores.correo)}
        mensaje={errores.correo}
      />
      <Entrada
        etiqueta="Telefono (opcional)"
        name="telefono"
        type="tel"
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
      <AreaTexto
        etiqueta="Nota (opcional)"
        name="nota"
        rows={3}
        maxLength={LIMITES_CONTACTO.nota}
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
          <p className="text-sm opacity-70">Aun no hay proyectos para asociar.</p>
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

export function FormularioContacto({
  accion,
  proyectos,
  valoresIniciales = VACIOS,
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
