// Crea el usuario de acceso o recupera el acceso si ya existe; la contraseña solo se hashea
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { actualizarEnv, eliminarVariables, leerVariable } from "@/lib/auth/archivo-env";
import { actualizarClave, crearUsuario, obtenerUsuarioPorNombre } from "@/lib/usuarios/operaciones";
import { LARGO_MINIMO_CLAVE, validarClaveNueva, validarNombreUsuario } from "@/lib/usuarios/validacion";

const ARCHIVO_ENV = ".env";

// Credenciales del diseño por variable de entorno: ya no aplican y no deben quedar en el .env
const VARIABLES_RETIRADAS = ["AUTH_USUARIO", "AUTH_CLAVE_HASH"];

// Ctrl+C y la tecla de borrado, escritas por código para que no se pierdan en el archivo
const TECLA_CANCELAR = String.fromCharCode(3);
const TECLA_BORRAR = String.fromCharCode(127);

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
        if (caracter === TECLA_CANCELAR) process.exit(130);
        if (caracter === "\r" || caracter === "\n") {
          stdin.setRawMode(false);
          stdin.pause();
          stdin.off("data", alRecibir);
          stdout.write("\n");
          return resolver(valor);
        }
        valor = caracter === TECLA_BORRAR || caracter === "\b" ? valor.slice(0, -1) : valor + caracter;
      }
    };
    stdin.on("data", alRecibir);
  });
}

async function preguntar(texto: string): Promise<string> {
  const lector = createInterface({ input: stdin, output: stdout });
  const respuesta = await lector.question(texto);
  lector.close();
  return respuesta.trim();
}

function fallar(mensaje: string): never {
  console.error(mensaje);
  process.exit(1);
}

// Genera lo que falte del entorno y borra las credenciales del diseño anterior
function escribirEntorno(): void {
  const actual = existsSync(ARCHIVO_ENV) ? readFileSync(ARCHIVO_ENV, "utf8") : "";
  const puerto = leerVariable(actual, "APP_PUERTO") ?? "3000";
  const pares: Record<string, string> = {};

  if (!leerVariable(actual, "NEXTAUTH_SECRET")) pares.NEXTAUTH_SECRET = randomBytes(48).toString("hex");
  if (!leerVariable(actual, "NEXTAUTH_URL")) pares.NEXTAUTH_URL = `http://localhost:${puerto}`;

  writeFileSync(ARCHIVO_ENV, actualizarEnv(eliminarVariables(actual, VARIABLES_RETIRADAS), pares));
}

async function principal() {
  if (!stdin.isTTY) fallar("Ejecuta este comando en una terminal interactiva.");

  const nombre = await preguntar("Usuario: ");
  const errorNombre = validarNombreUsuario(nombre);
  if (errorNombre) fallar(errorNombre);

  const clave = await preguntarOculto(`Contraseña (mínimo ${LARGO_MINIMO_CLAVE} caracteres): `);
  const errorClave = validarClaveNueva(clave);
  if (errorClave) fallar(errorClave);

  if (clave !== (await preguntarOculto("Repite la contraseña: "))) {
    fallar("Las contraseñas no coinciden.");
  }

  // Si el usuario ya existe esta es la vía de recuperación del acceso
  const previo = await obtenerUsuarioPorNombre(nombre);
  if (previo) {
    const acepta = await preguntar(`"${nombre}" ya existe. ¿Reemplazar su contraseña? (s/N): `);
    if (acepta.toLowerCase() !== "s") {
      console.log("No se cambió nada.");
      return;
    }
    await actualizarClave(previo.id, clave);
  } else {
    await crearUsuario(nombre, clave);
  }

  escribirEntorno();
  console.log(`Usuario "${nombre}" listo. Entra en /login con esa contraseña.`);
}

await principal();
