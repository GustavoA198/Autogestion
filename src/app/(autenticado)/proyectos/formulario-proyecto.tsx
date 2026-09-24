"use client";

import Link from "next/link";
import { useActionState } from "react";
import { AreaTexto } from "@/componentes/area-texto";
import { Boton } from "@/componentes/boton";
import { Entrada } from "@/componentes/entrada";
import { LIMITES_PROYECTO } from "@/lib/proyectos/validacion";
import type { EstadoFormulario } from "./acciones";

type Propiedades = {
  accion: (anterior: EstadoFormulario, formulario: FormData) => Promise<EstadoFormulario>;
  valoresIniciales?: { nombre: string; descripcion: string; enlaceDocumentacion: string };
  textoEnviar: string;
  rutaCancelar: string;
};

const VACIOS = { nombre: "", descripcion: "", enlaceDocumentacion: "" };

export function FormularioProyecto({
  accion,
  valoresIniciales = VACIOS,
  textoEnviar,
  rutaCancelar,
}: Propiedades) {
  const [estado, enviar, pendiente] = useActionState(accion, {});
  const valores = estado.valores ?? valoresIniciales;
  const errores = estado.errores ?? {};

  return (
    <form action={enviar} className="max-w-xl space-y-4" noValidate>
      {/* La clave reinicia el valor por defecto tras un envío fallido */}
      <Entrada
        key={`nombre-${valores.nombre}`}
        etiqueta="Nombre"
        name="nombre"
        required
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
        mensaje={errores.descripcion}
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
        mensaje={errores.enlaceDocumentacion}
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
