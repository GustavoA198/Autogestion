// Interfaz común de los proveedores de calendario: permite sumar Microsoft sin tocar la lógica de Google.

export type DatosEvento = {
  idExterno?: string;
  titulo: string;
  descripcion?: string;
  inicio: Date;
  fin: Date;
  enlaceReunion?: string;
};

export type InvitadoEvento = {
  nombre?: string;
  email?: string;
  respuesta?: string;
  organizador?: boolean;
  opcional?: boolean;
};

export type EventoCalendario = {
  idExterno: string;
  titulo: string;
  descripcion?: string;
  inicio: Date;
  fin: Date;
  enlaceReunion?: string;
  enlaceEvento?: string;
  ubicacion?: string;
  organizador?: string;
  estado?: string;
  diaCompleto?: boolean;
  invitados?: InvitadoEvento[];
};

// Devuelve la URL solo si usa http o https; evita esquemas peligrosos como javascript:
export function enlaceSeguro(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:" ? u.toString() : undefined;
  } catch {
    return undefined;
  }
}

// Error controlado que la UI puede detectar sin crashear la app
export class ErrorCalendario extends Error {
  constructor(
    mensaje: string,
    public readonly codigo:
      "no-configurado" | "token-vencido" | "sin-conexion" | "accesso-revocado" | "desconocido",
  ) {
    super(mensaje);
    this.name = "ErrorCalendario";
  }
}

// Resultado de una lectura incremental: eventos nuevos o modificados e ids cancelados desde el token
export type CambiosCalendario = {
  eventos: EventoCalendario[];
  cancelados: string[];
  nextSyncToken: string | null;
  // Verdadero cuando se leyó todo desde cero (sin token, o el token venció)
  esCompleta: boolean;
};

export interface ProveedorCalendario {
  // Lista eventos en el rango dado; lanza ErrorCalendario si no está configurado o hay error de red
  listarEventos(fechaInicio: Date, fechaFin: Date): Promise<EventoCalendario[]>;

  // Opcional: lee solo los cambios desde syncToken; sin token hace la carga completa desde `desde`
  listarCambios?(syncToken: string | null | undefined, desde: Date): Promise<CambiosCalendario>;

  // Crea un evento; devuelve el evento con el idExterno asignado por el proveedor
  crearEvento(datos: DatosEvento): Promise<EventoCalendario>;

  // Renueva el token de acceso usando el refresh token guardado
  refreshTokens(): Promise<void>;

  // Indica si la cuenta está configurada (tokens presentes y válidos)
  estaConfigurado(): boolean;
}
