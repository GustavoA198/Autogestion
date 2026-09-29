// Evento de ventana que avisa a la interfaz que terminó una sincronización automática del calendario.
export const EVENTO_CALENDARIO_SINCRONIZADO = "calendario:sincronizado";

export type DetalleSincronizacion = {
  proveedor: "GOOGLE" | "MICROSOFT";
  huboCambios: boolean;
  // Fecha ISO de la última sincronización de la cuenta
  ultimaSincronizacion: string | null;
};

export function avisarCalendarioSincronizado(detalle: DetalleSincronizacion): void {
  window.dispatchEvent(
    new CustomEvent<DetalleSincronizacion>(EVENTO_CALENDARIO_SINCRONIZADO, { detail: detalle }),
  );
}
