import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { z } from "zod";
import { igualesSeguro, verificarClave } from "@/lib/auth/clave";
import { obtenerIp, registrarIntento, reiniciarIntentos } from "@/lib/auth/limitador";
import { leerEntornoAuth, esProduccion } from "@/lib/env";

export const DURACION_SESION_SEGUNDOS = 12 * 60 * 60;
export const ERROR_ACCESO_BLOQUEADO = "AccesoBloqueado";
const ID_USUARIO_UNICO = "usuario-unico";

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

  const entorno = leerEntornoAuth();
  const claveCorrecta = await verificarClave(entrada.data.clave, entorno.AUTH_CLAVE_HASH);
  const usuarioCorrecto = igualesSeguro(entrada.data.usuario, entorno.AUTH_USUARIO);
  if (!claveCorrecta || !usuarioCorrecto) return null;

  await reiniciarIntentos(ip);
  return { id: ID_USUARIO_UNICO, name: entorno.AUTH_USUARIO };
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: DURACION_SESION_SEGUNDOS },
  jwt: { maxAge: DURACION_SESION_SEGUNDOS },
  pages: { signIn: "/login", error: "/login" },
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
