"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore, type FormEvent } from "react";
import { Boton } from "@/componentes/boton";
import { Entrada } from "@/componentes/entrada";

const MENSAJES: Record<string, string> = {
  AccesoBloqueado: "Demasiados intentos. Espera unos minutos antes de volver a intentarlo.",
};
const MENSAJE_GENERICO = "Usuario o contraseña incorrectos.";

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

  return (
    <form method="post" onSubmit={alEnviar} className="space-y-4" noValidate>
      <Entrada
        etiqueta="Usuario"
        name="usuario"
        autoComplete="username"
        required
        invalido={Boolean(error)}
      />
      <Entrada
        etiqueta="Contraseña"
        name="clave"
        type="password"
        autoComplete="current-password"
        required
        invalido={Boolean(error)}
      />
      {error ? (
        <p role="alert" className="alert alert-error text-sm">
          {error}
        </p>
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
