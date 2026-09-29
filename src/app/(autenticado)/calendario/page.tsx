// Calendario: el servidor resuelve el estado de conexión y el cliente calcula fechas con la zona del navegador.
import { exigirSesion } from "@/lib/auth/sesion";
import { contarPendientes } from "@/lib/tareas/operaciones";
import { obtenerEstadoCalendario } from "./acciones";
import { CalendarioCliente, type EstadoCalendario } from "./calendario-cliente";

export const dynamic = "force-dynamic";

const SIN_CONEXION: EstadoCalendario = {
  google: { conectado: false, configurado: false },
  microsoft: { conectado: false, configurado: false },
};

const MAX_LARGO_ERROR = 200;

function primerValor(valor: string | string[] | undefined): string | undefined {
  return Array.isArray(valor) ? valor[0] : valor;
}

export default async function PaginaCalendario({ searchParams }: PageProps<"/calendario">) {
  // La redirección de una sesión ausente debe ocurrir fuera del try para no quedar atrapada
  await exigirSesion();
  const consulta = await searchParams;

  let estado = SIN_CONEXION;
  try {
    estado = await obtenerEstadoCalendario();
  } catch {
    // Si la base de datos falla se muestra el calendario como no configurado
  }

  // Pendientes sin fecha: fuera del calendario, solo se muestra su conteo como enlace
  let pendientes = 0;
  try {
    pendientes = await contarPendientes();
  } catch {
    // Sin conteo simplemente no se muestra la nota
  }

  const error = primerValor(consulta.error);
  const origen = primerValor(consulta.origen) === "microsoft" ? "microsoft" : "google";

  return (
    <CalendarioCliente
      estado={estado}
      pendientes={pendientes}
      errorOAuth={
        error ? { mensaje: `Error de OAuth: ${error.slice(0, MAX_LARGO_ERROR)}`, origen } : null
      }
    />
  );
}
