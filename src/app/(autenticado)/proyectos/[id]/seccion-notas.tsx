import { BotonEnlace, Enlace } from "@/componentes/enlace";
import { Icono } from "@/componentes/icono";
import { Insignia } from "@/componentes/insignia";
import { Tarjeta } from "@/componentes/shell/tarjeta";
import { PROXIMO_PASO_SIN_DEFINIR } from "@/lib/notas/constantes";
import { formatearMinutos } from "@/lib/notas/formato";
import { contarNotasDeProyecto, listarNotasDeProyecto } from "@/lib/notas/operaciones";
import { tiempoRelativo } from "@/lib/tiempo";

// La fecha de la entrada es una fecha pura a medianoche UTC
function formatFecha(fecha: Date): string {
  return fecha.toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

const VISIBLES = 5;

export async function SeccionNotas({ proyectoId }: { proyectoId: string }) {
  const [notas, total] = await Promise.all([
    listarNotasDeProyecto(proyectoId, undefined, VISIBLES),
    contarNotasDeProyecto(proyectoId),
  ]);

  return (
    <Tarjeta
      titulo="Bitácora"
      accion={
        <BotonEnlace
          href={`/proyectos/${proyectoId}/notas/nueva`}
          variante="secundario"
          tamano="pequeno"
        >
          <Icono nombre="mas" tamano={14} />
          Nueva entrada
        </BotonEnlace>
      }
    >
      {notas.length === 0 ? (
        <p className="text-suave text-sm">Este proyecto aún no tiene entradas en la bitácora.</p>
      ) : (
        <ul className="lista-filas">
          {notas.map((nota) => (
            <li key={nota.id} className="tarjeta-fila px-4 py-3">
              <div className="flex items-start justify-between gap-2">
                <Enlace
                  href={`/proyectos/${proyectoId}/notas/${nota.id}`}
                  discreto
                  className="font-bold first-letter:uppercase"
                >
                  {formatFecha(nota.fecha)}
                </Enlace>
                <span className="text-tenue font-mono text-xs whitespace-nowrap">
                  {tiempoRelativo(nota.actualizadoEn)}
                </span>
              </div>
              <p className="text-suave mt-1 line-clamp-2 text-sm" title={nota.texto}>
                {nota.texto}
              </p>
              {nota.proximoPaso !== PROXIMO_PASO_SIN_DEFINIR ? (
                <p className="mt-1 flex items-start gap-1.5 text-sm">
                  <Icono
                    nombre="flecha-derecha"
                    tamano={14}
                    className="text-primary mt-1 shrink-0"
                  />
                  <span className="min-w-0 truncate" title={`Próximo paso: ${nota.proximoPaso}`}>
                    <span className="font-bold">Próximo paso:</span> {nota.proximoPaso}
                  </span>
                </p>
              ) : null}
              {nota.minutos ? (
                <Insignia tono="ghost" className="mt-1.5 gap-1">
                  <Icono nombre="reloj" tamano={12} />
                  {formatearMinutos(nota.minutos)}
                </Insignia>
              ) : null}
            </li>
          ))}
        </ul>
      )}
      {notas.length > 0 ? (
        <Enlace
          href={`/proyectos/${proyectoId}/notas`}
          className="inline-flex items-center gap-1 self-start text-sm"
        >
          {total > VISIBLES ? `Ver las ${total} entradas` : "Ver bitácora completa"}
          <Icono nombre="flecha-derecha" tamano={14} />
        </Enlace>
      ) : null}
    </Tarjeta>
  );
}
