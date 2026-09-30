"use client";

import { useActionState, useRef } from "react";
import { Alerta } from "@/componentes/alerta";
import { Entrada } from "@/componentes/entrada";
import {
  MarcoFormulario,
  ResumenErrores,
  SeccionFormulario,
  useFocoPrimerError,
} from "@/componentes/formulario";
import { LARGO_MINIMO_CLAVE, type ErroresClave } from "@/lib/usuarios/validacion";
import type { EstadoFormularioClave } from "./acciones";

type Propiedades = {
  accion: (
    anterior: EstadoFormularioClave,
    formulario: FormData,
  ) => Promise<EstadoFormularioClave>;
};

export function FormularioClave({ accion }: Propiedades) {
  const [estado, enviar, pendiente] = useActionState(accion, {});
  const formulario = useRef<HTMLFormElement>(null);
  const errores: ErroresClave = estado.errores ?? {};
  useFocoPrimerError(formulario, estado.errores);

  // Tras un error los campos quedan vacios a propósito: una contraseña no vuelve a la pantalla
  return (
    <MarcoFormulario
      formulario={formulario}
      accion={enviar}
      enModal={false}
      pendiente={pendiente}
      textoEnviar="Cambiar contraseña"
      rutaCancelar="/"
    >
      <ResumenErrores cantidad={Object.keys(errores).length} />
      {estado.mensaje ? <Alerta tono="exito">{estado.mensaje}</Alerta> : null}
      <SeccionFormulario
        titulo="Nueva contraseña"
        descripcion={`Debe tener al menos ${LARGO_MINIMO_CLAVE} caracteres y ser distinta de la actual.`}
      >
        <Entrada
          etiqueta="Contraseña actual"
          name="actual"
          type="password"
          autoComplete="current-password"
          required
          maxLength={200}
          invalido={Boolean(errores.actual)}
          mensaje={errores.actual}
        />
        <Entrada
          etiqueta="Contraseña nueva"
          name="nueva"
          type="password"
          autoComplete="new-password"
          required
          minLength={LARGO_MINIMO_CLAVE}
          maxLength={200}
          invalido={Boolean(errores.nueva)}
          mensaje={errores.nueva}
        />
        <Entrada
          etiqueta="Repite la contraseña nueva"
          name="confirmacion"
          type="password"
          autoComplete="new-password"
          required
          maxLength={200}
          invalido={Boolean(errores.confirmacion)}
          mensaje={errores.confirmacion}
        />
      </SeccionFormulario>
    </MarcoFormulario>
  );
}
