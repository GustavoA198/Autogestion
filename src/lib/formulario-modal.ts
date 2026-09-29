// El formulario montado en un modal de ruta avisa con un campo oculto modal=1
export function enModal(formulario: FormData): boolean {
  return formulario.get("modal") === "1";
}
