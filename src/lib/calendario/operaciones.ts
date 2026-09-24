// Operaciones de base de datos para calendario; acceso centralizado para sincronización.
import { obtenerPrisma } from "@/lib/prisma";
import type { EventoCalendario, ProveedorCalendario } from "./proveedor";
import { ErrorCalendario } from "./proveedor";

const USUARIO_ID = "unico";

// Obtiene la cuenta conectada de un proveedor
export function obtenerCuentaCalendario(proveedor: "GOOGLE" | "MICROSOFT") {
  return obtenerPrisma().cuentaCalendario.findUnique({
    where: { proveedor_usuarioId: { proveedor, usuarioId: USUARIO_ID } },
  });
}

// Verifica si una cuenta está conectada y con tokens válidos
export async function cuentaEstaConectada(proveedor: "GOOGLE" | "MICROSOFT"): Promise<boolean> {
  const cuenta = await obtenerCuentaCalendario(proveedor);
  return Boolean(cuenta?.refreshTokenCifrado);
}

// Sincroniza reuniones desde el proveedor a la BD local
export async function sincronizarReuniones(
  proveedor: ProveedorCalendario,
  tipoProveedor: "GOOGLE" | "MICROSOFT",
): Promise<number> {
  const ahora = new Date();
  const hace30dias = new Date(ahora);
  hace30dias.setDate(hace30dias.getDate() - 30);
  const en30dias = new Date(ahora);
  en30dias.setDate(en30dias.getDate() + 30);

  let eventos: EventoCalendario[];
  try {
    eventos = await proveedor.listarEventos(hace30dias, en30dias);
  } catch (e) {
    if (e instanceof ErrorCalendario) throw e;
    throw new ErrorCalendario("Error al sincronizar reuniones.", "desconocido");
  }

  const prisma = obtenerPrisma();
  const cuenta = await prisma.cuentaCalendario.findUnique({
    where: { proveedor_usuarioId: { proveedor: tipoProveedor, usuarioId: USUARIO_ID } },
  });
  if (!cuenta) throw new ErrorCalendario("Cuenta no conectada.", "no-configurado");

  const upserts = eventos.map((evento) =>
    prisma.reunion.upsert({
      where: { proveedor_idExterno: { proveedor: tipoProveedor, idExterno: evento.idExterno } },
      create: {
        proveedor: tipoProveedor,
        idExterno: evento.idExterno,
        titulo: evento.titulo,
        descripcion: evento.descripcion,
        inicio: evento.inicio,
        fin: evento.fin,
        enlaceReunion: evento.enlaceReunion,
        cuentaCalendarioId: cuenta.id,
      },
      update: {
        titulo: evento.titulo,
        descripcion: evento.descripcion,
        inicio: evento.inicio,
        fin: evento.fin,
        enlaceReunion: evento.enlaceReunion,
      },
    }),
  );

  await prisma.$transaction(upserts);
  return eventos.length;
}

// Guarda una reunión creada en el proveedor externo
export async function guardarReunion(
  proveedor: "GOOGLE" | "MICROSOFT",
  evento: EventoCalendario,
  cuentaCalendarioId: string,
) {
  return obtenerPrisma().reunion.create({
    data: {
      proveedor,
      idExterno: evento.idExterno,
      titulo: evento.titulo,
      descripcion: evento.descripcion,
      inicio: evento.inicio,
      fin: evento.fin,
      enlaceReunion: evento.enlaceReunion,
      cuentaCalendarioId,
    },
  });
}

// Lista reuniones desde la BD local (sin consultar el proveedor externo)
export function listarReunionesLocales(fechaInicio?: Date, fechaFin?: Date) {
  return obtenerPrisma().reunion.findMany({
    where: {
      ...(fechaInicio ? { inicio: { gte: fechaInicio } } : {}),
      ...(fechaFin ? { fin: { lte: fechaFin } } : {}),
    },
    orderBy: { inicio: "asc" },
  });
}

// Elimina la cuenta y todas las reuniones asociadas
export async function desconectarCalendario(proveedor: "GOOGLE" | "MICROSOFT"): Promise<void> {
  await obtenerPrisma().cuentaCalendario.deleteMany({ where: { proveedor } });
}
