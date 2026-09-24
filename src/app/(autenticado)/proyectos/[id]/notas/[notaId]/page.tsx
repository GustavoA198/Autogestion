import Link from "next/link";
import { notFound } from "next/navigation";
import { Tarjeta } from "@/componentes/shell/tarjeta";
import { TituloSeccion } from "@/componentes/shell/titulo-seccion";
import { obtenerNota } from "@/lib/notas/operaciones";
import { obtenerProyecto } from "@/lib/proyectos/operaciones";
import { BotonEliminarNota } from "./boton-eliminar";

export const dynamic = "force-dynamic";

const FORMATO_FECHA = new Intl.DateTimeFormat("es", { dateStyle: "full" });

export async function generateMetadata({ params }: PageProps<"/proyectos/[id]/notas/[notaId]">) {
  const p = await params;
  const nota = await obtenerNota(p.notaId);
  return { title: `${nota ? FORMATO_FECHA.format(nota.fecha) : "Nota"} · Autogestión` };
}

export default async function FichaNota({ params }: PageProps<"/proyectos/[id]/notas/[notaId]">) {
  const p = await params;
  const [nota, proyecto] = await Promise.all([obtenerNota(p.notaId), obtenerProyecto(p.id)]);
  if (!nota || !proyecto) notFound();

  return (
    <>
      <TituloSeccion
        modulo="Bitácora"
        titulo={FORMATO_FECHA.format(nota.fecha)}
        descripcion={proyecto.nombre}
        accion={
          <>
            <Link href={`/proyectos/${p.id}/notas/${nota.id}/editar`} className="btn btn-outline">
              Editar
            </Link>
            <BotonEliminarNota id={nota.id} proyectoId={p.id} />
          </>
        }
      />
      <div className="space-y-6">
        <Tarjeta titulo="Entrada">
          <p className="text-sm whitespace-pre-wrap">{nota.texto}</p>
        </Tarjeta>
      </div>
    </>
  );
}
