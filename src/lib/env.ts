import { z } from "zod";

const esquema = z.object({
  DATABASE_URL: z.string().regex(/^postgres(ql)?:\/\//, "debe ser una URL de PostgreSQL"),
});

export type Entorno = z.infer<typeof esquema>;

// Valida las variables de entorno y falla con un mensaje claro si faltan o son inválidas
export function leerEntorno(fuente: Record<string, string | undefined> = process.env): Entorno {
  const resultado = esquema.safeParse(fuente);

  if (!resultado.success) {
    const campos = resultado.error.issues.map((problema) => problema.path.join(".")).join(", ");
    throw new Error(`Variables de entorno inválidas o ausentes: ${campos}`);
  }

  return resultado.data;
}
