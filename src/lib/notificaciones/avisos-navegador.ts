// Avisos del navegador (Notification API) solo en cliente: preferencia, permiso y reuniones ya avisadas, con try/catch.

export const CLAVE_PREFERENCIA_AVISOS = "autogestion-avisos-navegador";
export const CLAVE_AVISADAS = "autogestion-avisos-avisadas";
export const EVENTO_AVISOS = "autogestion:avisos-navegador";
// Minutos de antelación con los que se avisa de una reunión
export const MINUTOS_ANTES_AVISO = 15;

const MS_MINUTO = 60_000;
const CONSERVAR_AVISADAS_MS = 24 * 60 * MS_MINUTO;

export type PermisoAvisos = "no-soportado" | "denegado" | "concedido" | "pendiente";

// Estado compuesto como texto para que useSyncExternalStore compare por valor
export type EstadoAvisos = `${PermisoAvisos}|${"1" | "0"}`;

export const ESTADO_AVISOS_SERVIDOR: EstadoAvisos = "no-soportado|0";

let preferenciaEnMemoria = false;

export function leerPermiso(): PermisoAvisos {
  if (typeof Notification === "undefined") return "no-soportado";
  if (Notification.permission === "granted") return "concedido";
  if (Notification.permission === "denied") return "denegado";
  return "pendiente";
}

function leerPreferencia(): boolean {
  try {
    const valor = localStorage.getItem(CLAVE_PREFERENCIA_AVISOS);
    if (valor === "1") return true;
    if (valor === "0") return false;
  } catch {
    // Se usa el respaldo en memoria
  }
  return preferenciaEnMemoria;
}

export function leerEstadoAvisos(): EstadoAvisos {
  return `${leerPermiso()}|${leerPreferencia() ? "1" : "0"}`;
}

// Los avisos se lanzan solo con permiso concedido y la preferencia encendida
export function avisosActivos(estado: EstadoAvisos): boolean {
  return estado === "concedido|1";
}

export function guardarPreferenciaAvisos(activa: boolean): void {
  preferenciaEnMemoria = activa;
  try {
    localStorage.setItem(CLAVE_PREFERENCIA_AVISOS, activa ? "1" : "0");
  } catch {
    // La preferencia queda solo en memoria durante esta visita
  }
  window.dispatchEvent(new Event(EVENTO_AVISOS));
}

export function suscribirseALosAvisos(alCambiar: () => void): () => void {
  window.addEventListener(EVENTO_AVISOS, alCambiar);
  window.addEventListener("storage", alCambiar);
  // El permiso puede cambiar desde la configuración del navegador
  window.addEventListener("focus", alCambiar);
  return () => {
    window.removeEventListener(EVENTO_AVISOS, alCambiar);
    window.removeEventListener("storage", alCambiar);
    window.removeEventListener("focus", alCambiar);
  };
}

// Pide el permiso: debe llamarse solo desde un gesto del usuario (clic)
export async function solicitarPermisoAvisos(): Promise<PermisoAvisos> {
  if (typeof Notification === "undefined") return "no-soportado";
  try {
    await Notification.requestPermission();
  } catch {
    // Algunos navegadores antiguos no devuelven promesa; se lee el permiso resultante
  }
  const permiso = leerPermiso();
  guardarPreferenciaAvisos(permiso === "concedido");
  return permiso;
}

type Avisadas = Record<string, number>;

function leerAvisadas(): Avisadas {
  try {
    const crudo = localStorage.getItem(CLAVE_AVISADAS);
    if (!crudo) return {};
    const dato: unknown = JSON.parse(crudo);
    if (dato && typeof dato === "object" && !Array.isArray(dato)) return dato as Avisadas;
  } catch {
    // Sin registro legible se considera que no hay avisos previos
  }
  return {};
}

// Clave por reunión e inicio: si la reunión se reprograma vuelve a avisar
export function claveAviso(id: string, inicio: string): string {
  return `${id}|${inicio}`;
}

export function yaAvisada(clave: string): boolean {
  return clave in leerAvisadas();
}

// Registra la reunión como avisada y descarta registros antiguos
export function marcarAvisada(clave: string, ahora: number): void {
  const vigentes: Avisadas = {};
  for (const [existente, cuando] of Object.entries(leerAvisadas())) {
    if (ahora - cuando < CONSERVAR_AVISADAS_MS) vigentes[existente] = cuando;
  }
  vigentes[clave] = ahora;
  try {
    localStorage.setItem(CLAVE_AVISADAS, JSON.stringify(vigentes));
  } catch {
    // Sin almacenamiento el aviso puede repetirse tras recargar; la etiqueta del aviso lo acota
  }
}

// Minutos que faltan para la reunión (redondeados hacia arriba) o null si no toca avisar
export function minutosParaAvisar(inicioMs: number, ahoraMs: number): number | null {
  const faltan = inicioMs - ahoraMs;
  if (faltan <= 0 || faltan > MINUTOS_ANTES_AVISO * MS_MINUTO) return null;
  return Math.max(1, Math.ceil(faltan / MS_MINUTO));
}
