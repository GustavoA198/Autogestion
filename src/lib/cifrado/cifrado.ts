import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { leerEntornoCifrado } from "@/lib/env";

const ALGORITMO = "aes-256-gcm";
const VERSION = "v1";
const LARGO_IV = 12;
const LARGO_ETIQUETA = 16;
const ERROR_DESCIFRADO = "No se pudo descifrar el secreto: dato dañado o clave incorrecta.";

// Clave de 32 bytes leída del entorno en cada uso, sin conservarla en memoria del módulo
function claveActual(): Buffer {
  return leerEntornoCifrado().CLAVE_CIFRADO;
}

// Formato almacenado: v1:iv:etiqueta:cifrado, todo en base64url para poder rotar la versión después
export function cifrar(texto: string, clave: Buffer = claveActual()): string {
  const iv = randomBytes(LARGO_IV);
  const cifrador = createCipheriv(ALGORITMO, clave, iv, { authTagLength: LARGO_ETIQUETA });
  const cifrado = Buffer.concat([cifrador.update(texto, "utf8"), cifrador.final()]);
  const partes = [iv, cifrador.getAuthTag(), cifrado].map((parte) => parte.toString("base64url"));
  return [VERSION, ...partes].join(":");
}

// Cualquier fallo lanza un error genérico que nunca incluye el texto cifrado ni el descifrado
export function descifrar(almacenado: string, clave: Buffer = claveActual()): string {
  try {
    const [version, iv, etiqueta, cifrado, sobrante] = almacenado.split(":");
    if (
      version !== VERSION ||
      !iv ||
      !etiqueta ||
      cifrado === undefined ||
      sobrante !== undefined
    ) {
      throw new Error("formato");
    }
    const descifrador = createDecipheriv(ALGORITMO, clave, Buffer.from(iv, "base64url"), {
      authTagLength: LARGO_ETIQUETA,
    });
    descifrador.setAuthTag(Buffer.from(etiqueta, "base64url"));
    return Buffer.concat([
      descifrador.update(Buffer.from(cifrado, "base64url")),
      descifrador.final(),
    ]).toString("utf8");
  } catch {
    throw new Error(ERROR_DESCIFRADO);
  }
}
