// Bloques de bitácora del panel: retomar el trabajo y proyectos sin avance.

import { BotonContinuar } from "@/componentes/boton-continuar";
import { BotonEnlace, Enlace } from "@/componentes/enlace";
import { EstadoError } from "@/componentes/estado-error";
import { Icono } from "@/componentes/icono";
import { Tarjeta } from "@/componentes/shell/tarjeta";
import { DIAS_SIN_AVANCE, PROXIMO_PASO_SIN_DEFINIR } from "@/lib/notas/constantes";
import { textoHace } from "@/lib/notas/formato";
import type { ResultadoSinAvance, ResultadoUltimaBitacora } from "./dashboard-data";

export function BloqueRetoma({ resultado }: { resultado: ResultadoUltimaBitacora | null }) {
  if (resultado === null || !resultado.ok) {
    return (
      <Tarjeta titulo="Retoma tu trabajo">
        <EstadoError
          mensaje={resultado?.ok === false ? resultado.error : "Error al cargar la bitácora."}
        />
      </Tarjeta>
    );
  }

  const { ultima } = resultado;
  if (!ultima) {
    return (
      <Tarjeta
        titulo="Retoma tu trabajo"
        accion={
          <Enlace href="/notas" className="text-sm">
            Ir a la bitácora
          </Enlace>
        }
      >
        <p className="text-suave text-sm">
          Aún no hay entradas. Registra la primera desde la ficha de un proyecto y aquí verás cómo
          retomarla.
        </p>
      </Tarjeta>
    );
  }

  const sinDefinir = ultima.proximoPaso === PROXIMO_PASO_SIN_DEFINIR;
  return (
    <Tarjeta
      titulo="Retoma tu trabajo"
      accion={
        <Enlace href="/notas" className="text-sm">
          Ver todos los proyectos
        </Enlace>
      }
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-1">
          <p className="text-suave text-sm">
            <span className="text-base-content font-bold">{ultima.proyecto.nombre}</span> · último
            avance {textoHace(ultima.dias)}
          </p>
          <p className="text-suave text-xs font-bold tracking-wide uppercase">Próximo paso</p>
          <p
            title={ultima.proximoPaso}
            className={`line-clamp-3 text-base font-medium break-words ${sinDefinir ? "text-tenue italic" : ""}`}
          >
            {ultima.proximoPaso}
          </p>
        </div>
        <div className="shrink-0">
          <BotonContinuar
            proyectoId={ultima.proyecto.id}
            ultimaNotaId={ultima.notaId}
            tamano="grande"
          />
        </div>
      </div>
    </Tarjeta>
  );
}

const MAX_SIN_AVANCE = 4;

// Franja de aviso: proyectos que superan el umbral de días sin entradas
export function FranjaSinAvance({ resultado }: { resultado: ResultadoSinAvance | null }) {
  if (resultado === null || !resultado.ok || resultado.proyectos.length === 0) return null;
  const { proyectos } = resultado;
  const visibles = proyectos.slice(0, MAX_SIN_AVANCE);

  return (
    <div className="border-warning/30 bg-warning/8 mb-6 rounded-2xl border px-4 py-3 text-sm">
      <p className="flex items-center gap-2">
        <Icono nombre="alerta" tamano={18} className="text-warning shrink-0" />
        <span>
          <strong>{proyectos.length}</strong>{" "}
          {proyectos.length === 1 ? "proyecto sin avance" : "proyectos sin avance"} (más de{" "}
          {DIAS_SIN_AVANCE} días sin entradas)
        </span>
      </p>
      <ul className="mt-2 flex flex-wrap gap-2">
        {visibles.map((p) => (
          <li key={p.id}>
            <BotonEnlace
              href={`/proyectos/${p.id}/notas/nueva`}
              variante="secundario"
              tamano="pequeno"
              aria-label={`Nueva entrada en ${p.nombre}, sin avance hace ${p.dias} días`}
            >
              <span className="max-w-48 truncate" title={p.nombre}>
                {p.nombre}
              </span>
              <span className="text-suave">· {p.dias} días</span>
              <Icono nombre="mas" tamano={14} />
            </BotonEnlace>
          </li>
        ))}
        {proyectos.length > visibles.length ? (
          <li className="flex items-center">
            <Enlace href="/notas">Ver los {proyectos.length}</Enlace>
          </li>
        ) : null}
      </ul>
    </div>
  );
}
