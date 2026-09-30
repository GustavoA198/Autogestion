// Credenciales exclusivas de las pruebas; se crean en la base al arrancar la suite
export const USUARIO_E2E = "usuario-e2e";
export const CLAVE_E2E = "clave-e2e-de-pruebas-2026";

// Archivo donde el proyecto de preparación guarda la sesión que reutiliza el resto de pruebas
export const ARCHIVO_SESION = "e2e/.auth/sesion.json";

// IP simulada aleatoria para que cada prueba tenga su propio contador del limitador
export function ipAleatoria(): string {
  const octeto = () => Math.floor(Math.random() * 254) + 1;
  return `10.${octeto()}.${octeto()}.${octeto()}`;
}
