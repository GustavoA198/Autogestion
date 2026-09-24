import { z } from "zod";

const esquemaTiempo = z.object({
  TZ: z.string().default("America/Bogota"),
});

export type EntornoTiempo = z.infer<typeof esquemaTiempo>;

export function leerEntornoTiempo(
  fuente: Record<string, string | undefined> = process.env,
): EntornoTiempo {
  const resultado = esquemaTiempo.safeParse(fuente);
  if (!resultado.success) {
    // Fallback seguro
    return { TZ: "America/Bogota" };
  }
  return resultado.data;
}
