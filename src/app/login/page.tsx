import { redirect } from "next/navigation";
import { obtenerSesion } from "@/lib/auth/sesion";
import { rutaDestinoSegura } from "@/lib/auth/rutas";
import { FormularioLogin } from "./formulario-login";

export const metadata = { title: "Iniciar sesión · Autogestión" };

export default async function PaginaLogin({ searchParams }: PageProps<"/login">) {
  const { callbackUrl } = await searchParams;
  const destino = rutaDestinoSegura(typeof callbackUrl === "string" ? callbackUrl : undefined);

  if (await obtenerSesion()) redirect(destino);

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <h1 className="text-2xl font-semibold">Autogestión</h1>
        <FormularioLogin destino={destino} />
      </div>
    </main>
  );
}
