import { notFound } from "next/navigation";
import { TituloSeccion } from "@/componentes/shell/titulo-seccion";
import { obtenerNota } from "@/lib/notas/operaciones";
import { FormularioNota } from "../../formulario-nota";
import { accionEditarNota } from "../../acciones";

export const metadata = { title: "Editar entrada · Autogestión" };

export default async function EditarNota({
  params,
}: PageProps<"/proyectos/[id]/notas/[notaId]/editar">) {
  const p = await params;
  const nota = await obtenerNota(p.notaId);
  if (!nota) notFound();

  return (
    <>
      <TituloSeccion modulo="Bitácora" titulo="Editar entrada" />
      <FormularioNota
        accion={accionEditarNota.bind(null, nota.id, nota.proyectoId)}
        valoresIniciales={{
          texto: nota.texto,
          fecha: nota.fecha.toISOString().split("T")[0],
        }}
        textoEnviar="Guardar cambios"
        rutaCancelar={`/proyectos/${nota.proyectoId}/notas/${nota.id}`}
      />
    </>
  );
}
