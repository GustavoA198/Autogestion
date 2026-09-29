// Operaciones de base de datos para calendario; acceso centralizado para sincronización.
import { obtenerPrisma } from "@/lib/prisma";
import { inferirEnlaceReunion } from "./enlaces";
import type { InvitadoEvento } from "./proveedor";
import type { CambiosCalendario, EventoCalendario, ProveedorCalendario } from "./proveedor";
import type { Prisma, Reunion } from "@/generated/prisma/client";
import { ErrorCalendario } from "./proveedor";

const USUARIO_ID = "unico";

// Serializa sincronizaciones por cuenta: dos llamadas en paralelo pisarían el syncToken y perderían upserts
const COLA_SINCRONIZACION = new Map<string, Promise<unknown>>();

function encolarSincronizacion<T>(
  cuentaId: string,
  tarea: () => Promise<T>,
): Promise<T> {
  const previa = COLA_SINCRONIZACION.get(cuentaId) ?? Promise.resolve();
  const siguiente = previa.then(tarea, tarea);
  COLA_SINCRONIZACION.set(
    cuentaId,
    siguiente.catch(() => undefined),
  );
  return siguiente;
}

// Campos persistidos de un evento; compartidos por create y update
function datosEvento(evento: EventoCalendario) {
  return {
    titulo: evento.titulo,
    descripcion: evento.descripcion,
    inicio: evento.inicio,
    fin: evento.fin,
    enlaceReunion: evento.enlaceReunion,
    enlaceEvento: evento.enlaceEvento,
    ubicacion: evento.ubicacion,
    organizador: evento.organizador,
    estado: evento.estado,
    diaCompleto: evento.diaCompleto ?? false,
    invitados: (evento.invitados ?? []) as unknown as Prisma.InputJsonValue,
  };
}

// Reunión lista para la UI: sin relaciones y con invitados tipados
export type ReunionDetalle = {
  id: string;
  proveedor: "GOOGLE" | "MICROSOFT";
  idExterno: string;
  titulo: string;
  descripcion: string | null;
  inicio: Date;
  fin: Date;
  enlaceReunion: string | null;
  enlaceEvento: string | null;
  ubicacion: string | null;
  organizador: string | null;
  estado: string | null;
  diaCompleto: boolean;
  invitados: InvitadoEvento[];
};

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

// Resultado de una sincronización; `omitida` indica que el límite de frecuencia evitó llamar al proveedor
export type ResultadoSincronizacionReuniones = {
  cantidad: number;
  huboCambios: boolean;
  omitida: boolean;
  ultimaSincronizacion: Date | null;
};

export type OrigenSincronizacion = "auto" | "manual";

// Una sincronización automática se omite si la cuenta se sincronizó hace menos de este tiempo
const INTERVALO_MINIMO_AUTO_MS = 60_000;
const DIAS_PASADO = 30;

// Sincroniza reuniones desde el proveedor a la BD local; incremental si el proveedor lo permite
export async function sincronizarCalendario(
  proveedor: ProveedorCalendario,
  tipoProveedor: "GOOGLE" | "MICROSOFT",
  origen: OrigenSincronizacion = "manual",
): Promise<ResultadoSincronizacionReuniones> {
  const prisma = obtenerPrisma();
  const cuenta = await prisma.cuentaCalendario.findUnique({
    where: { proveedor_usuarioId: { proveedor: tipoProveedor, usuarioId: USUARIO_ID } },
  });
  if (!cuenta) throw new ErrorCalendario("Cuenta no conectada.", "no-configurado");

  return encolarSincronizacion(cuenta.id, async () => {
    const cuentaActual = await prisma.cuentaCalendario.findUnique({
      where: { id: cuenta.id },
    });
    if (!cuentaActual) throw new ErrorCalendario("Cuenta no conectada.", "no-configurado");

    const ahora = new Date();
    const anterior = cuentaActual.ultimaSincronizacion ?? null;
    if (
      origen === "auto" &&
      anterior &&
      ahora.getTime() - anterior.getTime() < INTERVALO_MINIMO_AUTO_MS
    ) {
      return {
        cantidad: 0,
        huboCambios: false,
        omitida: true,
        ultimaSincronizacion: anterior,
      };
    }

    const hace30dias = new Date(ahora);
    hace30dias.setDate(hace30dias.getDate() - DIAS_PASADO);
    const marcarSincronizada = (syncToken?: string | null) =>
      prisma.cuentaCalendario.update({
        where: { id: cuenta.id },
        data: { ultimaSincronizacion: ahora, ...(syncToken !== undefined ? { syncToken } : {}) },
      });
    const upsertDe = (evento: EventoCalendario) =>
      prisma.reunion.upsert({
        where: {
          proveedor_idExterno: { proveedor: tipoProveedor, idExterno: evento.idExterno },
        },
        create: {
          proveedor: tipoProveedor,
          idExterno: evento.idExterno,
          cuentaCalendarioId: cuenta.id,
          ...datosEvento(evento),
        },
        update: datosEvento(evento),
      });

    if (proveedor.listarCambios) {
      let cambios: CambiosCalendario;
      try {
        cambios = await proveedor.listarCambios(cuentaActual.syncToken, hace30dias);
      } catch (e) {
        if (e instanceof ErrorCalendario) throw e;
        throw new ErrorCalendario("Error al sincronizar reuniones.", "desconocido");
      }

      // En incrementales llegan cambios de cualquier fecha; se ignoran los que terminaron antes de la ventana
      const eventos = cambios.esCompleta
        ? cambios.eventos
        : cambios.eventos.filter((e) => e.fin.getTime() >= hace30dias.getTime());
      const upserts = eventos.map(upsertDe);

      // Un evento cancelado borra su reunión y, si era una serie, las instancias guardadas (id base + "_")
      const borrados = cambios.cancelados.length
        ? prisma.reunion.deleteMany({
            where: {
              cuentaCalendarioId: cuenta.id,
              OR: cambios.cancelados.flatMap((id) => [
                { idExterno: id },
                { idExterno: { startsWith: `${id}_` } },
              ]),
            },
          })
        : null;
      // La carga completa además limpia las reuniones de la ventana que ya no existen en el proveedor
      const obsoletas = cambios.esCompleta
        ? prisma.reunion.deleteMany({
            where: {
              cuentaCalendarioId: cuenta.id,
              inicio: { gte: hace30dias },
              idExterno: { notIn: eventos.map((e) => e.idExterno) },
            },
          })
        : null;

      // Todo va en una transacción: el token nuevo solo se guarda si los cambios se aplicaron
      const operaciones = [
        ...upserts,
        ...(borrados ? [borrados] : []),
        ...(obsoletas ? [obsoletas] : []),
        marcarSincronizada(cambios.nextSyncToken),
      ];
      const resultados = (await prisma.$transaction(operaciones)) ?? [];
      const eliminadas = resultados
        .slice(upserts.length, operaciones.length - 1)
        .reduce((total: number, r) => total + ((r as { count?: number } | null)?.count ?? 0), 0);
      const cantidad = upserts.length + eliminadas;
      return {
        cantidad,
        huboCambios: cambios.esCompleta || cantidad > 0,
        omitida: false,
        ultimaSincronizacion: ahora,
      };
    }

    // Proveedores sin lectura incremental: se trae toda la ventana de ±30 días cada vez
    const en30dias = new Date(ahora);
    en30dias.setDate(en30dias.getDate() + DIAS_PASADO);
    let eventos: EventoCalendario[];
    try {
      eventos = await proveedor.listarEventos(hace30dias, en30dias);
    } catch (e) {
      if (e instanceof ErrorCalendario) throw e;
      throw new ErrorCalendario("Error al sincronizar reuniones.", "desconocido");
    }

    // Elimina las reuniones del rango que ya no existen en el proveedor (borradas o canceladas)
    const obsoletas = prisma.reunion.deleteMany({
      where: {
        cuentaCalendarioId: cuenta.id,
        inicio: { gte: hace30dias, lte: en30dias },
        idExterno: { notIn: eventos.map((e) => e.idExterno) },
      },
    });

    await prisma.$transaction([...eventos.map(upsertDe), obsoletas, marcarSincronizada()]);
    return {
      cantidad: eventos.length,
      huboCambios: true,
      omitida: false,
      ultimaSincronizacion: ahora,
    };
  });
}

// Versión simple para los flujos de conexión: devuelve solo cuántos eventos se procesaron
export async function sincronizarReuniones(
  proveedor: ProveedorCalendario,
  tipoProveedor: "GOOGLE" | "MICROSOFT",
): Promise<number> {
  return (await sincronizarCalendario(proveedor, tipoProveedor)).cantidad;
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
      cuentaCalendarioId,
      ...datosEvento(evento),
    },
  });
}

// Convierte una fila de la BD en la reunión de la UI; infiere el enlace de videollamada si falta
function aReunionDetalle(f: Reunion): ReunionDetalle {
  return {
    id: f.id,
    proveedor: f.proveedor,
    idExterno: f.idExterno,
    titulo: f.titulo,
    descripcion: f.descripcion,
    inicio: f.inicio,
    fin: f.fin,
    enlaceReunion: f.enlaceReunion ?? inferirEnlaceReunion(f.descripcion, f.ubicacion) ?? null,
    enlaceEvento: f.enlaceEvento,
    ubicacion: f.ubicacion,
    organizador: f.organizador,
    estado: f.estado,
    diaCompleto: f.diaCompleto,
    invitados: Array.isArray(f.invitados) ? (f.invitados as unknown as InvitadoEvento[]) : [],
  };
}

// Lista reuniones desde la BD local (sin consultar el proveedor externo)
export async function listarReunionesLocales(
  fechaInicio?: Date,
  fechaFin?: Date,
): Promise<ReunionDetalle[]> {
  const filas = await obtenerPrisma().reunion.findMany({
    where: {
      ...(fechaInicio ? { inicio: { gte: fechaInicio } } : {}),
      ...(fechaFin ? { fin: { lte: fechaFin } } : {}),
    },
    orderBy: { inicio: "asc" },
  });
  return filas.map(aReunionDetalle);
}

// Reuniones que se solapan con [desde, hasta): incluye las que empiezan antes o terminan después del rango
export async function listarReunionesEnRango(desde: Date, hasta: Date): Promise<ReunionDetalle[]> {
  const filas = await obtenerPrisma().reunion.findMany({
    where: { inicio: { lt: hasta }, fin: { gte: desde } },
    orderBy: [{ inicio: "asc" }, { fin: "asc" }],
  });
  return filas.map(aReunionDetalle);
}

// Elimina la cuenta y todas las reuniones asociadas
export async function desconectarCalendario(proveedor: "GOOGLE" | "MICROSOFT"): Promise<void> {
  await obtenerPrisma().cuentaCalendario.deleteMany({ where: { proveedor } });
}
