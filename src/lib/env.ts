import { z } from "zod";

type Fuente = Record<string, string | undefined>;

const FORMATO_HASH = /^scrypt:\d+:\d+:\d+:[\w-]+:[\w-]+$/;

const esquemaBaseDatos = z.object({
  DATABASE_URL: z.string().regex(/^postgres(ql)?:\/\//, "debe ser una URL de PostgreSQL"),
});

const esquemaAuth = z.object({
  AUTH_USUARIO: z.string().min(3, "mínimo 3 caracteres"),
  AUTH_CLAVE_HASH: z
    .string()
    .regex(FORMATO_HASH, "no tiene el formato generado por auth:configurar"),
  NEXTAUTH_SECRET: z.string().min(32, "mínimo 32 caracteres"),
  NEXTAUTH_URL: z.url("debe ser una URL válida"),
});

export type EntornoBaseDatos = z.infer<typeof esquemaBaseDatos>;
export type EntornoAuth = z.infer<typeof esquemaAuth>;

// Falla con un mensaje claro que nombra las variables inválidas, sin revelar sus valores
function validar<T>(esquema: z.ZodType<T>, fuente: Fuente): T {
  const resultado = esquema.safeParse(fuente);

  if (!resultado.success) {
    const campos = resultado.error.issues.map((problema) => problema.path.join(".")).join(", ");
    throw new Error(`Variables de entorno inválidas o ausentes: ${campos}`);
  }

  return resultado.data;
}

export function leerEntornoBaseDatos(fuente: Fuente = process.env): EntornoBaseDatos {
  return validar(esquemaBaseDatos, fuente);
}

export function leerEntornoAuth(fuente: Fuente = process.env): EntornoAuth {
  return validar(esquemaAuth, fuente);
}

const LARGO_CLAVE_CIFRADO = 32;

const esquemaCifrado = z.object({
  CLAVE_CIFRADO: z
    .string()
    .regex(/^[A-Za-z0-9+/]+={0,2}$/, "debe estar en base64")
    .transform((valor) => Buffer.from(valor, "base64"))
    .refine((clave) => clave.length === LARGO_CLAVE_CIFRADO, "debe decodificar a 32 bytes"),
});

export type EntornoCifrado = z.infer<typeof esquemaCifrado>;

export function leerEntornoCifrado(fuente: Fuente = process.env): EntornoCifrado {
  return validar(esquemaCifrado, fuente);
}

const esquemaCalendario = z.object({
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI: z
    .string()
    .optional()
    .transform((v) => v ?? "http://localhost:3100/api/calendario/google/callback"),
});

export type EntornoCalendario = z.infer<typeof esquemaCalendario>;

export function leerEntornoCalendario(fuente: Fuente = process.env): EntornoCalendario {
  return esquemaCalendario.parse(fuente);
}
