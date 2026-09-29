import { redirect } from "next/navigation";
import { obtenerSesion } from "@/lib/auth/sesion";
import { rutaDestinoSegura } from "@/lib/auth/rutas";
import { Icono, type NombreIcono } from "@/componentes/icono";
import { InterruptorTema } from "@/componentes/shell/interruptor-tema";
import { Marca } from "@/componentes/shell/marca";
import { FormularioLogin } from "./formulario-login";

const BENEFICIOS: { icono: NombreIcono; titulo: string; detalle: string }[] = [
  {
    icono: "proyectos",
    titulo: "Un frente por cliente",
    detalle: "Proyectos, tareas recurrentes y bitácora en un mismo lugar.",
  },
  {
    icono: "escudo",
    titulo: "Credenciales cifradas",
    detalle: "Los secretos se guardan cifrados y solo se muestran cuando los pides.",
  },
  {
    icono: "calendario",
    titulo: "Calendario unificado",
    detalle: "Tus reuniones de Google y Microsoft en una sola agenda.",
  },
];

export default async function PaginaLogin({ searchParams }: PageProps<"/login">) {
  const { callbackUrl } = await searchParams;
  const destino = rutaDestinoSegura(typeof callbackUrl === "string" ? callbackUrl : undefined);

  if (await obtenerSesion()) redirect(destino);

  return (
    <main className="bg-base-200 text-base-content grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <section
        aria-label="Presentación de Autogestión"
        className="bg-panel-marca relative hidden flex-col justify-between overflow-hidden p-12 text-white lg:flex xl:p-16"
      >
        <Marca className="relative" />
        <div className="relative max-w-md space-y-10">
          <div className="space-y-3">
            <p className="text-3xl leading-tight font-extrabold tracking-tight xl:text-4xl">
              Todos tus frentes de trabajo, bajo control.
            </p>
            <p className="text-base text-white/75">
              Una herramienta personal para organizar proyectos, credenciales, contactos y agenda.
            </p>
          </div>
          <ul className="space-y-5">
            {BENEFICIOS.map((beneficio) => (
              <li key={beneficio.titulo} className="flex items-start gap-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white/10 text-[#c8f031] ring-1 ring-white/15">
                  <Icono nombre={beneficio.icono} tamano={20} />
                </span>
                <div>
                  <p className="font-bold">{beneficio.titulo}</p>
                  <p className="text-sm text-white/70">{beneficio.detalle}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div aria-hidden="true" />
      </section>

      <div className="relative flex flex-col items-center justify-center px-6 py-16 sm:px-10">
        <div className="absolute top-4 right-4">
          <InterruptorTema />
        </div>
        <div className="w-full max-w-md">
          <Marca className="mb-8 lg:hidden" />
          <section className="tarjeta p-6 sm:p-8" aria-labelledby="titulo-login">
            <header className="mb-6 space-y-1.5">
              <h1 id="titulo-login" className="text-2xl font-extrabold tracking-tight">
                Iniciar sesión
              </h1>
              <p className="text-suave text-sm">Ingresa tus datos de acceso para continuar.</p>
            </header>
            <FormularioLogin destino={destino} />
          </section>
        </div>
      </div>
    </main>
  );
}
