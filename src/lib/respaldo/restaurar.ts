// Restaura la base de datos desde un archivo SQL (comprimido o no)
import { execSync } from "node:child_process";
import { createGunzip } from "node:zlib";
import { leerEntornoBaseDatos } from "@/lib/env";
import { z } from "zod";

const esquemaRestore = z.object({
  DATABASE_URL_RESTORE: z.string().optional(),
});

type Fuente = Record<string, string | undefined>;

function leerEntornoRestore(fuente: Fuente = process.env) {
  const resultado = esquemaRestore.safeParse(fuente);
  if (!resultado.success) {
    throw new Error("DATABASE_URL_RESTORE no está configurada.");
  }
  return resultado.data;
}

export async function restaurarDesdeSql(sql: Buffer): Promise<void> {
  const { DATABASE_URL_RESTORE } = leerEntornoRestore();

  if (!DATABASE_URL_RESTORE) {
    throw new Error("DATABASE_URL_RESTORE no está configurada.");
  }

  let comando: string;
  if (sql.slice(0, 2).toString() === "\x1f\x8b") {
    // gzip magic number
    const descomprimido = await new Promise<Buffer>((resolve, reject) => {
      const gunzip = createGunzip();
      const chunks: Buffer[] = [];
      gunzip.on("data", (chunk) => chunks.push(chunk));
      gunzip.on("end", () => resolve(Buffer.concat(chunks)));
      gunzip.on("error", reject);
      gunzip.write(sql);
      gunzip.end();
    });
    comando = `psql "${DATABASE_URL_RESTORE}"`;
    execSync(comando, { input: descomprimido, maxBuffer: 1024 * 1024 * 512 });
  } else {
    comando = `psql "${DATABASE_URL_RESTORE}"`;
    execSync(comando, { input: sql, maxBuffer: 1024 * 1024 * 512 });
  }
}
