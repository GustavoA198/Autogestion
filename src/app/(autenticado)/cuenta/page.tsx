// Página de cuenta: permite cambiar la contraseña del usuario que tiene la sesión abierta
import { TituloSeccion } from "@/componentes/shell/titulo-seccion";
import { exigirSesion } from "@/lib/auth/sesion";
import { accionCambiarClave } from "./acciones";
import { FormularioClave } from "./formulario-clave";

export default async function PaginaCuenta() {
  const sesion = await exigirSesion();

  return (
    <>
      <TituloSeccion
        modulo="Cuenta"
        titulo="Cambiar contraseña"
        descripcion={`Sesión abierta como ${sesion.user?.name ?? "usuario"}. Solo guardamos el hash: tu contraseña nunca se vuelve a mostrar.`}
      />
      <FormularioClave accion={accionCambiarClave} />
    </>
  );
}
