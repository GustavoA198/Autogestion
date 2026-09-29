// Evento de ventana que avisa a la cabecera que cambiaron las notificaciones pendientes.
export const EVENTO_NOTIFICACIONES_CAMBIARON = "notificaciones:cambiaron";

export function avisarCambioNotificaciones(): void {
  window.dispatchEvent(new Event(EVENTO_NOTIFICACIONES_CAMBIARON));
}
