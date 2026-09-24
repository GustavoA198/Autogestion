"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore, type FormEvent } from "react";

const MENSAJES: Record<string, string> = {
  AccesoBloqueado: "Demasiados intentos. Espera unos minutos antes de volver a intentarlo.",
};
const MENSAJE_GENERICO = "Usuario o contraseña incorrectos.";

const sinSuscripcion = () => () => {};

// Falso en el servidor y verdadero en el cliente: indica que el formulario ya es interactivo
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

  return (
    <form method="post" onSubmit={alEnviar} className="space-y-4" noValidate>
      <div className="space-y-1">
        <label htmlFor="usuario" className="text-sm font-medium">
          Usuario
        </label>
        <input
          id="usuario"
          name="usuario"
          type="text"
          autoComplete="username"
          required
          className="w-full rounded border border-zinc-400 px-3 py-2"
        />
      </div>
      <div className="space-y-1">
        <label htmlFor="clave" className="text-sm font-medium">
          Contraseña
        </label>
        <input
          id="clave"
          name="clave"
          type="password"
          autoComplete="current-password"
          required
          className="w-full rounded border border-zinc-400 px-3 py-2"
        />
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={!hidratado || enviando}
        className="w-full rounded bg-zinc-900 px-3 py-2 font-medium text-white disabled:opacity-60"
      >
        {enviando ? "Verificando…" : "Entrar"}
      </button>
    </form>
  );
}
