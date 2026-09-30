import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { z } from "zod";
import { obtenerIp, registrarIntento, reiniciarIntentos } from "@/lib/auth/limitador";
import { leerEntornoAuth, esProduccion } from "@/lib/env";
import { verificarCredenciales } from "@/lib/usuarios/operaciones";

export const DURACION_SESION_SEGUNDOS = 12 * 60 * 60;
export const ERROR_ACCESO_BLOQUEADO = "AccesoBloqueado";

const esquemaAcceso = z.object({
  usuario: z.string().min(1).max(100),
  clave: z.string().min(1).max(200),
});

type Solicitud = { headers?: Record<string, string | string[] | undefined> };

// Devuelve null ante cualquier fallo para no revelar si falló el usuario o la contraseña
export async function autorizar(credenciales: unknown, solicitud: Solicitud) {
  const ip = obtenerIp(solicitud.headers ?? {});

  if (await registrarIntento(ip)) throw new Error(ERROR_ACCESO_BLOQUEADO);

  const entrada = esquemaAcceso.safeParse(credenciales);
  if (!entrada.success) return null;

  // Falla pronto con un mensaje claro si falta NEXTAUTH_SECRET o NEXTAUTH_URL
  leerEntornoAuth();

  const resultado = await verificarCredenciales(entrada.data.usuario, entrada.data.clave);
  if (!resultado.ok) return null;

  await reiniciarIntentos(ip);
  return { id: resultado.usuario.id, name: resultado.usuario.nombre };
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: DURACION_SESION_SEGUNDOS },
  jwt: { maxAge: DURACION_SESION_SEGUNDOS },
  pages: { signIn: "/login", error: "/login" },
  callbacks: {
    // Con estrategia JWT el id no viaja solo a la sesión; el cambio de contraseña lo necesita
    session: ({ session, token }) => {
      if (token.sub) session.user.id = token.sub;
      return session;
    },
  },
  cookies: {
    sessionToken: {
      name: esProduccion() ? "__Secure-next-auth.session-token" : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: esProduccion(),
      },
    },
  },
  providers: [
    CredentialsProvider({
      name: "Credenciales",
      credentials: {
        usuario: { label: "Usuario", type: "text" },
        clave: { label: "Contraseña", type: "password" },
      },
      authorize: (credenciales, solicitud) => autorizar(credenciales, solicitud),
    }),
  ],
};
