import { EstadoTarea, FrecuenciaTarea, PrioridadTarea } from "@/generated/prisma/enums";

export const VALORES_FRECUENCIA = Object.values(FrecuenciaTarea) as [string, ...string[]];
export const VALORES_ESTADO = Object.values(EstadoTarea) as [string, ...string[]];
export const VALORES_PRIORIDAD = Object.values(PrioridadTarea) as [string, ...string[]];

export const LIMITES_TAREA = {
  titulo: 200,
  descripcion: 2000,
  responsable: 120,
  asignadoPor: 120,
  enlaceEtiqueta: 100,
  enlaceUrl: 2000,
  subtareaTexto: 300,
  subtareaDescripcion: 500,
  comentario: 2000,
} as const;

export type CamposTarea =
  | "titulo"
  | "descripcion"
  | "tipoFrecuencia"
  | "diaSemana"
  | "diaMes"
  | "fechaPuntual"
  | "proyectoId"
  | "estado"
  | "prioridad"
  | "fechaInicio"
  | "fechaLimite"
  | "responsable"
  | "asignadoPor";
export type ErroresTarea = Partial<Record<CamposTarea, string>>;

export type DatosTarea = {
  titulo: string;
  descripcion: string | null;
  tipoFrecuencia: (typeof FrecuenciaTarea)[keyof typeof FrecuenciaTarea];
  diaSemana: number | null;
  diaMes: number | null;
  fechaPuntual: Date | null;
  proyectoId: string | null;
  // Los campos opcionales quedan sin definir si la entrada no los trae: al actualizar no se tocan
  estado?: EstadoTarea;
  prioridad?: PrioridadTarea;
  fechaInicio?: Date | null;
  fechaLimite?: Date | null;
  responsable?: string | null;
  asignadoPor?: string | null;
  // Solo COMPLETADA y CANCELADA dejan la tarea inactiva
  activa?: boolean;
};

type CampoOpcional =
  "estado" | "prioridad" | "fechaInicio" | "fechaLimite" | "responsable" | "asignadoPor";

export type EntradaTarea = Record<Exclude<CamposTarea, "proyectoId" | CampoOpcional>, unknown> & {
  proyectoId: unknown;
} & Partial<Record<CampoOpcional, unknown>>;

export type ResultadoValidacion =
  { ok: true; datos: DatosTarea } | { ok: false; errores: ErroresTarea };

function comoTexto(valor: unknown): string {
  return typeof valor === "string" ? valor : "";
}

function diaSemanaParse(valor: unknown): number | null {
  if (valor === null || valor === undefined) return null;
  if (typeof valor === "number" && Number.isInteger(valor)) return valor;
  if (typeof valor === "string" && valor !== "") {
    const n = parseInt(valor, 10);
    return Number.isInteger(n) ? n : null;
  }
  return null;
}

function diaMesParse(valor: unknown): number | null {
  if (valor === null || valor === undefined) return null;
  if (typeof valor === "number" && Number.isInteger(valor)) return valor;
  if (typeof valor === "string" && valor !== "") {
    const n = parseInt(valor, 10);
    return Number.isInteger(n) ? n : null;
  }
  return null;
}

function fechaParse(valor: unknown): Date | null {
  if (valor === null || valor === undefined) return null;
  if (valor instanceof Date) return isNaN(valor.getTime()) ? null : valor;
  if (typeof valor === "string" && valor !== "") {
    const d = new Date(valor);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

// Fecha opcional: undefined no se toca, vacío limpia, texto inválido marca error
function fechaOpcional(valor: unknown): { valor?: Date | null; invalida?: boolean } {
  if (valor === undefined) return {};
  if (valor === null || valor === "") return { valor: null };
  const fecha = fechaParse(valor);
  return fecha ? { valor: fecha } : { invalida: true };
}

// Texto libre opcional: undefined no se toca, vacío limpia
function textoOpcional(valor: unknown): string | null | undefined {
  if (valor === undefined) return undefined;
  if (typeof valor !== "string") return null;
  const limpio = valor.trim();
  return limpio === "" ? null : limpio;
}

// Una tarea sigue activa salvo que esté completada o cancelada
export function estaAbierta(estado: string): boolean {
  return estado !== "COMPLETADA" && estado !== "CANCELADA";
}

export function validarTarea(entrada: EntradaTarea): ResultadoValidacion {
  const titulo = comoTexto(entrada.titulo);
  const descripcion = entrada.descripcion;
  const tipoFrecuencia = comoTexto(entrada.tipoFrecuencia);
  const rawDiaSemana = diaSemanaParse(entrada.diaSemana as number | string | null);
  const rawDiaMes = diaMesParse(entrada.diaMes as number | string | null);
  const rawFechaPuntual = fechaParse(entrada.fechaPuntual);
  const rawProyectoId = entrada.proyectoId;
  const proyectoId =
    typeof rawProyectoId === "string" && rawProyectoId !== "" ? rawProyectoId : null;
  const estado = comoTexto(entrada.estado);
  const prioridad = comoTexto(entrada.prioridad);
  const inicio = fechaOpcional(entrada.fechaInicio);
  const limite = fechaOpcional(entrada.fechaLimite);
  const responsable = textoOpcional(entrada.responsable);
  const asignadoPor = textoOpcional(entrada.asignadoPor);

  // Errores de campo individual
  const errores: ErroresTarea = {};

  if (!titulo) errores.titulo = "El título es obligatorio.";
  else if (titulo.length > LIMITES_TAREA.titulo) {
    errores.titulo = `El título admite hasta ${LIMITES_TAREA.titulo} caracteres.`;
  }

  if (typeof descripcion === "string" && descripcion.length > LIMITES_TAREA.descripcion) {
    errores.descripcion = `La descripción admite hasta ${LIMITES_TAREA.descripcion} caracteres.`;
  }

  if (!tipoFrecuencia || !VALORES_FRECUENCIA.includes(tipoFrecuencia)) {
    errores.tipoFrecuencia = "Elige una frecuencia válida.";
  }

  if (rawDiaSemana !== null && (rawDiaSemana < 0 || rawDiaSemana > 6)) {
    errores.diaSemana = "El día de la semana va de 0 (domingo) a 6 (sábado).";
  }

  if (rawDiaMes !== null && (rawDiaMes < 1 || rawDiaMes > 31)) {
    errores.diaMes = "El día del mes va de 1 a 31.";
  }

  // Validaciones cruzadas
  if (tipoFrecuencia === "SEMANAL" && rawDiaSemana === null) {
    errores.diaSemana = "Indica el día de la semana para tareas semanales.";
  }

  if (tipoFrecuencia === "MENSUAL" && rawDiaMes === null) {
    errores.diaMes = "Indica el día del mes para tareas mensuales.";
  }

  // Una puntual sin fechas es válida: queda en Pendientes hasta que se le asigne una fecha
  const textoFecha = typeof entrada.fechaPuntual === "string" ? entrada.fechaPuntual : "";
  if (tipoFrecuencia === "PUNTUAL" && textoFecha !== "" && !rawFechaPuntual) {
    errores.fechaPuntual = "La fecha del día no es válida.";
  }

  if (estado !== "" && !VALORES_ESTADO.includes(estado)) errores.estado = "Elige un estado válido.";

  if (prioridad !== "" && !VALORES_PRIORIDAD.includes(prioridad)) {
    errores.prioridad = "Elige una prioridad válida.";
  }

  if (inicio.invalida) errores.fechaInicio = "La fecha de inicio no es válida.";
  if (limite.invalida) errores.fechaLimite = "La fecha límite no es válida.";
  if (inicio.valor && limite.valor && limite.valor < inicio.valor) {
    errores.fechaLimite = "La fecha límite no puede ser anterior a la de inicio.";
  }

  if (responsable && responsable.length > LIMITES_TAREA.responsable) {
    errores.responsable = `El responsable admite hasta ${LIMITES_TAREA.responsable} caracteres.`;
  }

  if (asignadoPor && asignadoPor.length > LIMITES_TAREA.asignadoPor) {
    errores.asignadoPor = `Este campo admite hasta ${LIMITES_TAREA.asignadoPor} caracteres.`;
  }

  if (Object.keys(errores).length > 0) return { ok: false, errores };

  const estadoFinal = estado === "" ? undefined : (estado as EstadoTarea);

  return {
    ok: true,
    datos: {
      titulo,
      descripcion: typeof descripcion === "string" && descripcion !== "" ? descripcion : null,
      tipoFrecuencia: tipoFrecuencia as DatosTarea["tipoFrecuencia"],
      diaSemana: tipoFrecuencia === "SEMANAL" ? rawDiaSemana : null,
      diaMes: tipoFrecuencia === "MENSUAL" ? rawDiaMes : null,
      fechaPuntual: tipoFrecuencia === "PUNTUAL" ? rawFechaPuntual : null,
      proyectoId,
      estado: estadoFinal,
      prioridad: prioridad === "" ? undefined : (prioridad as PrioridadTarea),
      fechaInicio: inicio.valor,
      fechaLimite: limite.valor,
      responsable,
      asignadoPor,
      activa: estadoFinal === undefined ? undefined : estaAbierta(estadoFinal),
    },
  };
}

type ResultadoCampos<T, C extends string> =
  { ok: true; datos: T } | { ok: false; errores: Partial<Record<C, string>> };

export type DatosEnlace = { etiqueta: string; url: string };

function esUrlHttp(valor: string): boolean {
  try {
    const u = new URL(valor);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

// Enlace de referencia: etiqueta corta y URL http o https
export function validarEnlace(entrada: {
  etiqueta: unknown;
  url: unknown;
}): ResultadoCampos<DatosEnlace, "etiqueta" | "url"> {
  const etiqueta = comoTexto(entrada.etiqueta).trim();
  const url = comoTexto(entrada.url).trim();
  const errores: Partial<Record<"etiqueta" | "url", string>> = {};

  if (!etiqueta) errores.etiqueta = "La etiqueta es obligatoria.";
  else if (etiqueta.length > LIMITES_TAREA.enlaceEtiqueta) {
    errores.etiqueta = `La etiqueta admite hasta ${LIMITES_TAREA.enlaceEtiqueta} caracteres.`;
  }

  if (!url) errores.url = "La dirección es obligatoria.";
  else if (url.length > LIMITES_TAREA.enlaceUrl) {
    errores.url = `La dirección admite hasta ${LIMITES_TAREA.enlaceUrl} caracteres.`;
  } else if (!esUrlHttp(url)) errores.url = "Escribe una dirección http o https válida.";

  if (Object.keys(errores).length > 0) return { ok: false, errores };
  return { ok: true, datos: { etiqueta, url } };
}

type ResultadoTexto = { ok: true; texto: string } | { ok: false; error: string };

// Texto obligatorio con tope de caracteres, compartido por subtareas y comentarios
function validarTextoLimitado(valor: unknown, limite: number, nombre: string): ResultadoTexto {
  const texto = comoTexto(valor).trim();
  if (!texto) return { ok: false, error: `${nombre} es obligatorio.` };
  if (texto.length > limite) {
    return { ok: false, error: `${nombre} admite hasta ${limite} caracteres.` };
  }
  return { ok: true, texto };
}

// Texto de una subtarea: obligatorio y de hasta 300 caracteres
export function validarSubtarea(texto: unknown): ResultadoTexto {
  return validarTextoLimitado(texto, LIMITES_TAREA.subtareaTexto, "El texto");
}

// Descripción opcional de una subtarea: vacío se normaliza a null, máximo 500 caracteres
export function validarDescripcionSubtarea(descripcion: unknown): string | null {
  const limpio = comoTexto(descripcion).trim();
  if (limpio === "") return null;
  if (limpio.length > LIMITES_TAREA.subtareaDescripcion) return null;
  return limpio;
}

export function validarComentario(texto: unknown): ResultadoTexto {
  return validarTextoLimitado(texto, LIMITES_TAREA.comentario, "El comentario");
}
