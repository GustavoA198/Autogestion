import { notFound } from "next/navigation";
import { obtenerNota } from "@/lib/notas/operaciones";
import { claveDeFecha } from "@/lib/notas/periodo";
import { accionEditarNota } from "../../acciones";

// Carga la entrada y arma las propiedades del formulario de edición, compartidas por página y modal
export async function cargarEdicionNota(proyectoId: string, notaId: string) {
  const nota = await obtenerNota(notaId);
  if (!nota || nota.proyectoId !== proyectoId) notFound();

  return {
    accion: accionEditarNota.bind(null, nota.id, nota.proyectoId),
    valoresIniciales: {
      texto: nota.texto,
      fecha: claveDeFecha(nota.fecha),
      proximoPaso: nota.proximoPaso,
      minutos: nota.minutos === null ? "" : String(nota.minutos),
    },
    textoEnviar: "Guardar cambios",
    rutaCancelar: `/proyectos/${nota.proyectoId}/notas/${nota.id}`,
  };
}
