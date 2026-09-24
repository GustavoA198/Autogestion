// Proveedor Microsoft Calendar via Microsoft Graph API.
import { Client } from "@microsoft/microsoft-graph-client";
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

const SCOPES = ["Calendars.ReadWrite", "offline_access"];
const USUARIO_ID = "unico";

function descifrarToken(cifrado: string): string {
  return descifrar(cifrado);
}

function descifrarTokens(accessToken: string | null, refreshToken: string | null) {
  return {
    accessToken: accessToken ? descifrarToken(accessToken) : null,
    refreshToken: refreshToken ? descifrarToken(refreshToken) : null,
  };
}

export class MicrosoftProveedor implements ProveedorCalendario {
  private client: Client | null = null;

  constructor() {
    this.client = this.crearCliente();
  }

  private crearCliente(accessToken?: string | null, refreshToken?: string | null): Client {
    const {
      MICROSOFT_CLIENT_ID,
      MICROSOFT_CLIENT_SECRET,
      MICROSOFT_TENANT_ID,
      MICROSOFT_REDIRECT_URI,
    } = leerEntornoCalendario();

    // Simula un cliente OAuth sencillo sin usar OAuth2 explícito
    // El token se pasa directo para que GraphClient lo use en cada request
    const client = Client.init({
      authProvider: (done) => {
        if (accessToken) {
          done(null, accessToken);
        } else {
          done(new ErrorCalendarioBase("Token no disponible", "no-configurado"), null);
        }
      },
    });
    return client;
  }

  // Genera la URL de autorización de Microsoft OAuth
  generarUrlAutenticacion(): string {
    const { MICROSOFT_CLIENT_ID, MICROSOFT_TENANT_ID, MICROSOFT_REDIRECT_URI } =
      leerEntornoCalendario();
    const params = new URLSearchParams({
      client_id: MICROSOFT_CLIENT_ID ?? "",
      response_type: "code",
      redirect_uri: MICROSOFT_REDIRECT_URI ?? "",
      response_mode: "query",
      scope: SCOPES.join(" "),
      state: "ms-calendar",
    });
    return `https://login.microsoftonline.com/${MICROSOFT_TENANT_ID ?? "common"}/oauth2/v2.0/authorize?${params}`;
  }

  // Intercambia el código de autorización por tokens y los guarda cifrados en la BD
  async guardarTokensDesdeCode(code: string): Promise<void> {
    const {
      MICROSOFT_CLIENT_ID,
      MICROSOFT_CLIENT_SECRET,
      MICROSOFT_TENANT_ID,
      MICROSOFT_REDIRECT_URI,
    } = leerEntornoCalendario();

    const tokenRes = await fetch(
      `https://login.microsoftonline.com/${MICROSOFT_TENANT_ID ?? "common"}/oauth2/v2.0/token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: MICROSOFT_CLIENT_ID ?? "",
          client_secret: MICROSOFT_CLIENT_SECRET ?? "",
          code,
          redirect_uri: MICROSOFT_REDIRECT_URI ?? "",
          grant_type: "authorization_code",
          scope: SCOPES.join(" "),
        }),
      },
    );

    if (!tokenRes.ok) {
      const texto = await tokenRes.text();
      throw new ErrorCalendarioBase(`Token exchange failed: ${texto}`, "desconocido");
    }

    const tokens = (await tokenRes.json()) as {
      access_token: string;
      refresh_token: string;
      expires_in: number;
    };

    if (!tokens.refresh_token) {
      throw new ErrorCalendarioBase("Microsoft no devolvió un refresh token.", "desconocido");
    }

    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);
    const prisma = obtenerPrisma();
    await prisma.cuentaCalendario.upsert({
      where: { proveedor_usuarioId: { proveedor: "MICROSOFT", usuarioId: USUARIO_ID } },
      create: {
        proveedor: "MICROSOFT",
        usuarioId: USUARIO_ID,
        accessTokenCifrado: tokens.access_token ? cifrar(tokens.access_token) : null,
        refreshTokenCifrado: cifrar(tokens.refresh_token),
        expiresAt,
        scope: SCOPES.join(" "),
      },
      update: {
        accessTokenCifrado: tokens.access_token ? cifrar(tokens.access_token) : null,
        refreshTokenCifrado: cifrar(tokens.refresh_token),
        expiresAt,
      },
    });
  }

  // Recupera tokens de la BD y configura el cliente
  private async configurarCliente(): Promise<void> {
    const cuenta = await obtenerPrisma().cuentaCalendario.findUnique({
      where: { proveedor_usuarioId: { proveedor: "MICROSOFT", usuarioId: USUARIO_ID } },
    });
    if (!cuenta || !cuenta.refreshTokenCifrado) {
      throw new ErrorCalendarioBase("Cuenta de Microsoft no conectada.", "no-configurado");
    }
    const { accessToken, refreshToken } = descifrarTokens(
      cuenta.accessTokenCifrado,
      cuenta.refreshTokenCifrado,
    );
    this.client = this.crearCliente(accessToken, refreshToken);
  }

  // Renueva el access token usando el refresh token
  private async renovarToken(): Promise<void> {
    const cuenta = await obtenerPrisma().cuentaCalendario.findUnique({
      where: { proveedor_usuarioId: { proveedor: "MICROSOFT", usuarioId: USUARIO_ID } },
    });
    if (!cuenta || !cuenta.refreshTokenCifrado) {
      throw new ErrorCalendarioBase("Cuenta de Microsoft no conectada.", "no-configurado");
    }
    const { MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET, MICROSOFT_TENANT_ID } =
      leerEntornoCalendario();
    const refreshToken = descifrarToken(cuenta.refreshTokenCifrado);

    const tokenRes = await fetch(
      `https://login.microsoftonline.com/${MICROSOFT_TENANT_ID ?? "common"}/oauth2/v2.0/token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: MICROSOFT_CLIENT_ID ?? "",
          client_secret: MICROSOFT_CLIENT_SECRET ?? "",
          refresh_token: refreshToken,
          grant_type: "refresh_token",
          scope: SCOPES.join(" "),
        }),
      },
    );

    if (!tokenRes.ok) {
      const texto = await tokenRes.text();
      throw new ErrorCalendarioBase(`Token refresh failed: ${texto}`, "accesso-revocado");
    }

    const tokens = (await tokenRes.json()) as {
      access_token: string;
      refresh_token: string;
      expires_in: number;
    };

    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);
    await obtenerPrisma().cuentaCalendario.update({
      where: { proveedor_usuarioId: { proveedor: "MICROSOFT", usuarioId: USUARIO_ID } },
      data: {
        accessTokenCifrado: tokens.access_token ? cifrar(tokens.access_token) : undefined,
        refreshTokenCifrado: cifrar(tokens.refresh_token),
        expiresAt,
      },
    });

    this.client = this.crearCliente(tokens.access_token, tokens.refresh_token);
  }

  private buildError(e: unknown): ErrorCalendario {
    if (e instanceof ErrorCalendarioBase) return e;
    const mensaje = e instanceof Error ? e.message : "Error desconocido";
    if (mensaje.includes("no-configurado")) {
      return new ErrorCalendarioBase(mensaje, "no-configurado");
    }
    if (mensaje.includes("invalid_grant") || mensaje.includes("Token has been expired")) {
      return new ErrorCalendarioBase("Token de acceso revocado o vencido.", "accesso-revocado");
    }
    if (mensaje.includes("ENOTFOUND") || mensaje.includes("ECONNREFUSED")) {
      return new ErrorCalendarioBase("Sin conexión a internet.", "sin-conexion");
    }
    return new ErrorCalendarioBase(mensaje, "desconocido");
  }

  async listarEventos(fechaInicio: Date, fechaFin: Date): Promise<EventoCalendario[]> {
    if (!this.estaConfigurado()) {
      throw new ErrorCalendarioBase(
        "Variables de Microsoft Calendar no configuradas.",
        "no-configurado",
      );
    }
    try {
      await this.configurarCliente();
      if (!this.client) throw new ErrorCalendarioBase("Cliente no inicializado.", "no-configurado");

      const respuesta = await this.client
        .api("/me/events")
        .select("id,subject,body,start,end,onlineMeeting")
        .query({
          $filter: `start/ge '${fechaInicio.toISOString()}' and end/le '${fechaFin.toISOString()}'`,
          $top: "250",
          $orderby: "start/dateTime asc",
        })
        .get();

      return (
        (respuesta.value ?? []) as {
          id: string;
          subject: string;
          body: { preview: string };
          start: { dateTime: string; timeZone: string };
          end: { dateTime: string; timeZone: string };
          onlineMeeting: { joinUrl: string } | null;
        }[]
      ).map((evento) => ({
        idExterno: evento.id ?? "",
        titulo: evento.subject ?? "Sin título",
        descripcion: evento.body?.preview ?? undefined,
        inicio: new Date(evento.start?.dateTime ?? Date.now()),
        fin: new Date(evento.end?.dateTime ?? Date.now()),
        enlaceReunion: evento.onlineMeeting?.joinUrl ?? undefined,
      }));
    } catch (e) {
      throw this.buildError(e);
    }
  }

  async crearEvento(datos: DatosEvento): Promise<EventoCalendario> {
    if (!this.estaConfigurado()) {
      throw new ErrorCalendarioBase(
        "Variables de Microsoft Calendar no configuradas.",
        "no-configurado",
      );
    }
    try {
      await this.configurarCliente();
      if (!this.client) throw new ErrorCalendarioBase("Cliente no inicializado.", "no-configurado");

      const creado = await this.client.api("/me/events").post({
        subject: datos.titulo,
        body: { contentType: "text", content: datos.descripcion ?? "" },
        start: { dateTime: datos.inicio.toISOString(), timeZone: "UTC" },
        end: { dateTime: datos.fin.toISOString(), timeZone: "UTC" },
        isOnlineMeeting: true,
        onlineMeetingProvider: "teamsForBusiness",
      } as Record<string, unknown>);

      return {
        idExterno: creado.id ?? "",
        titulo: creado.subject ?? datos.titulo,
        descripcion: creado.body?.preview ?? undefined,
        inicio: new Date(creado.start?.dateTime ?? datos.inicio),
        fin: new Date(creado.end?.dateTime ?? datos.fin),
        enlaceReunion: creado.onlineMeeting?.joinUrl ?? undefined,
      };
    } catch (e) {
      throw this.buildError(e);
    }
  }

  async refreshTokens(): Promise<void> {
    try {
      await this.renovarToken();
    } catch (e) {
      throw this.buildError(e);
    }
  }

  estaConfigurado(): boolean {
    const { MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET } = leerEntornoCalendario();
    return Boolean(MICROSOFT_CLIENT_ID && MICROSOFT_CLIENT_SECRET);
  }
}

// Instancia compartida para usar en Server Actions
let instancia: MicrosoftProveedor | null = null;

export function obtenerMicrosoftProveedor(): MicrosoftProveedor {
  instancia ??= new MicrosoftProveedor();
  return instancia;
}
