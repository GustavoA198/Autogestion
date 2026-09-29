import { notFound } from "next/navigation";
import { Alerta } from "@/componentes/alerta";
import { PROXIMO_PASO_SIN_DEFINIR } from "@/lib/notas/constantes";
import { textoHace } from "@/lib/notas/formato";
import { obtenerUltimaNota } from "@/lib/notas/operaciones";
import { claveHoyLocal, diasEntre, hoyComoFecha } from "@/lib/notas/periodo";
import { obtenerProyecto } from "@/lib/proyectos/operaciones";
import { leerEntornoTiempo } from "@/lib/tareas/tiempo";
import { accionCrearNota } from "../acciones";
import { FormularioNota } from "../formulario-nota";

// Formulario de creación compartido por la página completa y el modal interceptado
export async function FormularioNuevaNota({
  proyectoId,
  enModal = false,
}: {
  proyectoId: string;
  enModal?: boolean;
}) {
  const [proyecto, ultima] = await Promise.all([
    obtenerProyecto(proyectoId),
    obtenerUltimaNota(proyectoId),
  ]);
  if (!proyecto) notFound();

  // La fecha por defecto es el día local de la zona configurada, no el día UTC
  const { TZ } = leerEntornoTiempo();
  const hoy = claveHoyLocal(TZ);
  const dias = ultima ? Math.max(0, diasEntre(ultima.fecha, hoyComoFecha(TZ))) : 0;
  const hayProximoPaso = ultima && ultima.proximoPaso !== PROXIMO_PASO_SIN_DEFINIR;

  return (
    <FormularioNota
      accion={accionCrearNota}
      valoresIniciales={{ texto: "", fecha: hoy, proximoPaso: "", minutos: "" }}
      textoEnviar="Crear entrada"
      proyectoId={proyectoId}
      rutaCancelar={`/proyectos/${proyectoId}`}
      enModal={enModal}
      contexto={
        ultima && hayProximoPaso ? (
          <Alerta tono="info">
            <p className="font-bold">Tu próximo paso anterior ({textoHace(dias)})</p>
            <p className="mt-0.5 break-words whitespace-pre-wrap">{ultima.proximoPaso}</p>
          </Alerta>
        ) : undefined
      }
    />
  );
}

// Nombre del proyecto para la descripción de la cabecera, compartido por página y modal
export async function nombreProyectoNota(proyectoId: string): Promise<string> {
  const proyecto = await obtenerProyecto(proyectoId);
  if (!proyecto) notFound();
  return proyecto.nombre;
}
