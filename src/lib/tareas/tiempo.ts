import { z } from "zod";
import { ZONA_PREDETERMINADA, zonaValida } from "@/lib/calendario/fechas";

const esquemaTiempo = z.object({
  TZ: z.string().default(ZONA_PREDETERMINADA),
});

export type EntornoTiempo = z.infer<typeof esquemaTiempo>;

// Zod acepta cualquier cadena, pero una zona que Intl no reconoce revienta al construir el formateador
export function leerEntornoTiempo(
  fuente: Record<string, string | undefined> = process.env,
): EntornoTiempo {
  const resultado = esquemaTiempo.safeParse(fuente);
  const zona = resultado.success ? resultado.data.TZ : "";
  return { TZ: zonaValida(zona) ? zona : ZONA_PREDETERMINADA };
}
