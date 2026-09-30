import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  // Sin env() para que generate funcione sin base de datos durante el build
  // La CLI usa la conexión directa: el pooler en modo transacción no sostiene las advisory locks de las migraciones
  // En Prisma 7 la directa va en url, no en directUrl, porque el pooler solo lo usa la aplicación en runtime
  datasource: { url: process.env["DIRECT_URL"] ?? process.env["DATABASE_URL"] },
});
