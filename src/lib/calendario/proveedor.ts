// Interfaz común para todos los proveedores de calendario (Google, Microsoft, etc.)
// Permite agregar Microsoft (HU-17) sin modificar la lógica de Google.

export type DatosEvento = {
  idExterno?: string;
  titulo: string;
  descripcion?: string;
  inicio: Date;
  fin: Date;
  enlaceReunion?: string;
};

export type EventoCalendario = {
  idExterno: string;
  titulo: string;
  descripcion?: string;
  inicio: Date;
  fin: Date;
  enlaceReunion?: string;
};

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

export interface ProveedorCalendario {
  // Lista eventos en el rango dado; lanza ErrorCalendario si no está configurado o hay error de red
  listarEventos(fechaInicio: Date, fechaFin: Date): Promise<EventoCalendario[]>;

  // Crea un evento; devuelve el evento con el idExterno asignado por el proveedor
  crearEvento(datos: DatosEvento): Promise<EventoCalendario>;

  // Renueva el token de acceso usando el refresh token guardado
  refreshTokens(): Promise<void>;

  // Indica si la cuenta está configurada (tokens presentes y válidos)
  estaConfigurado(): boolean;
}
