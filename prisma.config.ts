import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  // Sin env() para que generate funcione sin base de datos durante el build
  datasource: { url: process.env["DATABASE_URL"] },
});
