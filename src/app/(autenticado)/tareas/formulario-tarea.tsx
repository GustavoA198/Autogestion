"use client";

import { useActionState, useEffect, useRef, useState, type ReactNode } from "react";
import { AreaConScroll } from "@/componentes/area-con-scroll";
import { AreaTexto } from "@/componentes/area-texto";
import { Enlace } from "@/componentes/enlace";
import { Entrada } from "@/componentes/entrada";
import {
  AccionesFormulario,
  FilaCampos,
  ResumenErrores,
  SeccionFormulario,
  useFocoPrimerError,
} from "@/componentes/formulario";
import { PieModal, useModalRuta } from "@/componentes/modal-ruta";
import { Selector } from "@/componentes/selector";
import { ESTADO_LABEL, PRIORIDAD_LABEL } from "@/lib/tareas/presentacion";
import { LIMITES_TAREA, type ErroresTarea } from "@/lib/tareas/validacion";
import type { EstadoFormularioTarea, ValoresTarea } from "./acciones";
import { CampoPersona } from "./campo-persona";
import {
  EditorEnlaces,
  EditorSubtareas,
  type FilaEnlace,
  type FilaSubtarea,
} from "./listas-creacion";

type Propiedades = {
  accion: (anterior: EstadoFormularioTarea, formulario: FormData) => Promise<EstadoFormularioTarea>;
  proyectos: { id: string; nombre: string }[];
  valoresIniciales?: ValoresTarea;
  // AAAA-MM-DD ya validada: la tarea nace puntual con ese día y esa fecha límite
  fechaInicial?: string;
  editando?: boolean;
  // Al editar, las subtareas se gestionan en el detalle: aquí solo se resumen y se enlaza
  resumenSubtareas?: { hechas: number; total: number };
  rutaDetalle?: string;
  textoEnviar: string;
  rutaCancelar: string;
  // Destino permitido tras crear (lista blanca en la acción); hoy solo "calendario"
  volver?: string;
  // Montado dentro de ModalRuta: sin marco de página, con cuerpo desplazable, pie fijo y cierre al guardar
  enModal?: boolean;
  // Solo en modal: bloque final con acciones destructivas (eliminar)
  zonaPeligro?: ReactNode;
};

const VACIOS: ValoresTarea = {
  titulo: "",
  descripcion: "",
  tipoFrecuencia: "DIARIA",
  diaSemana: "",
  diaMes: "",
  fechaPuntual: "",
  proyectoId: "",
  estado: "NUEVA",
  prioridad: "MEDIA",
  fechaInicio: "",
  fechaLimite: "",
  responsable: "",
  asignadoPor: "",
};

const DIAS_SEMANA = [
  { valor: "0", label: "Domingo" },
  { valor: "1", label: "Lunes" },
  { valor: "2", label: "Martes" },
  { valor: "3", label: "Miércoles" },
  { valor: "4", label: "Jueves" },
  { valor: "5", label: "Viernes" },
  { valor: "6", label: "Sábado" },
];

function DiaDeRepeticion({
  tipoFrecuencia,
  diaSemana,
  diaMes,
  errores,
}: {
  tipoFrecuencia: string;
  diaSemana: string;
  diaMes: string;
  errores: ErroresTarea;
}) {
  if (tipoFrecuencia === "SEMANAL") {
    return (
      <Selector
        key={`dia-semana-${diaSemana}`}
        etiqueta="Día de la semana"
        name="diaSemana"
        defaultValue={diaSemana}
        invalido={Boolean(errores.diaSemana)}
        mensaje={errores.diaSemana}
        required
      >
        <option value="">Elige el día</option>
        {DIAS_SEMANA.map((d) => (
          <option key={d.valor} value={d.valor}>
            {d.label}
          </option>
        ))}
      </Selector>
    );
  }
  if (tipoFrecuencia === "MENSUAL") {
    return (
      <Selector
        key={`dia-mes-${diaMes}`}
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
    );
  }
  return null;
}

export function FormularioTarea({
  accion,
  proyectos,
  valoresIniciales,
  fechaInicial,
  editando = false,
  resumenSubtareas,
  rutaDetalle,
  textoEnviar,
  rutaCancelar,
  volver,
  enModal = false,
  zonaPeligro,
}: Propiedades) {
  const modal = useModalRuta();
  const [estado, enviar, pendiente] = useActionState(accion, {});
  const inicio: ValoresTarea =
    valoresIniciales ??
    (fechaInicial
      ? {
          ...VACIOS,
          tipoFrecuencia: "PUNTUAL",
          fechaPuntual: fechaInicial,
          fechaLimite: fechaInicial,
        }
      : VACIOS);
  const valores = estado.valores ?? inicio;
  const errores = estado.errores ?? {};
  const erroresListas = estado.erroresListas;
  const [frecuencia, setFrecuencia] = useState(valores.tipoFrecuencia);
  const [responsable, setResponsable] = useState(valores.responsable);
  const [asignadoPor, setAsignadoPor] = useState(valores.asignadoPor);
  const [enlaces, setEnlaces] = useState<FilaEnlace[]>(() =>
    (valores.enlaces ?? []).map((e, i) => ({ clave: i + 1, ...e })),
  );
  const [subtareas, setSubtareas] = useState<FilaSubtarea[]>(() =>
    (valores.subtareas ?? []).map((s, i) => ({
      clave: i + 1,
      texto: s.texto,
      descripcion: s.descripcion ?? "",
    })),
  );

  const formulario = useRef<HTMLFormElement>(null);
  useFocoPrimerError(formulario, estado.errores ?? estado.erroresListas);

  // Guardado correcto en modal: se cierra y la vista de fondo se vuelve a pedir al servidor
  useEffect(() => {
    if (estado.ok) modal?.cerrar({ actualizar: true });
  }, [estado.ok, modal]);

  const cantidadErrores =
    Object.keys(errores).length +
    Object.keys(erroresListas?.enlaces ?? {}).length +
    Object.keys(erroresListas?.subtareas ?? {}).length;

  const campos = (
    <>
      <ResumenErrores cantidad={cantidadErrores} />
      {volver ? <input type="hidden" name="volver" value={volver} /> : null}
      {enModal ? <input type="hidden" name="modal" value="1" /> : null}
      <SeccionFormulario
        titulo="La tarea"
        descripcion="Qué hay que hacer y, si hace falta, el detalle."
      >
        <Entrada
          etiqueta="Título"
          name="titulo"
          required
          autoComplete="off"
          maxLength={LIMITES_TAREA.titulo}
          defaultValue={valores.titulo}
          invalido={Boolean(errores.titulo)}
          mensaje={errores.titulo}
        />
        <AreaTexto
          etiqueta="Descripción (opcional)"
          name="descripcion"
          rows={3}
          maxLength={LIMITES_TAREA.descripcion}
          defaultValue={valores.descripcion}
          invalido={Boolean(errores.descripcion)}
          mensaje={errores.descripcion}
        />
      </SeccionFormulario>

      <SeccionFormulario
        titulo="Estado y prioridad"
        descripcion="En qué punto está la tarea y qué tan importante es. Al completarla, sus subtareas quedan hechas."
      >
        <FilaCampos>
          <Selector
            key={`estado-${valores.estado}`}
            etiqueta="Estado"
            name="estado"
            defaultValue={valores.estado || "NUEVA"}
            invalido={Boolean(errores.estado)}
            mensaje={errores.estado}
          >
            {Object.entries(ESTADO_LABEL).map(([valor, texto]) => (
              <option key={valor} value={valor}>
                {texto}
              </option>
            ))}
          </Selector>
          <Selector
            key={`prioridad-${valores.prioridad}`}
            etiqueta="Prioridad"
            name="prioridad"
            defaultValue={valores.prioridad || "MEDIA"}
            invalido={Boolean(errores.prioridad)}
            mensaje={errores.prioridad}
          >
            {Object.entries(PRIORIDAD_LABEL).map(([valor, texto]) => (
              <option key={valor} value={valor}>
                {texto}
              </option>
            ))}
          </Selector>
        </FilaCampos>
      </SeccionFormulario>

      <SeccionFormulario
        titulo="Cuándo se repite"
        descripcion="Elige la frecuencia y el día que corresponde."
      >
        <FilaCampos>
          <Selector
            key={`frecuencia-${valores.tipoFrecuencia}`}
            etiqueta="Frecuencia"
            name="tipoFrecuencia"
            defaultValue={valores.tipoFrecuencia}
            invalido={Boolean(errores.tipoFrecuencia)}
            mensaje={errores.tipoFrecuencia}
            onChange={(e) => setFrecuencia(e.target.value)}
          >
            <option value="DIARIA">Diaria</option>
            <option value="SEMANAL">Semanal</option>
            <option value="MENSUAL">Mensual</option>
            <option value="PUNTUAL">Puntual</option>
          </Selector>
          <DiaDeRepeticion
            tipoFrecuencia={frecuencia}
            diaSemana={valores.diaSemana}
            diaMes={valores.diaMes}
            errores={errores}
          />
        </FilaCampos>
      </SeccionFormulario>

      <SeccionFormulario
        titulo="Fechas"
        descripcion="El semáforo de vencimiento usa la fecha límite o, si no hay, el día de la tarea puntual."
      >
        <div
          className={`grid gap-5 sm:grid-cols-2 ${frecuencia === "PUNTUAL" ? "lg:grid-cols-3" : ""}`}
        >
          {frecuencia === "PUNTUAL" ? (
            <Entrada
              etiqueta="Para el día (opcional)"
              name="fechaPuntual"
              type="date"
              defaultValue={valores.fechaPuntual}
              invalido={Boolean(errores.fechaPuntual)}
              mensaje={
                errores.fechaPuntual ??
                "Si no pones fecha, queda en Pendientes y no aparece en el calendario."
              }
            />
          ) : null}
          <Entrada
            etiqueta="Fecha de inicio (opcional)"
            name="fechaInicio"
            type="date"
            defaultValue={valores.fechaInicio}
            invalido={Boolean(errores.fechaInicio)}
            mensaje={errores.fechaInicio}
          />
          <Entrada
            etiqueta="Fecha límite (opcional)"
            name="fechaLimite"
            type="date"
            defaultValue={valores.fechaLimite}
            invalido={Boolean(errores.fechaLimite)}
            mensaje={errores.fechaLimite}
          />
        </div>
      </SeccionFormulario>

      <SeccionFormulario
        titulo="Personas"
        descripcion="Quién la hace y quién la pidió. Texto libre; «Yo» es un atajo."
      >
        <FilaCampos>
          <CampoPersona
            etiqueta="Responsable"
            name="responsable"
            value={responsable}
            onChange={setResponsable}
            maxLength={LIMITES_TAREA.responsable}
            invalido={Boolean(errores.responsable)}
            mensaje={errores.responsable}
          />
          <CampoPersona
            etiqueta="Asignada por"
            name="asignadoPor"
            value={asignadoPor}
            onChange={setAsignadoPor}
            maxLength={LIMITES_TAREA.asignadoPor}
            invalido={Boolean(errores.asignadoPor)}
            mensaje={errores.asignadoPor}
          />
        </FilaCampos>
      </SeccionFormulario>

      <SeccionFormulario
        titulo="Proyecto"
        descripcion="Opcional: asocia la tarea a un frente de trabajo."
      >
        <Selector
          key={`proyecto-${valores.proyectoId}`}
          etiqueta="Proyecto (opcional)"
          name="proyectoId"
          defaultValue={valores.proyectoId}
        >
          <option value="">Sin proyecto</option>
          {proyectos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
            </option>
          ))}
        </Selector>
      </SeccionFormulario>

      {editando ? (
        <SeccionFormulario
          titulo="Subtareas"
          descripcion="El avance de la tarea se calcula con las subtareas hechas."
        >
          <p className="text-suave text-sm">
            {resumenSubtareas && resumenSubtareas.total > 0
              ? `${resumenSubtareas.hechas} de ${resumenSubtareas.total} ${resumenSubtareas.total === 1 ? "subtarea hecha" : "subtareas hechas"}. `
              : "Esta tarea no tiene subtareas. "}
            {rutaDetalle ? (
              <Enlace href={rutaDetalle}>Gestiona las subtareas en el detalle</Enlace>
            ) : null}
          </p>
        </SeccionFormulario>
      ) : (
        <>
          <SeccionFormulario
            titulo="Enlaces"
            descripcion="Opcional: referencias para trabajar la tarea. Luego puedes gestionarlos en el detalle."
          >
            <EditorEnlaces
              filas={enlaces}
              alCambiar={setEnlaces}
              errores={erroresListas?.enlaces}
            />
          </SeccionFormulario>
          <SeccionFormulario
            titulo="Subtareas (opcional)"
            descripcion="Pasos para completar la tarea: su avance se calcula con las que vayas marcando. Luego puedes gestionarlas en el detalle."
          >
            <EditorSubtareas
              filas={subtareas}
              alCambiar={setSubtareas}
              errores={erroresListas?.subtareas}
            />
          </SeccionFormulario>
        </>
      )}
      {enModal && zonaPeligro ? (
        <SeccionFormulario
          titulo="Eliminar tarea"
          descripcion="Se borra la tarea con sus subtareas, enlaces y comentarios."
        >
          {zonaPeligro}
        </SeccionFormulario>
      ) : null}
    </>
  );

  if (enModal) {
    return (
      <form ref={formulario} action={enviar} className="flex min-h-0 flex-1 flex-col" noValidate>
        <AreaConScroll
          etiqueta="Campos del formulario"
          className="flex-1"
          claseCuerpo="px-5 pb-5 sm:px-7 sm:pb-6"
        >
          {campos}
        </AreaConScroll>
        <PieModal>
          <AccionesFormulario
            textoEnviar={textoEnviar}
            pendiente={pendiente || estado.ok === true}
            rutaCancelar={rutaCancelar}
          />
        </PieModal>
      </form>
    );
  }

  return (
    <form ref={formulario} action={enviar} className="max-w-2xl space-y-5" noValidate>
      {campos}
      <AccionesFormulario
        textoEnviar={textoEnviar}
        pendiente={pendiente}
        rutaCancelar={rutaCancelar}
      />
    </form>
  );
}
