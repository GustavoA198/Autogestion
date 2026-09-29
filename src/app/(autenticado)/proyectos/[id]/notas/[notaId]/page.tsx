import { notFound } from "next/navigation";
import { BotonEnlace } from "@/componentes/enlace";
import { Icono } from "@/componentes/icono";
import { Insignia } from "@/componentes/insignia";
import { Tarjeta } from "@/componentes/shell/tarjeta";
import { TituloSeccion } from "@/componentes/shell/titulo-seccion";
import { PROXIMO_PASO_SIN_DEFINIR } from "@/lib/notas/constantes";
import { formatearMinutos } from "@/lib/notas/formato";
import { obtenerNota } from "@/lib/notas/operaciones";
import { obtenerProyecto } from "@/lib/proyectos/operaciones";
import { BotonEliminarNota } from "./boton-eliminar";

export const dynamic = "force-dynamic";

// La fecha de la entrada es una fecha pura a medianoche UTC
const FORMATO_FECHA = new Intl.DateTimeFormat("es", { dateStyle: "full", timeZone: "UTC" });

export default async function FichaNota({ params }: PageProps<"/proyectos/[id]/notas/[notaId]">) {
  const p = await params;
  const [nota, proyecto] = await Promise.all([obtenerNota(p.notaId), obtenerProyecto(p.id)]);
  if (!nota || !proyecto || nota.proyectoId !== p.id) notFound();
  const sinDefinir = nota.proximoPaso === PROXIMO_PASO_SIN_DEFINIR;

  return (
    <>
      <TituloSeccion
        modulo="Bitácora"
        titulo={FORMATO_FECHA.format(nota.fecha)}
        descripcion={proyecto.nombre}
        accion={
          <>
            <BotonEnlace href={`/proyectos/${p.id}/notas/nueva`}>
              <Icono nombre="mas" tamano={16} />
              Nueva entrada
            </BotonEnlace>
            <BotonEnlace href={`/proyectos/${p.id}/notas/${nota.id}/editar`} variante="secundario">
              <Icono nombre="editar" tamano={16} />
              Editar
            </BotonEnlace>
            <BotonEliminarNota id={nota.id} proyectoId={p.id} />
          </>
        }
      />
      <div className="space-y-5">
        <section
          aria-labelledby="titulo-proximo-paso"
          className="border-primary/45 bg-primary/5 rounded-box border p-4 sm:p-6"
        >
          <h2
            id="titulo-proximo-paso"
            className="text-primary flex items-center gap-2 text-sm font-bold"
          >
            <Icono nombre="flecha-derecha" tamano={16} />
            Próximo paso
          </h2>
          <p
            className={`mt-2 text-lg leading-relaxed font-bold break-words whitespace-pre-wrap ${sinDefinir ? "text-tenue italic" : ""}`}
          >
            {nota.proximoPaso}
          </p>
        </section>
        <Tarjeta
          titulo="Entrada"
          accion={
            nota.minutos ? (
              <Insignia tono="ghost" className="gap-1">
                <Icono nombre="reloj" tamano={12} />
                {formatearMinutos(nota.minutos)} invertidos
              </Insignia>
            ) : undefined
          }
        >
          <p className="text-base leading-relaxed whitespace-pre-wrap">{nota.texto}</p>
        </Tarjeta>
      </div>
    </>
  );
}
