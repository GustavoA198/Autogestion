"use client";

import { useActionState, useRef, useState, type ReactNode } from "react";
import { AreaTexto } from "@/componentes/area-texto";
import { Boton } from "@/componentes/boton";
import { Entrada } from "@/componentes/entrada";
import {
  FilaCampos,
  MarcoFormulario,
  ResumenErrores,
  SeccionFormulario,
  useFocoPrimerError,
} from "@/componentes/formulario";
import { LIMITES_NOTA, type ErroresNota } from "@/lib/notas/validacion";

type Valores = { texto: string; fecha: string; proximoPaso: string; minutos: string };

type Estado = {
  errores?: ErroresNota;
  valores?: Valores;
  ok?: boolean;
};

type Props = {
  accion: (anterior: Estado, data: FormData) => Promise<Estado>;
  valoresIniciales: Valores;
  textoEnviar: string;
  rutaCancelar: string;
  // Solo al crear: la edición recibe el proyecto por bind en la acción
  proyectoId?: string;
  // Montado dentro de ModalRuta: sin marco de página, con cuerpo desplazable, pie fijo y cierre al guardar
  enModal?: boolean;
  // Aviso previo al formulario (por ejemplo el próximo paso de la entrada anterior)
  contexto?: ReactNode;
};

// Atajos de tiempo invertido: rellenan el campo de minutos
const ATAJOS_TIEMPO = [
  { etiqueta: "30 min", minutos: "30" },
  { etiqueta: "1 h", minutos: "60" },
  { etiqueta: "2 h", minutos: "120" },
];

export function FormularioNota({
  accion,
  valoresIniciales,
  textoEnviar,
  rutaCancelar,
  proyectoId,
  enModal = false,
  contexto,
}: Props) {
  const [estado, enviar, pendiente] = useActionState(accion, {});
  const formulario = useRef<HTMLFormElement>(null);
  const valores = estado.valores ?? valoresIniciales;
  const [minutos, setMinutos] = useState(valores.minutos);
  const errores = estado.errores;
  useFocoPrimerError(formulario, errores);

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
      {contexto ? <div className={enModal ? "pb-5" : ""}>{contexto}</div> : null}
      <ResumenErrores cantidad={Object.keys(errores ?? {}).length} />
      {proyectoId ? <input type="hidden" name="proyectoId" value={proyectoId} /> : null}
      {errores?.proyectoId ? (
        <p role="alert" className="text-error text-sm">
          {errores.proyectoId}
        </p>
      ) : null}
      <SeccionFormulario
        titulo="Entrada de bitácora"
        descripcion="Registra lo que hiciste y deja claro cómo retomarlo."
      >
        <div className="sm:max-w-56">
          <Entrada
            etiqueta="Fecha"
            name="fecha"
            type="date"
            defaultValue={valores.fecha}
            mensaje={errores?.fecha}
            invalido={Boolean(errores?.fecha)}
            required
          />
        </div>
        <AreaTexto
          etiqueta="Qué hice, encontré o decidí"
          name="texto"
          rows={7}
          defaultValue={valores.texto}
          mensaje={errores?.texto ?? `Hasta ${LIMITES_NOTA.texto} caracteres.`}
          invalido={Boolean(errores?.texto)}
          maxLength={LIMITES_NOTA.texto}
          required
        />
        <AreaTexto
          etiqueta="Próximo paso"
          name="proximoPaso"
          rows={3}
          defaultValue={valores.proximoPaso}
          mensaje={errores?.proximoPaso ?? "Qué sigue para retomarlo en 10 segundos."}
          invalido={Boolean(errores?.proximoPaso)}
          maxLength={LIMITES_NOTA.proximoPaso}
          required
        />
      </SeccionFormulario>
      <SeccionFormulario
        titulo="Tiempo invertido"
        descripcion="Opcional. Sirve para el reporte semanal y las estadísticas."
      >
        <FilaCampos>
          <Entrada
            etiqueta="Tiempo invertido (minutos)"
            name="minutos"
            type="text"
            inputMode="numeric"
            value={minutos}
            onChange={(evento) => setMinutos(evento.target.value)}
            mensaje={errores?.minutos ?? "Entre 1 y 1440 minutos, por ejemplo 90."}
            invalido={Boolean(errores?.minutos)}
          />
          <div>
            <p className="text-base-content mb-1.5 text-sm font-medium" id="atajos-tiempo">
              Atajos
            </p>
            <div role="group" aria-labelledby="atajos-tiempo" className="flex flex-wrap gap-2">
              {ATAJOS_TIEMPO.map((atajo) => (
                <Boton
                  key={atajo.minutos}
                  variante={minutos === atajo.minutos ? "primario" : "secundario"}
                  aria-pressed={minutos === atajo.minutos}
                  onClick={() => setMinutos(atajo.minutos)}
                >
                  {atajo.etiqueta}
                </Boton>
              ))}
            </div>
          </div>
        </FilaCampos>
      </SeccionFormulario>
    </MarcoFormulario>
  );
}
