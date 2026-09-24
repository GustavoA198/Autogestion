"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { AreaTexto } from "@/componentes/area-texto";
import { Boton } from "@/componentes/boton";
import { Entrada } from "@/componentes/entrada";
import { Selector } from "@/componentes/selector";
import { LIMITES_TAREA, type ErroresTarea } from "@/lib/tareas/validacion";
import type { EstadoFormularioTarea, ValoresTarea } from "./acciones";

type Propiedades = {
  accion: (anterior: EstadoFormularioTarea, formulario: FormData) => Promise<EstadoFormularioTarea>;
  proyectos: { id: string; nombre: string }[];
  valoresIniciales?: ValoresTarea;
  editando?: boolean;
  textoEnviar: string;
  rutaCancelar: string;
};

const VACIOS: ValoresTarea = {
  titulo: "",
  descripcion: "",
  tipoFrecuencia: "DIARIA",
  diaSemana: "",
  diaMes: "",
  fechaPuntual: "",
  proyectoId: "",
};

function FrecuenciaCampos({
  tipoFrecuencia,
  diaSemana,
  diaMes,
  fechaPuntual,
  errores,
}: {
  tipoFrecuencia: string;
  diaSemana: string;
  diaMes: string;
  fechaPuntual: string;
  errores: ErroresTarea;
}) {
  const diasSemana = [
    { valor: "0", label: "Domingo" },
    { valor: "1", label: "Lunes" },
    { valor: "2", label: "Martes" },
    { valor: "3", label: "Miércoles" },
    { valor: "4", label: "Jueves" },
    { valor: "5", label: "Viernes" },
    { valor: "6", label: "Sábado" },
  ];

  return (
    <>
      {tipoFrecuencia === "SEMANAL" && (
        <Selector
          etiqueta="Día de la semana"
          name="diaSemana"
          defaultValue={diaSemana}
          invalido={Boolean(errores.diaSemana)}
          mensaje={errores.diaSemana}
          required
        >
          <option value="">Elige el día</option>
          {diasSemana.map((d) => (
            <option key={d.valor} value={d.valor}>
              {d.label}
            </option>
          ))}
        </Selector>
      )}
      {tipoFrecuencia === "MENSUAL" && (
        <Selector
          etiqueta="Día del mes"
          name="diaMes"
          defaultValue={diaMes}
          invalido={Boolean(errores.diaMes)}
          mensaje={errores.diaMes}
          required
        >
          <option value="">Elige el día</option>
          {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
            <option key={d} value={String(d)}>
              {d}
            </option>
          ))}
        </Selector>
      )}
      {tipoFrecuencia === "PUNTUAL" && (
        <Entrada
          etiqueta="Fecha"
          name="fechaPuntual"
          type="date"
          defaultValue={fechaPuntual}
          invalido={Boolean(errores.fechaPuntual)}
          mensaje={errores.fechaPuntual}
          required
        />
      )}
    </>
  );
}

export function FormularioTarea({
  accion,
  proyectos,
  valoresIniciales = VACIOS,
  editando,
  textoEnviar,
  rutaCancelar,
}: Propiedades) {
  void editando;
  const [estado, enviar, pendiente] = useActionState(accion, {});
  const valores = estado.valores ?? valoresIniciales;
  const [frecuencia, setFrecuencia] = useState(valores.tipoFrecuencia);

  return (
    <form action={enviar} className="max-w-xl space-y-4" noValidate>
      <Entrada
        etiqueta="Título"
        name="titulo"
        required
        maxLength={LIMITES_TAREA.titulo}
        defaultValue={valores.titulo}
        invalido={Boolean(estado.errores?.titulo)}
        mensaje={estado.errores?.titulo}
      />
      <AreaTexto
        etiqueta="Descripción (opcional)"
        name="descripcion"
        rows={3}
        maxLength={LIMITES_TAREA.descripcion}
        defaultValue={valores.descripcion}
        invalido={Boolean(estado.errores?.descripcion)}
        mensaje={estado.errores?.descripcion}
      />
      <Selector
        etiqueta="Frecuencia"
        name="tipoFrecuencia"
        defaultValue={valores.tipoFrecuencia}
        invalido={Boolean(estado.errores?.tipoFrecuencia)}
        mensaje={estado.errores?.tipoFrecuencia}
        onChange={(e) => setFrecuencia(e.target.value)}
      >
        <option value="DIARIA">Diaria</option>
        <option value="SEMANAL">Semanal</option>
        <option value="MENSUAL">Mensual</option>
        <option value="PUNTUAL">Puntual</option>
      </Selector>
      <FrecuenciaCampos
        tipoFrecuencia={frecuencia}
        diaSemana={valores.diaSemana}
        diaMes={valores.diaMes}
        fechaPuntual={valores.fechaPuntual}
        errores={estado.errores ?? {}}
      />
      <Selector etiqueta="Proyecto (opcional)" name="proyectoId" defaultValue={valores.proyectoId}>
        <option value="">Sin proyecto</option>
        {proyectos.map((p) => (
          <option key={p.id} value={p.id}>
            {p.nombre}
          </option>
        ))}
      </Selector>
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
