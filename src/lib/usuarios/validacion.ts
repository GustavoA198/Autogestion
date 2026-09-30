// Reglas de formato del usuario y de su contraseña; sin acceso a la base

// Letras, números y . _ @ -; evita espacios y caracteres que rompen la línea de comando
export const FORMATO_USUARIO = /^[\w.@-]{3,50}$/;

// Mínimo heredado del acceso por variable de entorno
export const LARGO_MINIMO_CLAVE = 12;

export type CampoClave = "actual" | "nueva" | "confirmacion";
export type ErroresClave = Partial<Record<CampoClave, string>>;

export type DatosCambioClave = { actual: string; nueva: string };

export type ResultadoValidacionClave =
  | { ok: true; datos: DatosCambioClave }
  | { ok: false; errores: ErroresClave };

function comoTexto(valor: unknown): string {
  return typeof valor === "string" ? valor : "";
}

export function validarNombreUsuario(nombre: unknown): string | null {
  const limpio = comoTexto(nombre).trim();
  if (!FORMATO_USUARIO.test(limpio)) {
    return "El usuario debe tener de 3 a 50 caracteres: letras, números, . _ @ -";
  }
  return null;
}

export function validarClaveNueva(clave: unknown): string | null {
  const limpio = comoTexto(clave);
  if (limpio.length < LARGO_MINIMO_CLAVE) {
    return `La contraseña debe tener al menos ${LARGO_MINIMO_CLAVE} caracteres.`;
  }
  return null;
}

// La clave nueva se compara con la actual para impedir un cambio que no cambie nada
export function validarCambioClave(entrada: {
  actual: unknown;
  nueva: unknown;
  confirmacion: unknown;
}): ResultadoValidacionClave {
  const actual = comoTexto(entrada.actual);
  const nueva = comoTexto(entrada.nueva);
  const confirmacion = comoTexto(entrada.confirmacion);
  const errores: ErroresClave = {};

  // Se evalúa el recorte para rechazar puros espacios, pero la clave se compara sin recortar
  if (!actual.trim()) {
    errores.actual = "Escribe tu contraseña actual.";
  }

  const errorNueva = validarClaveNueva(nueva);
  if (errorNueva) errores.nueva = errorNueva;
  else if (nueva === actual) errores.nueva = "La contraseña nueva debe ser distinta de la actual.";

  if (confirmacion !== nueva) errores.confirmacion = "Las contraseñas no coinciden.";

  if (Object.keys(errores).length > 0) return { ok: false, errores };
  return { ok: true, datos: { actual, nueva } };
}
