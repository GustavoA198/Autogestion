"use client";

import { useActionState, useRef } from "react";
import { AreaTexto } from "@/componentes/area-texto";
import { Entrada } from "@/componentes/entrada";
import { MarcoFormulario, useFocoPrimerError } from "@/componentes/formulario";
import { Selector } from "@/componentes/selector";
import { formatoDatetimeLocal } from "@/lib/calendario/fechas";
import { accionCrearReunion, type EstadoReunion } from "./acciones";

type Propiedades = {
  zona: string;
  // Se llama cuando la reunión se creó para cerrar el formulario y refrescar el calendario
  alCrear: () => void;
};

// El campo datetime-local no lleva zona: se convierte a instante UTC con la del navegador antes de enviar
function aInstanteIso(valor: FormDataEntryValue | null): string | null {
  if (typeof valor !== "string" || valor === "") return null;
  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime()) ? null : fecha.toISOString();
}

// Convierte el valor devuelto por el servidor (ISO) al formato del campo datetime-local
function aValorDeCampo(iso: string | undefined, zona: string): string {
  if (!iso) return "";
  const fecha = new Date(iso);
  return Number.isNaN(fecha.getTime()) ? "" : formatoDatetimeLocal(fecha, zona);
}

// El servidor devuelve un solo mensaje; se asigna al campo que corresponde para mostrarlo a su lado
function errorPorCampo(mensaje: string | undefined) {
  if (!mensaje) return {};
  const texto = mensaje.toLowerCase();
  if (texto.includes("título")) return { titulo: mensaje };
  if (texto.includes("inicio") && !texto.includes("posterior")) return { inicio: mensaje };
  if (texto.includes("fin")) return { fin: mensaje };
  if (texto.includes("fechas")) return { inicio: mensaje };
  return { general: mensaje };
}

// Se monta dentro de ModalFormulario: Cancelar y el cierre pasan por su confirmación de cambios
export function FormularioReunion({ zona, alCrear }: Propiedades) {
  const [estado, enviar, pendiente] = useActionState(
    async (anterior: EstadoReunion, formulario: FormData): Promise<EstadoReunion> => {
      for (const campo of ["inicio", "fin"]) {
        const iso = aInstanteIso(formulario.get(campo));
        if (iso) formulario.set(campo, iso);
      }
      const resultado = await accionCrearReunion(anterior, formulario);
      if (resultado.creada) alCrear();
      return resultado;
    },
    {} as EstadoReunion,
  );

  const formulario = useRef<HTMLFormElement>(null);
  const errores = errorPorCampo(estado.errores?.mensaje);
  const erroresCampo = { ...errores, general: undefined };
  useFocoPrimerError(formulario, estado.errores ? erroresCampo : undefined);

  return (
    <MarcoFormulario
      formulario={formulario}
      accion={enviar}
      enModal
      pendiente={pendiente}
      textoEnviar="Crear reunión"
      rutaCancelar="/calendario"
    >
      <div className="space-y-4">
        <Entrada
          etiqueta="Título"
          name="titulo"
          required
          autoComplete="off"
          defaultValue={estado.valores?.titulo ?? ""}
          invalido={Boolean(errores.titulo)}
          mensaje={errores.titulo}
        />
        <AreaTexto
          etiqueta="Descripción (opcional)"
          name="descripcion"
          rows={3}
          defaultValue={estado.valores?.descripcion ?? ""}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Entrada
            etiqueta="Inicio"
            name="inicio"
            type="datetime-local"
            required
            defaultValue={aValorDeCampo(estado.valores?.inicio, zona)}
            invalido={Boolean(errores.inicio)}
            mensaje={errores.inicio}
          />
          <Entrada
            etiqueta="Fin"
            name="fin"
            type="datetime-local"
            required
            defaultValue={aValorDeCampo(estado.valores?.fin, zona)}
            invalido={Boolean(errores.fin)}
            mensaje={errores.fin}
          />
        </div>
        <Selector etiqueta="Calendario" name="proveedor" defaultValue="GOOGLE">
          <option value="GOOGLE">Google Calendar</option>
          <option value="MICROSOFT">Microsoft Calendar</option>
        </Selector>
        {errores.general ? (
          <div
            role="alert"
            className="border-error/30 bg-error/7 text-error rounded-2xl border px-4 py-3 text-sm"
          >
            {errores.general}
          </div>
        ) : null}
      </div>
    </MarcoFormulario>
  );
}
