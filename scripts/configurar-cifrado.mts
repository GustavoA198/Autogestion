import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { actualizarEnv, leerVariable } from "../src/lib/auth/archivo-env.ts";

const ARCHIVO_ENV = ".env";

const actual = existsSync(ARCHIVO_ENV) ? readFileSync(ARCHIVO_ENV, "utf8") : "";

// Nunca se sobrescribe: con otra clave los secretos ya guardados serían irrecuperables
if (leerVariable(actual, "CLAVE_CIFRADO")) {
  console.log(`CLAVE_CIFRADO ya existe en ${ARCHIVO_ENV}; no se modificó.`);
  console.log("Si la cambias, los secretos guardados dejarán de poder descifrarse.");
  process.exit(0);
}

writeFileSync(
  ARCHIVO_ENV,
  actualizarEnv(actual, { CLAVE_CIFRADO: randomBytes(32).toString("base64") }),
);
console.log(`Clave de cifrado generada en ${ARCHIVO_ENV}.`);
console.log("Respáldala fuera del repositorio: sin ella los secretos son irrecuperables.");
