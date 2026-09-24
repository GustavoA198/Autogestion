import { Suspense } from "react";
import { Metadata } from "next";
import { TituloSeccion } from "@/componentes/shell/titulo-seccion";
import { EstadoVacio } from "@/componentes/estado-vacio";
import { EstadoCarga } from "@/componentes/estado-carga";
import { ResumenEstadisticas } from "@/componentes/resumen-estadisticas";
import { PeriodoSelector } from "@/componentes/periodo-selector";
import { agruparPorSemana, agruparPorProyecto } from "@/lib/estadisticas/calculos";
import { leerEntornoTiempo } from "@/lib/tareas/tiempo";
import { obtenerPrisma } from "@/lib/prisma";
import { exigirSesion } from "@/lib/auth/sesion";

export const metadata: Metadata = { title: "Estadisticas · Autogestion" };
export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ semanas?: string }>;
};

const PERIODOS = [4, 8, 12] as const;

async function EstadisticasContent({ semanas }: { semanas: number }) {
  const { TZ } = leerEntornoTiempo();
  const prisma = obtenerPrisma();

  const ahora = new Date();
  const haceNSemanas = new Date(ahora);
  haceNSemanas.setDate(haceNSemanas.getDate() - semanas * 7);

  const [completadas, proyectos] = await Promise.all([
    prisma.tareaCompletada.findMany({
      where: { fecha: { gte: haceNSemanas } },
      include: { tarea: { select: { proyectoId: true } } },
      orderBy: { fecha: "asc" },
    }),
    prisma.proyecto.findMany({
      select: { id: true, nombre: true },
      orderBy: { nombre: "asc" },
    }),
  ]);

  const datosSemana = agruparPorSemana(completadas, TZ);
  const datosProyecto = agruparPorProyecto(completadas, proyectos);
  const total = completadas.length;

  if (total === 0) {
    return (
      <EstadoVacio
        icono="panel"
        titulo="Sin datos en este periodo"
        descripcion={`No hay tareas completadas en las ultimas ${semanas} semanas.`}
      />
    );
  }

  return (
    <ResumenEstadisticas
      datosSemana={datosSemana}
      datosProyecto={datosProyecto}
      total={total}
      periodoSemanas={semanas}
    />
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
        titulo="Estadisticas"
        descripcion="Visualiza tu ritmo de completacion de tareas."
      />
      <div className="mb-6 flex items-center gap-4">
        <Suspense fallback={<div className="skeleton h-10 w-40" />}>
          <PeriodoSelector actual={semanas} />
        </Suspense>
      </div>
      <Suspense fallback={<EstadoCarga etiqueta="Cargando estadisticas" />}>
        <EstadisticasContent semanas={semanas} />
      </Suspense>
    </>
  );
}
