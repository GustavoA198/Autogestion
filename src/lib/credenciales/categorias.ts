// Deben coincidir con el enum CategoriaCredencial de Prisma
export const CATEGORIAS = {
  BASE_DATOS: "Acceso a base de datos",
  SERVIDOR: "Acceso a servidor",
  APLICACION: "Credencial de aplicación",
  OTRO: "Otro",
} as const;

export type Categoria = keyof typeof CATEGORIAS;

export const VALORES_CATEGORIA = Object.keys(CATEGORIAS) as [Categoria, ...Categoria[]];

export function esCategoria(valor: unknown): valor is Categoria {
  return typeof valor === "string" && Object.hasOwn(CATEGORIAS, valor);
}
