"use client";

import { EstadoCarga } from "@/componentes/estado-carga";
import { EstadoError } from "@/componentes/estado-error";
import { EstadoVacio } from "@/componentes/estado-vacio";
import { BotonEnlace, Enlace } from "@/componentes/enlace";
import { useAhora, useZonaNavegador } from "@/componentes/calendario/hooks";
import { ListaReunionesPanel } from "@/componentes/detalle-reunion";
import { Tarjeta } from "@/componentes/shell/tarjeta";
import { compararDias, diaCivilDe, sumarDias, type DiaCivil } from "@/lib/calendario/fechas";
import { diasDeDiaCompleto } from "@/lib/calendario/formato";
import type { ReunionDetalle } from "@/lib/calendario/operaciones";

const DIAS_PROXIMOS = 7;
const MAX_PROXIMAS = 5;

// Primer día civil de la reunión en la zona del navegador
function diaDeInicio(reunion: ReunionDetalle, zona: string): DiaCivil {
  return reunion.diaCompleto
    ? diasDeDiaCompleto(reunion).desde
    : diaCivilDe(new Date(reunion.inicio), zona);
}

// Un evento de varios días cuenta como de hoy si hoy cae dentro de su rango
function ocurreHoy(reunion: ReunionDetalle, zona: string, hoy: DiaCivil): boolean {
  if (reunion.diaCompleto) {
    const { desde, hasta } = diasDeDiaCompleto(reunion);
    return compararDias(desde, hoy) <= 0 && compararDias(hoy, hasta) < 0;
  }
  return compararDias(diaDeInicio(reunion, zona), hoy) === 0;
}

function TituloVacio({ children }: { children: string }) {
  return <p className="text-suave text-sm">{children}</p>;
}

// Reuniones de hoy y próximos días, agrupadas con la zona horaria del navegador
export function BloqueReuniones({
  reuniones,
  error,
}: {
  reuniones: ReunionDetalle[] | null;
  error: string | null;
}) {
  const zona = useZonaNavegador();
  const ahora = useAhora();

  if (error || reuniones === null) {
    return (
      <Tarjeta titulo="Agenda">
        <EstadoError
          mensaje={error ?? "No se pudieron cargar las reuniones."}
          accion={
            <BotonEnlace href="/calendario" variante="secundario" tamano="pequeno">
              Ir al calendario
            </BotonEnlace>
          }
        />
      </Tarjeta>
    );
  }

  if (zona === null || ahora === null) {
    return (
      <Tarjeta titulo="Agenda">
        <EstadoCarga filas={4} etiqueta="Cargando reuniones" />
      </Tarjeta>
    );
  }

  const hoy = diaCivilDe(ahora, zona);
  const limite = sumarDias(hoy, DIAS_PROXIMOS);
  const deHoy = reuniones.filter((r) => ocurreHoy(r, zona, hoy));
  const proximas = reuniones
    .filter((r) => {
      const dia = diaDeInicio(r, zona);
      return compararDias(dia, hoy) > 0 && compararDias(dia, limite) <= 0;
    })
    .slice(0, MAX_PROXIMAS);

  return (
    <Tarjeta
      titulo="Agenda"
      accion={
        <Enlace href="/calendario" className="text-sm">
          Ver calendario
        </Enlace>
      }
    >
      {deHoy.length === 0 && proximas.length === 0 ? (
        <EstadoVacio
          icono="calendario"
          titulo="Sin reuniones cercanas"
          descripcion="No hay reuniones hoy ni en los próximos días."
        />
      ) : (
        <div className="space-y-5">
          <section aria-labelledby="reuniones-hoy">
            <h3
              id="reuniones-hoy"
              className="text-suave mb-2 text-xs font-bold tracking-wide uppercase"
            >
              Hoy
            </h3>
            {deHoy.length === 0 ? (
              <TituloVacio>No tienes reuniones hoy.</TituloVacio>
            ) : (
              <ListaReunionesPanel reuniones={deHoy} zona={zona} />
            )}
          </section>
          {proximas.length > 0 ? (
            <section aria-labelledby="reuniones-proximas">
              <h3
                id="reuniones-proximas"
                className="text-suave mb-2 text-xs font-bold tracking-wide uppercase"
              >
                Próximos días
              </h3>
              <ListaReunionesPanel reuniones={proximas} zona={zona} hoy={hoy} />
            </section>
          ) : null}
        </div>
      )}
    </Tarjeta>
  );
}
