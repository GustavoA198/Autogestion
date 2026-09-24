import { OAuth2Client } from "google-auth-library";
import { google } from "googleapis";
import { leerEntornoCalendario } from "@/lib/env";
import { cifrar, descifrar } from "@/lib/cifrado/cifrado";
import { obtenerPrisma } from "@/lib/prisma";
import type {
  DatosEvento,
  ErrorCalendario,
  EventoCalendario,
  ProveedorCalendario,
} from "../proveedor";
import { ErrorCalendario as ErrorCalendarioBase } from "../proveedor";

const SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events",
];
const USUARIO_ID = "unico";

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
      const respuesta = await calendar.events.list({
        calendarId: "primary",
        timeMin: fechaInicio.toISOString(),
        timeMax: fechaFin.toISOString(),
        singleEvents: true,
        orderBy: "startTime",
        maxResults: 250,
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (respuesta.data.items ?? []).map((evento: any) => ({
        idExterno: evento.id ?? "",
        titulo: evento.summary ?? "Sin título",
        descripcion: evento.description ?? undefined,
        inicio: new Date(evento.start?.dateTime ?? evento.start?.date ?? Date.now()),
        fin: new Date(evento.end?.dateTime ?? evento.end?.date ?? Date.now()),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        enlaceReunion:
          evento.hangoutLink ??
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          evento.conferenceData?.entryPoints?.find((e: any) => e.entryPointType === "video")?.uri ??
          undefined,
      }));
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const creado = evento.data as any;
      return {
        idExterno: creado.id ?? "",
        titulo: creado.summary ?? datos.titulo,
        descripcion: creado.description ?? undefined,
        inicio: new Date(creado.start?.dateTime ?? creado.start?.date ?? datos.inicio),
        fin: new Date(creado.end?.dateTime ?? creado.end?.date ?? datos.fin),
        enlaceReunion: creado.hangoutLink ?? undefined,
      };
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
