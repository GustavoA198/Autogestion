import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { actualizarEnv, leerVariable } from "../src/lib/auth/archivo-env.ts";
import { generarHash } from "../src/lib/auth/clave.ts";

const ARCHIVO_ENV = ".env";
const LARGO_MINIMO_CLAVE = 12;
const FORMATO_USUARIO = /^[\w.@-]{3,50}$/;

// Lee una línea sin mostrarla en pantalla ni dejarla en el historial
function preguntarOculto(pregunta: string): Promise<string> {
  stdout.write(pregunta);
  stdin.setRawMode(true);
  stdin.resume();
  stdin.setEncoding("utf8");

  return new Promise((resolver) => {
    let valor = "";
    const alRecibir = (tecla: string) => {
      for (const caracter of tecla) {
        if (caracter === "\u0003") process.exit(130);
        if (caracter === "\r" || caracter === "\n") {
          stdin.setRawMode(false);
          stdin.pause();
          stdin.off("data", alRecibir);
          stdout.write("\n");
          return resolver(valor);
        }
        valor = caracter === "\u007f" || caracter === "\b" ? valor.slice(0, -1) : valor + caracter;
      }
    };
    stdin.on("data", alRecibir);
  });
}

async function principal() {
  if (!stdin.isTTY) {
    console.error("Ejecuta este comando en una terminal interactiva.");
    process.exit(1);
  }

  const lector = createInterface({ input: stdin, output: stdout });
  const usuario = (await lector.question("Usuario: ")).trim();
  lector.close();

  if (!FORMATO_USUARIO.test(usuario)) {
    console.error("El usuario debe tener de 3 a 50 caracteres: letras, números, . _ @ -");
    process.exit(1);
  }

  const clave = await preguntarOculto(`Contraseña (mínimo ${LARGO_MINIMO_CLAVE} caracteres): `);
  if (clave.length < LARGO_MINIMO_CLAVE) {
    console.error(`La contraseña debe tener al menos ${LARGO_MINIMO_CLAVE} caracteres.`);
    process.exit(1);
  }

  const confirmacion = await preguntarOculto("Repite la contraseña: ");
  if (clave !== confirmacion) {
    console.error("Las contraseñas no coinciden.");
    process.exit(1);
  }

  const actual = existsSync(ARCHIVO_ENV) ? readFileSync(ARCHIVO_ENV, "utf8") : "";
  const puerto = leerVariable(actual, "APP_PUERTO") ?? "3000";

  const pares: Record<string, string> = {
    AUTH_USUARIO: usuario,
    AUTH_CLAVE_HASH: await generarHash(clave),
  };
  if (!leerVariable(actual, "NEXTAUTH_SECRET"))
    pares.NEXTAUTH_SECRET = randomBytes(48).toString("hex");
  if (!leerVariable(actual, "NEXTAUTH_URL")) pares.NEXTAUTH_URL = `http://localhost:${puerto}`;

  writeFileSync(ARCHIVO_ENV, actualizarEnv(actual, pares));
  console.log(`Acceso configurado para "${usuario}" en ${ARCHIVO_ENV}.`);
}

await principal();
