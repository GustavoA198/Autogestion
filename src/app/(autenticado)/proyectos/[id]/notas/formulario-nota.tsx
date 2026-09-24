"use client";

import { useActionState } from "react";
import { AreaTexto } from "@/componentes/area-texto";
import { Boton } from "@/componentes/boton";
import { Entrada } from "@/componentes/entrada";
import Link from "next/link";

type Estado = {
  errores?: { texto?: string };
  valores?: { texto: string; fecha: string };
};

type Props = {
  accion: (anterior: Estado, data: FormData) => Promise<Estado>;
  valoresIniciales?: { texto: string; fecha: string };
  textoEnviar: string;
  rutaCancelar: string;
};

export function FormularioNota({ accion, valoresIniciales, textoEnviar, rutaCancelar }: Props) {
  const [estado, enviar, pendiente] = useActionState(accion, {});
  const valores = estado.valores ??
    valoresIniciales ?? { texto: "", fecha: new Date().toISOString().split("T")[0] };

  return (
    <form action={enviar} className="max-w-lg space-y-4" noValidate>
      <Entrada etiqueta="Fecha" name="fecha" type="date" defaultValue={valores.fecha} required />
      <AreaTexto
        etiqueta="Texto"
        name="texto"
        rows={6}
        defaultValue={valores.texto}
        mensaje={estado.errores?.texto}
        invalido={Boolean(estado.errores?.texto)}
        maxLength={5000}
        placeholder="Registra lo que hiciste, encontraste o necesitas recordar..."
        required
      />
      <div className="flex gap-2">
        <Boton type="submit" cargando={pendiente}>
          {textoEnviar}
        </Boton>
        <Link href={rutaCancelar} className="btn btn-outline">
          Cancelar
        </Link>
      </div>
    </form>
  );
}
