import { createHash, randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from "node:crypto";

// Parámetros de scrypt recomendados por OWASP (N=2^15, r=8, p=3)
export const PARAMETROS_CLAVE = { log2N: 15, r: 8, p: 3 } as const;

const LARGO_SAL = 16;
const LARGO_HASH = 32;

function derivar(clave: string, sal: Buffer, largo: number, opciones: ScryptOptions) {
  return new Promise<Buffer>((resolver, rechazar) => {
    scrypt(clave, sal, largo, opciones, (error, derivada) =>
      error ? rechazar(error) : resolver(derivada),
    );
  });
}

function opcionesDe(log2N: number, r: number, p: number): ScryptOptions {
  const N = 2 ** log2N;
  return { N, r, p, maxmem: 256 * N * r };
}

// Devuelve "scrypt:log2N:r:p:sal:hash" sin caracteres que rompan un archivo .env
export async function generarHash(clave: string): Promise<string> {
  const { log2N, r, p } = PARAMETROS_CLAVE;
  const sal = randomBytes(LARGO_SAL);
  const hash = await derivar(clave, sal, LARGO_HASH, opcionesDe(log2N, r, p));
  return ["scrypt", log2N, r, p, sal.toString("base64url"), hash.toString("base64url")].join(":");
}

function leerHash(almacenado: string) {
  const partes = almacenado.split(":");
  if (partes.length !== 6 || partes[0] !== "scrypt") return null;

  const [log2N, r, p] = partes.slice(1, 4).map(Number);
  const sal = Buffer.from(partes[4], "base64url");
  const hash = Buffer.from(partes[5], "base64url");

  const parametrosValidos =
    Number.isInteger(log2N) &&
    log2N >= 10 &&
    log2N <= 20 &&
    Number.isInteger(r) &&
    r >= 1 &&
    r <= 32 &&
    Number.isInteger(p) &&
    p >= 1 &&
    p <= 16;

  if (!parametrosValidos || sal.length < 8 || hash.length < 16) return null;
  return { log2N, r, p, sal, hash };
}

// Compara en tiempo constante; un hash mal formado nunca autentica
export async function verificarClave(clave: string, almacenado: string): Promise<boolean> {
  const datos = leerHash(almacenado);
  if (!datos) return false;

  const derivada = await derivar(
    clave,
    datos.sal,
    datos.hash.length,
    opcionesDe(datos.log2N, datos.r, datos.p),
  );
  return timingSafeEqual(derivada, datos.hash);
}

// Compara textos en tiempo constante sin filtrar su longitud
export function igualesSeguro(a: string, b: string): boolean {
  const resumen = (texto: string) => createHash("sha256").update(texto).digest();
  return timingSafeEqual(resumen(a), resumen(b));
}
