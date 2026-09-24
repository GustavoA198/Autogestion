// Reemplaza o agrega variables en el contenido de un .env conservando lo demás
export function actualizarEnv(contenido: string, pares: Record<string, string>): string {
  const saltoDeLinea = contenido.includes("\r\n") ? "\r\n" : "\n";
  const lineas = contenido === "" ? [] : contenido.replace(/\r?\n$/, "").split(/\r?\n/);
  const pendientes = new Map(Object.entries(pares));

  const resultado = lineas.map((linea) => {
    const clave = /^([A-Z0-9_]+)=/.exec(linea)?.[1];
    if (clave && pendientes.has(clave)) {
      const valor = pendientes.get(clave);
      pendientes.delete(clave);
      return `${clave}=${valor}`;
    }
    return linea;
  });

  for (const [clave, valor] of pendientes) resultado.push(`${clave}=${valor}`);
  return resultado.join(saltoDeLinea) + saltoDeLinea;
}

export function leerVariable(contenido: string, nombre: string): string | undefined {
  return new RegExp(`^${nombre}=(.*)$`, "m").exec(contenido)?.[1]?.trim() || undefined;
}
