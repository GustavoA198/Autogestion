// Registra el alias @/ y carga el .env para que los scripts usen los módulos de la aplicación
import "dotenv/config";
import { fileURLToPath } from "node:url";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url, {
  alias: { "@": fileURLToPath(new URL("../src/", import.meta.url)) },
});

await jiti.import("./crear-usuario.mts");
