// Genera un volcado SQL de la base de datos usando pg_dump y lo comprime con gzip
import { execSync } from "node:child_process";
import { createGzip } from "node:zlib";
import { leerEntornoBaseDatos } from "@/lib/env";

export async function generarVolcadoSql(): Promise<Buffer> {
  const { DATABASE_URL } = leerEntornoBaseDatos();

  let dump: Buffer;
  try {
    dump = execSync(`pg_dump --no-owner --no-acl "${DATABASE_URL}"`, {
      encoding: "buffer",
      maxBuffer: 1024 * 1024 * 512, // 512 MB max
    });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes("ENOENT") || error.message.includes("not found"))
    ) {
      throw new Error(
        "pg_dump no disponible; en este entorno (Vercel) el respaldo debe apoyarse en otra via",
      );
    }
    throw error;
  }

  // Comprime con gzip
  const buffer = await new Promise<Buffer>((resolve, reject) => {
    const gzip = createGzip();
    const chunks: Buffer[] = [];
    gzip.on("data", (chunk) => chunks.push(chunk));
    gzip.on("end", () => resolve(Buffer.concat(chunks)));
    gzip.on("error", reject);
    gzip.write(dump);
    gzip.end();
  });

  return buffer;
}
