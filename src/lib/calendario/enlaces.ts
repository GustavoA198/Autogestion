// Funciones puras para detectar enlaces dentro del texto de un evento y convertir HTML a texto.
import { enlaceSeguro } from "./proveedor";

export type SegmentoTexto = { texto: string; url?: string };

const REGEX_URL = /https?:\/\/[^\s<>"']+/gi;
const PUNTUACION_FINAL = /[)\].,;:!?}'"]+$/;

const DOMINIOS_REUNION = [
  "meet.google.com",
  "teams.microsoft.com",
  "teams.live.com",
  "zoom.us",
  "zoom.com",
  "webex.com",
];

const ENTIDADES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&nbsp;": " ",
};

// Quita la puntuación pegada al final de una URL; conserva un paréntesis de cierre balanceado
function limpiarUrl(bruta: string): string {
  let url = bruta;
  while (PUNTUACION_FINAL.test(url)) {
    if (url.endsWith(")") && (url.match(/\(/g) ?? []).length >= (url.match(/\)/g) ?? []).length) {
      break;
    }
    url = url.slice(0, -1);
  }
  return url;
}

// Convierte HTML de descripción a texto plano conservando saltos de línea y href de los enlaces
export function htmlATexto(html: string): string {
  if (!/<[a-z!/][^>]*>/i.test(html)) return html;
  return html
    .replace(
      /<a\b[^>]*?href\s*=\s*["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi,
      (_m, href, interno) => {
        const visible = String(interno)
          .replace(/<[^>]*>/g, "")
          .trim();
        return visible && visible !== href ? `${visible} (${href})` : href;
      },
    )
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|tr|h[1-6])>/gi, "\n")
    .replace(/<li[^>]*>/gi, "- ")
    .replace(/<[^>]*>/g, "")
    .replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (e) => ENTIDADES[e] ?? e)
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Extrae las URLs http/https seguras de un texto, sin duplicados y en orden de aparición
export function extraerUrls(texto: string | null | undefined): string[] {
  if (!texto) return [];
  const urls: string[] = [];
  for (const m of htmlATexto(texto).matchAll(REGEX_URL)) {
    const url = enlaceSeguro(limpiarUrl(m[0]));
    if (url && !urls.includes(url)) urls.push(url);
  }
  return urls;
}

// Divide un texto en segmentos de texto plano y de enlace para renderizar sin HTML
export function dividirEnSegmentos(texto: string | null | undefined): SegmentoTexto[] {
  if (!texto) return [];
  const plano = htmlATexto(texto);
  const segmentos: SegmentoTexto[] = [];
  let cursor = 0;
  for (const m of plano.matchAll(REGEX_URL)) {
    const inicio = m.index ?? 0;
    const bruta = limpiarUrl(m[0]);
    const url = enlaceSeguro(bruta);
    if (!url) continue;
    if (inicio > cursor) segmentos.push({ texto: plano.slice(cursor, inicio) });
    segmentos.push({ texto: bruta, url });
    cursor = inicio + bruta.length;
  }
  if (cursor < plano.length) segmentos.push({ texto: plano.slice(cursor) });
  return segmentos;
}

function esDominioReunion(url: string): boolean {
  const host = new URL(url).hostname.toLowerCase();
  return DOMINIOS_REUNION.some((d) => host === d || host.endsWith(`.${d}`));
}

// Busca un enlace de videollamada conocido en la descripción o la ubicación
export function inferirEnlaceReunion(
  descripcion: string | null | undefined,
  ubicacion: string | null | undefined,
): string | undefined {
  return [...extraerUrls(ubicacion), ...extraerUrls(descripcion)].find(esDominioReunion);
}
