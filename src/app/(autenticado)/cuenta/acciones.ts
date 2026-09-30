// Server action para cambiar la contraseña del usuario que tiene la sesión abierta
"use server";

import { revalidatePath } from "next/cache";
import { exigirSesion } from "@/lib/auth/sesion";
import { verificarClave } from "@/lib/auth/clave";
import { actualizarClave, obtenerUsuarioPorId } from "@/lib/usuarios/operaciones";
import { validarCambioClave, type ErroresClave } from "@/lib/usuarios/validacion";

export type EstadoFormularioClave = {
  errores?: ErroresClave;
  mensaje?: string;
};

const ERROR_CLAVE_ACTUAL = "La contraseña actual no es correcta.";

export async function accionCambiarClave(
  _anterior: EstadoFormularioClave,
  formulario: FormData,
): Promise<EstadoFormularioClave> {
  const sesion = await exigirSesion();
  const id = sesion.user?.id;
  if (!id) return { errores: { actual: "La sesión no es válida. Vuelve a entrar." } };

  const validacion = validarCambioClave({
    actual: formulario.get("actual"),
    nueva: formulario.get("nueva"),
    confirmacion: formulario.get("confirmacion"),
  });

  if (!validacion.ok) return { errores: validacion.errores };

  // El usuario sale de la sesión y la clave actual se comprueba contra su hash: el formulario no manda el id
  const usuario = await obtenerUsuarioPorId(id);
  if (!usuario || !(await verificarClave(validacion.datos.actual, usuario.claveHash))) {
    return { errores: { actual: ERROR_CLAVE_ACTUAL } };
  }

  await actualizarClave(id, validacion.datos.nueva);
  revalidatePath("/cuenta");

  return { mensaje: "Tu contraseña quedó actualizada. Se usará desde el próximo ingreso." };
}
