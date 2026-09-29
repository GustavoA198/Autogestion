// Escalas y formato de la gráfica: ejes con marcas redondas, formato es-CO y medidas de texto.

const FORMATO = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 2 });

export function formatearNumero(valor: number): string {
  return FORMATO.format(valor);
}

// Valor con su unidad: "8 tareas", "1 tarea", "45%"
export function formatearConUnidad(valor: number, unidad: string, singular: string): string {
  const numero = formatearNumero(valor);
  if (unidad === "%") return `${numero}%`;
  return `${numero} ${valor === 1 ? singular : unidad}`;
}

// Ancho aproximado de un texto en píxeles para decidir si cabe sin solaparse
export function anchoTexto(texto: string, tamano = 11): number {
  return texto.length * tamano * 0.6;
}

// Recorta un texto largo con puntos suspensivos según los píxeles disponibles
export function recortarTexto(texto: string, pixeles: number, tamano = 11): string {
  const maximo = Math.max(3, Math.floor(pixeles / (tamano * 0.6)));
  return texto.length <= maximo ? texto : `${texto.slice(0, Math.max(1, maximo - 1))}…`;
}

export type EjeValores = { tope: number; marcas: number[] };

// Eje con marcas redondas; con datos enteros las marcas también lo son
export function crearEje(maximo: number, entero: boolean, fijo?: number): EjeValores {
  if (fijo !== undefined && fijo > 0) {
    return { tope: fijo, marcas: [0, 1, 2, 3, 4].map((i) => (fijo / 4) * i) };
  }
  if (!(maximo > 0)) return { tope: entero ? 4 : 1, marcas: entero ? [0, 2, 4] : [0, 0.5, 1] };
  const bruto = maximo / 4;
  const exponente = 10 ** Math.floor(Math.log10(bruto));
  const fraccion = bruto / exponente;
  let paso = (fraccion <= 1 ? 1 : fraccion <= 2 ? 2 : fraccion <= 5 ? 5 : 10) * exponente;
  if (entero) paso = Math.max(1, Math.ceil(paso));
  const cantidad = Math.ceil(maximo / paso - 1e-9);
  const marcas = Array.from({ length: cantidad + 1 }, (_, i) => Number((i * paso).toFixed(6)));
  return { tope: marcas[marcas.length - 1], marcas };
}

// Cada cuántas categorías se muestra una etiqueta para que no se solapen
export function pasoEtiquetas(banda: number, anchoEtiqueta: number): number {
  return Math.max(1, Math.ceil((anchoEtiqueta + 6) / Math.max(banda, 1)));
}
