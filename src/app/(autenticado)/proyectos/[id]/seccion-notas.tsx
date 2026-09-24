import Link from "next/link";
import { listarNotasDeProyecto } from "@/lib/notas/operaciones";
import { tiempoRelativo } from "@/lib/tiempo";
import { Tarjeta } from "@/componentes/shell/tarjeta";

function formatFecha(fecha: Date): string {
  return fecha.toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export async function SeccionNotas({ proyectoId }: { proyectoId: string }) {
  const notas = await listarNotasDeProyecto(proyectoId);

  return (
    <Tarjeta
      titulo="Bitácora"
      accion={
        <Link href={`/proyectos/${proyectoId}/notas/nueva`} className="btn btn-outline btn-sm">
          Nueva entrada
        </Link>
      }
    >
      {notas.length === 0 ? (
        <p className="text-sm opacity-70">Este proyecto aún no tiene entradas en la bitácora.</p>
      ) : (
        <ul className="divide-base-300 divide-y">
          {notas.slice(0, 5).map((nota) => (
            <li key={nota.id} className="py-3">
              <div className="flex items-start justify-between gap-2">
                <Link
                  href={`/proyectos/${proyectoId}/notas/${nota.id}`}
                  className="link link-hover font-medium"
                >
                  {formatFecha(nota.fecha)}
                </Link>
                <span className="text-xs whitespace-nowrap opacity-60">
                  {tiempoRelativo(nota.actualizadoEn)}
                </span>
              </div>
              <p className="mt-1 line-clamp-2 text-sm opacity-80">{nota.texto}</p>
            </li>
          ))}
        </ul>
      )}
      {notas.length > 5 && <p className="pt-2 text-sm opacity-60">y {notas.length - 5} más.</p>}
    </Tarjeta>
  );
}
