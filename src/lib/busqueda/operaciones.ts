import { obtenerPrisma } from "@/lib/prisma";

export type ResultadoGlobal = {
  credenciales: ResultadoCredencial[];
  contactos: ResultadoContacto[];
  notas: ResultadoNota[];
  tareas: ResultadoTarea[];
};

export type ResultadoCredencial = {
  id: string;
  nombre: string;
  categoria: string;
  usuario: string | null;
  proyectoId: string | null;
};

export type ResultadoContacto = {
  id: string;
  nombre: string;
  correo: string;
  empresaOCargo: string | null;
  proyectoId: string | null;
};

export type ResultadoNota = {
  id: string;
  texto: string;
  proyectoId: string;
};

export type ResultadoTarea = {
  id: string;
  titulo: string;
  descripcion: string | null;
  proyectoId: string | null;
};

async function buscarCredenciales(termino: string) {
  const resultados = await obtenerPrisma().credencial.findMany({
    where: {
      OR: [
        { nombre: { contains: termino, mode: "insensitive" } },
        { usuario: { contains: termino, mode: "insensitive" } },
        { host: { contains: termino, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      nombre: true,
      categoria: true,
      usuario: true,
      global: true,
      proyectos: { select: { proyectoId: true } },
    },
    take: 20,
  });

  return resultados.map((c) => ({
    id: c.id,
    nombre: c.nombre,
    categoria: c.categoria,
    usuario: c.usuario,
    proyectoId:
      c.global || c.proyectos.length === 0
        ? null
        : c.proyectos.length === 1
          ? c.proyectos[0]!.proyectoId
          : null,
  }));
}

async function buscarContactos(termino: string) {
  const resultados = await obtenerPrisma().contacto.findMany({
    where: {
      OR: [
        { nombre: { contains: termino, mode: "insensitive" } },
        { correo: { contains: termino, mode: "insensitive" } },
        { empresaOCargo: { contains: termino, mode: "insensitive" } },
      ],
    },
    include: { proyectos: { select: { proyectoId: true } } },
    take: 20,
  });

  return resultados.map((c) => ({
    id: c.id,
    nombre: c.nombre,
    correo: c.correo,
    empresaOCargo: c.empresaOCargo,
    proyectoId:
      c.global || c.proyectos.length === 0
        ? null
        : c.proyectos.length === 1
          ? c.proyectos[0]!.proyectoId
          : null,
  }));
}

async function buscarNotas(termino: string) {
  const resultados = await obtenerPrisma().nota.findMany({
    where: { texto: { contains: termino, mode: "insensitive" } },
    take: 20,
  });

  return resultados.map((n) => ({
    id: n.id,
    texto: n.texto,
    proyectoId: n.proyectoId,
  }));
}

async function buscarTareas(termino: string) {
  const resultados = await obtenerPrisma().tarea.findMany({
    where: {
      OR: [
        { titulo: { contains: termino, mode: "insensitive" } },
        { descripcion: { contains: termino, mode: "insensitive" } },
      ],
    },
    include: { proyecto: { select: { id: true } } },
    take: 20,
  });

  return resultados.map((t) => ({
    id: t.id,
    titulo: t.titulo,
    descripcion: t.descripcion,
    proyectoId: t.proyecto?.id ?? null,
  }));
}

export async function buscarGlobal(termino: string): Promise<ResultadoGlobal> {
  const [credenciales, contactos, notas, tareas] = await Promise.all([
    buscarCredenciales(termino),
    buscarContactos(termino),
    buscarNotas(termino),
    buscarTareas(termino),
  ]);

  return { credenciales, contactos, notas, tareas };
}
