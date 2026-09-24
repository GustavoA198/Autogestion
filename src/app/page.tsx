import { exigirSesion } from "@/lib/auth/sesion";
import { BotonCerrarSesion } from "./boton-cerrar-sesion";

export default async function Inicio() {
  await exigirSesion();

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-semibold">Autogestión</h1>
      <BotonCerrarSesion />
    </main>
  );
}
