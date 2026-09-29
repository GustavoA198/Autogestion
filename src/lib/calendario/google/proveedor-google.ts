import { OAuth2Client } from "google-auth-library";
import { google, type calendar_v3 } from "googleapis";
import { leerEntornoCalendario } from "@/lib/env";
import { cifrar, descifrar } from "@/lib/cifrado/cifrado";
import { obtenerPrisma } from "@/lib/prisma";
import type {
  CambiosCalendario,
  DatosEvento,
  ErrorCalendario,
  EventoCalendario,
  ProveedorCalendario,
} from "../proveedor";
import { enlaceSeguro, ErrorCalendario as ErrorCalendarioBase } from "../proveedor";

const SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events",
];
const USUARIO_ID = "unico";
// Tope de seguridad de páginas por lectura (250 eventos cada una) para no iterar sin fin
const MAX_PAGINAS_SINCRONIZACION = 100;

type EventoGoogle = {
  id?: string | null;
  summary?: string | null;
  description?: string | null;
  location?: string | null;
  status?: string | null;
  htmlLink?: string | null;
  hangoutLink?: string | null;
  start?: { dateTime?: string | null; date?: string | null } | null;
  end?: { dateTime?: string | null; date?: string | null } | null;
  organizer?: { displayName?: string | null; email?: string | null } | null;
  attendees?:
    | {
        displayName?: string | null;
        email?: string | null;
        responseStatus?: string | null;
        organizer?: boolean | null;
        optional?: boolean | null;
      }[]
    | null;
  conferenceData?: {
    entryPoints?: { entryPointType?: string | null; uri?: string | null }[] | null;
  } | null;
};

// Convierte un evento crudo de Google al formato común de la app
export function mapearEventoGoogle(evento: EventoGoogle): EventoCalendario {
  const diaCompleto = !evento.start?.dateTime && Boolean(evento.start?.date);
  const video = evento.conferenceData?.entryPoints?.find((e) => e.entryPointType === "video")?.uri;
  const organizador = evento.organizer?.displayName ?? evento.organizer?.email ?? undefined;
  return {
    idExterno: evento.id ?? "",
    titulo: evento.summary ?? "Sin título",
    descripcion: evento.description ?? undefined,
    inicio: new Date(evento.start?.dateTime ?? evento.start?.date ?? Date.now()),
    fin: new Date(evento.end?.dateTime ?? evento.end?.date ?? Date.now()),
    enlaceReunion: enlaceSeguro(evento.hangoutLink ?? video),
    enlaceEvento: enlaceSeguro(evento.htmlLink),
    ubicacion: evento.location ?? undefined,
    organizador,
    estado: evento.status ?? undefined,
    diaCompleto,
    invitados: (evento.attendees ?? []).map((i) => ({
      nombre: i.displayName ?? undefined,
      email: i.email ?? undefined,
      respuesta: i.responseStatus ?? undefined,
      organizador: i.organizer ?? undefined,
      opcional: i.optional ?? undefined,
    })),
  };
}

// Detecta el 410 GONE de Google (syncToken vencido) tanto si llega como número, texto o dentro de response
function esRespuestaGone(e: unknown): boolean {
  const err = e as { code?: number | string; status?: number; response?: { status?: number } };
  return [err?.code, err?.status, err?.response?.status].some((v) => Number(v) === 410);
}

// Tokens cifrados en la base; se descifran solo en memoria
function descifrarToken(cifrado: string): string {
  return descifrar(cifrado);
}

function descifrarTokens(accessToken: string | null, refreshToken: string | null) {
  return {
    accessToken: accessToken ? descifrarToken(accessToken) : null,
    refreshToken: refreshToken ? descifrarToken(refreshToken) : null,
  };
}

export class GoogleProveedor implements ProveedorCalendario {
  private oauth2Client: OAuth2Client;

  constructor() {
    const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } = leerEntornoCalendario();
    this.oauth2Client = new OAuth2Client({
      clientId: GOOGLE_CLIENT_ID ?? "",
      clientSecret: GOOGLE_CLIENT_SECRET ?? "",
      redirectUri: GOOGLE_REDIRECT_URI,
    });
  }

  // Genera la URL de autorización de Google OAuth
  generarUrlAutenticacion(): string {
    return this.oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: SCOPES,
      prompt: "consent",
    });
  }

  // Intercambia el código de autorización por tokens y los guarda cifrados en la BD
  async guardarTokensDesdeCode(code: string): Promise<void> {
    const { tokens } = await this.oauth2Client.getToken(code);
    if (!tokens.refresh_token) {
      throw new ErrorCalendarioBase("Google no devolvió un refresh token.", "desconocido");
    }
    const prisma = obtenerPrisma();
    await prisma.cuentaCalendario.upsert({
      where: { proveedor_usuarioId: { proveedor: "GOOGLE", usuarioId: USUARIO_ID } },
      create: {
        proveedor: "GOOGLE",
        usuarioId: USUARIO_ID,
        accessTokenCifrado: tokens.access_token ? cifrar(tokens.access_token) : null,
        refreshTokenCifrado: cifrar(tokens.refresh_token),
        expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        scope: SCOPES.join(" "),
      },
      update: {
        accessTokenCifrado: tokens.access_token ? cifrar(tokens.access_token) : null,
        refreshTokenCifrado: cifrar(tokens.refresh_token),
        expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        // Al reconectar se empieza limpio: la próxima sincronización es completa
        syncToken: null,
        ultimaSincronizacion: null,
      },
    });
  }

  // Recupera tokens de la BD y configura el cliente OAuth
  private async configurarCliente(): Promise<void> {
    const cuenta = await obtenerPrisma().cuentaCalendario.findUnique({
      where: { proveedor_usuarioId: { proveedor: "GOOGLE", usuarioId: USUARIO_ID } },
    });
    if (!cuenta || !cuenta.refreshTokenCifrado) {
      throw new ErrorCalendarioBase("Cuenta de Google no conectada.", "no-configurado");
    }
    const { accessToken, refreshToken } = descifrarTokens(
      cuenta.accessTokenCifrado,
      cuenta.refreshTokenCifrado,
    );
    this.oauth2Client.setCredentials({ access_token: accessToken, refresh_token: refreshToken });
  }

  private buildError(e: unknown): ErrorCalendario {
    if (e instanceof ErrorCalendarioBase) return e;
    const mensaje = e instanceof Error ? e.message : "Error desconocido";
    if (mensaje.includes("No refresh token"))
      return new ErrorCalendarioBase(mensaje, "no-configurado");
    if (mensaje.includes("invalid_grant") || mensaje.includes("Token has been expired"))
      return new ErrorCalendarioBase(
        "El token de acceso fue revocado o venció.",
        "accesso-revocado",
      );
    if (mensaje.includes("ENOTFOUND") || mensaje.includes("ECONNREFUSED"))
      return new ErrorCalendarioBase("Sin conexión a internet.", "sin-conexion");
    return new ErrorCalendarioBase(mensaje, "desconocido");
  }

  async listarEventos(fechaInicio: Date, fechaFin: Date): Promise<EventoCalendario[]> {
    if (!this.estaConfigurado()) {
      throw new ErrorCalendarioBase(
        "Variables de Google Calendar no configuradas.",
        "no-configurado",
      );
    }
    try {
      await this.configurarCliente();
      const calendar = google.calendar({ version: "v3", auth: this.oauth2Client });
      const eventos: EventoCalendario[] = [];
      let pageToken: string | undefined;
      // Recorre todas las páginas para no perder eventos
      do {
        const respuesta = await calendar.events.list({
          calendarId: "primary",
          timeMin: fechaInicio.toISOString(),
          timeMax: fechaFin.toISOString(),
          singleEvents: true,
          orderBy: "startTime",
          maxResults: 250,
          pageToken,
        });
        for (const evento of respuesta.data.items ?? []) {
          eventos.push(mapearEventoGoogle(evento as EventoGoogle));
        }
        pageToken = respuesta.data.nextPageToken ?? undefined;
      } while (pageToken);
      return eventos;
    } catch (e) {
      throw this.buildError(e);
    }
  }

  // Lee una carga completa desde `desde` (sin token) o solo los cambios desde el token, recorriendo todas las páginas
  private async leerCambios(
    calendar: calendar_v3.Calendar,
    syncToken: string | null,
    desde: Date,
  ): Promise<CambiosCalendario> {
    const eventos: EventoCalendario[] = [];
    const cancelados: string[] = [];
    let nextSyncToken: string | null = null;
    let pageToken: string | undefined;
    let paginas = 0;
    do {
      if (++paginas > MAX_PAGINAS_SINCRONIZACION) {
        throw new ErrorCalendarioBase(
          "Google devolvió demasiadas páginas de eventos.",
          "desconocido",
        );
      }
      // Con syncToken no se admiten timeMin, timeMax ni orderBy; singleEvents debe ser igual en todas las solicitudes
      const respuesta = await calendar.events.list({
        calendarId: "primary",
        singleEvents: true,
        maxResults: 250,
        pageToken,
        ...(syncToken ? { syncToken } : { timeMin: desde.toISOString() }),
      });
      for (const item of respuesta.data.items ?? []) {
        // Los eventos cancelados llegan sin fechas, así que no se mapean
        if (item.status === "cancelled") {
          if (item.id) cancelados.push(item.id);
        } else {
          eventos.push(mapearEventoGoogle(item as EventoGoogle));
        }
      }
      pageToken = respuesta.data.nextPageToken ?? undefined;
      // El nextSyncToken solo viene en la última página
      if (!pageToken) nextSyncToken = respuesta.data.nextSyncToken ?? null;
    } while (pageToken);
    return { eventos, cancelados, nextSyncToken, esCompleta: syncToken === null };
  }

  async listarCambios(
    syncToken: string | null | undefined,
    desde: Date,
  ): Promise<CambiosCalendario> {
    if (!this.estaConfigurado()) {
      throw new ErrorCalendarioBase(
        "Variables de Google Calendar no configuradas.",
        "no-configurado",
      );
    }
    try {
      await this.configurarCliente();
      const calendar = google.calendar({ version: "v3", auth: this.oauth2Client });
      try {
        return await this.leerCambios(calendar, syncToken ?? null, desde);
      } catch (e) {
        // Un 410 indica token inválido: se repite una sola vez como carga completa
        if (syncToken && esRespuestaGone(e)) return await this.leerCambios(calendar, null, desde);
        throw e;
      }
    } catch (e) {
      throw this.buildError(e);
    }
  }

  async crearEvento(datos: DatosEvento): Promise<EventoCalendario> {
    if (!this.estaConfigurado()) {
      throw new ErrorCalendarioBase(
        "Variables de Google Calendar no configuradas.",
        "no-configurado",
      );
    }
    try {
      await this.configurarCliente();
      const calendar = google.calendar({ version: "v3", auth: this.oauth2Client });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const evento = await (calendar.events.insert as any)({
        calendarId: "primary",
        requestBody: {
          summary: datos.titulo,
          description: datos.descripcion,
          start: { dateTime: datos.inicio.toISOString() },
          end: { dateTime: datos.fin.toISOString() },
        },
        conferenceDataVersion: 1,
        requestConferenceData: true,
      });
      return mapearEventoGoogle(evento.data as EventoGoogle);
    } catch (e) {
      throw this.buildError(e);
    }
  }

  async refreshTokens(): Promise<void> {
    try {
      await this.configurarCliente();
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      await obtenerPrisma().cuentaCalendario.update({
        where: { proveedor_usuarioId: { proveedor: "GOOGLE", usuarioId: USUARIO_ID } },
        data: {
          accessTokenCifrado: credentials.access_token
            ? cifrar(credentials.access_token)
            : undefined,
          expiresAt: credentials.expiry_date ? new Date(credentials.expiry_date) : null,
        },
      });
    } catch (e) {
      throw this.buildError(e);
    }
  }

  estaConfigurado(): boolean {
    const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = leerEntornoCalendario();
    return Boolean(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET);
  }
}

// Instancia compartida para usar en Server Actions
let instancia: GoogleProveedor | null = null;

export function obtenerGoogleProveedor(): GoogleProveedor {
  instancia ??= new GoogleProveedor();
  return instancia;
}
