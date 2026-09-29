import { Suspense, type ReactNode } from "react";
import { TituloSeccion } from "@/componentes/shell/titulo-seccion";
import { EstadoError } from "@/componentes/estado-error";
import { EsqueletoEstadisticas } from "@/componentes/estadisticas/esqueleto-estadisticas";
import { NavegacionSecciones } from "@/componentes/estadisticas/navegacion-secciones";
import { SeccionCumplimiento } from "@/componentes/estadisticas/seccion-cumplimiento";
import { SeccionReuniones } from "@/componentes/estadisticas/seccion-reuniones";
import { SeccionTareas } from "@/componentes/estadisticas/seccion-tareas";
import { SeccionTiempo } from "@/componentes/estadisticas/seccion-tiempo";
import { PeriodoSelector } from "@/componentes/periodo-selector";
import {
  cargarDatosCumplimiento,
  cargarDatosReuniones,
  cargarDatosTareas,
  cargarDatosTiempo,
} from "@/lib/estadisticas/consultas";
import { semanasDelPeriodo } from "@/lib/estadisticas/semanas";
import { leerEntornoTiempo } from "@/lib/tareas/tiempo";
import { exigirSesion } from "@/lib/auth/sesion";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ semanas?: string }>;
};

const PERIODOS = [4, 8, 12] as const;

const SECCIONES = [
  { id: "tareas", etiqueta: "Tareas" },
  { id: "cumplimiento", etiqueta: "Cumplimiento" },
  { id: "tiempo", etiqueta: "Tiempo invertido" },
  { id: "reuniones", etiqueta: "Reuniones" },
];

// Una sección que falla no tumba las demás: se muestra un aviso compacto en su lugar
function ErrorSeccion({ id, titulo }: { id: string; titulo: string }) {
  return (
    <section id={id} aria-labelledby={`${id}-titulo`} className="scroll-mt-36 space-y-5">
      <h2 id={`${id}-titulo`} className="text-xl font-extrabold tracking-tight">
        {titulo}
      </h2>
      <EstadoError
        titulo={`No se pudo cargar ${titulo.toLowerCase()}`}
        mensaje="Recarga la página para intentarlo de nuevo; las demás secciones no se ven afectadas."
      />
    </section>
  );
}

function resolver<T>(
  resultado: PromiseSettledResult<T>,
  id: string,
  titulo: string,
  dibujar: (datos: T) => ReactNode,
): ReactNode {
  return resultado.status === "fulfilled" ? (
    dibujar(resultado.value)
  ) : (
    <ErrorSeccion id={id} titulo={titulo} />
  );
}

async function EstadisticasContent({ semanas }: { semanas: number }) {
  const { TZ } = leerEntornoTiempo();
  const hoy = new Date();
  const claves = semanasDelPeriodo(hoy, semanas, TZ);

  const [tareas, cumplimiento, tiempo, reuniones] = await Promise.allSettled([
    cargarDatosTareas(claves, TZ, hoy),
    cargarDatosCumplimiento(claves, TZ),
    cargarDatosTiempo(claves),
    cargarDatosReuniones(claves, TZ),
  ]);

  return (
    <div className="space-y-10">
      {resolver(tareas, "tareas", "Tareas", (d) => (
        <SeccionTareas datos={d} semanas={semanas} />
      ))}
      {resolver(cumplimiento, "cumplimiento", "Cumplimiento", (d) => (
        <SeccionCumplimiento datos={d} semanas={claves} />
      ))}
      {resolver(tiempo, "tiempo", "Tiempo invertido", (d) => (
        <SeccionTiempo datos={d} semanas={semanas} />
      ))}
      {resolver(reuniones, "reuniones", "Reuniones", (d) => (
        <SeccionReuniones datos={d} semanas={semanas} />
      ))}
    </div>
  );
}

export default async function PaginaEstadisticas({ searchParams }: Props) {
  await exigirSesion();
  const params = await searchParams;
  const semanas = PERIODOS.includes(Number(params.semanas) as (typeof PERIODOS)[number])
    ? (Number(params.semanas) as (typeof PERIODOS)[number])
    : 4;

  return (
    <>
      <TituloSeccion
        modulo="Productividad"
        titulo="Estadísticas"
        descripcion="Cómo van tus tareas, tu cumplimiento, el tiempo que inviertes y tus reuniones."
        accion={
          <div className="w-full sm:w-60">
            <PeriodoSelector actual={semanas} />
          </div>
        }
      />
      <NavegacionSecciones secciones={SECCIONES} />
      <Suspense key={semanas} fallback={<EsqueletoEstadisticas />}>
        <EstadisticasContent semanas={semanas} />
      </Suspense>
    </>
  );
}
