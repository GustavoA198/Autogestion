"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore, type FormEvent } from "react";
import { Boton } from "@/componentes/boton";
import { Entrada } from "@/componentes/entrada";
import { Icono } from "@/componentes/icono";

const MENSAJES: Record<string, string> = {
  AccesoBloqueado: "Demasiados intentos. Espera unos minutos antes de volver a intentarlo.",
};
const MENSAJE_GENERICO = "Usuario o contraseña incorrectos.";
const ID_ERROR = "error-acceso";

const sinSuscripcion = () => () => {};

// Falso en el servidor y verdadero en el cliente: el formulario ya es interactivo
function useHidratado() {
  return useSyncExternalStore(
    sinSuscripcion,
    () => true,
    () => false,
  );
}

export function FormularioLogin({ destino }: { destino: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const hidratado = useHidratado();

  async function alEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setEnviando(true);
    setError(null);

    const datos = new FormData(evento.currentTarget);
    const resultado = await signIn("credentials", {
      usuario: datos.get("usuario"),
      clave: datos.get("clave"),
      redirect: false,
    });

    if (resultado?.ok) {
      router.replace(destino);
      router.refresh();
      return;
    }

    setError((resultado?.error && MENSAJES[resultado.error]) || MENSAJE_GENERICO);
    setEnviando(false);
  }

  const describedBy = error ? ID_ERROR : undefined;

  return (
    <form method="post" onSubmit={alEnviar} className="space-y-5" noValidate>
      <Entrada
        etiqueta="Usuario"
        name="usuario"
        autoComplete="username"
        autoCapitalize="none"
        spellCheck={false}
        autoFocus
        required
        invalido={Boolean(error)}
        aria-describedby={describedBy}
      />
      <Entrada
        etiqueta="Contraseña"
        name="clave"
        type="password"
        autoComplete="current-password"
        required
        invalido={Boolean(error)}
        aria-describedby={describedBy}
      />
      {error ? (
        <div
          id={ID_ERROR}
          role="alert"
          className="border-error/30 bg-error/8 flex items-start gap-2.5 rounded-2xl border p-3 text-sm"
        >
          <Icono nombre="error" tamano={18} className="text-error mt-0.5" />
          <span>{error}</span>
        </div>
      ) : null}
      <Boton
        type="submit"
        variante="primario"
        tamano="grande"
        disabled={!hidratado || enviando}
        cargando={enviando}
        className="w-full"
      >
        {enviando ? "Verificando…" : "Entrar"}
      </Boton>
    </form>
  );
}
