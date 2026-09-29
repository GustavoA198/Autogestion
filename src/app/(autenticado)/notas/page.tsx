import { BotonContinuar } from "@/componentes/boton-continuar";
import { BotonEnlace, Enlace } from "@/componentes/enlace";
import { EstadoVacio } from "@/componentes/estado-vacio";
import { FiltroPeriodoNotas } from "@/componentes/filtro-periodo-notas";
import { Icono } from "@/componentes/icono";
import { Insignia } from "@/componentes/insignia";
import { Tarjeta } from "@/componentes/shell/tarjeta";
import { TituloSeccion } from "@/componentes/shell/titulo-seccion";
import { DIAS_SIN_AVANCE, PROXIMO_PASO_SIN_DEFINIR } from "@/lib/notas/constantes";
import { formatearMinutos, textoHace } from "@/lib/notas/formato";
import {
  avanceDeProyectos,
  totalesPorProyecto,
  type AvanceProyecto,
} from "@/lib/notas/operaciones";
import { ETIQUETA_PERIODO, leerPeriodo, rangoDePeriodo } from "@/lib/notas/periodo";
import { leerEntornoTiempo } from "@/lib/tareas/tiempo";

export const dynamic = "force-dynamic";

// Estado de avance con icono y texto; el color nunca es el único indicador
function EstadoAvance({ avance }: { avance: AvanceProyecto }) {
  if (avance.sinNotas && !avance.sinAvance) {
    return <Insignia tono="ghost">Sin entradas todavía</Insignia>;
  }
  if (avance.sinAvance) {
    return (
      <Insignia tono="warning" className="gap-1">
        <Icono nombre="alerta" tamano={12} />
        {avance.sinNotas
          ? `Sin entradas hace ${avance.dias} días`
          : `Sin avance hace ${avance.dias} días`}
      </Insignia>
    );
  }
  return (
    <Insignia tono="success" contorno className="gap-1">
      <Icono nombre="check-circulo" tamano={12} />
      Último avance: {textoHace(avance.dias)}
    </Insignia>
  );
}

export default async function Notas({ searchParams }: PageProps<"/notas">) {
  const consulta = await searchParams;
  const periodo = leerPeriodo(consulta.periodo);
  const { TZ } = leerEntornoTiempo();
  const [avances, totales] = await Promise.all([
    avanceDeProyectos(),
    totalesPorProyecto(rangoDePeriodo(periodo, TZ)),
  ]);
  const sinAvance = avances.filter((a) => a.sinAvance).length;

  return (
    <>
      <TituloSeccion
        modulo="Bitácora"
        titulo="Retoma tu trabajo"
        descripcion={
          sinAvance > 0
            ? `${sinAvance} ${sinAvance === 1 ? "proyecto lleva" : "proyectos llevan"} más de ${DIAS_SIN_AVANCE} días sin avance.`
            : "Cada proyecto con su último próximo paso, para continuar sin buscar."
        }
        accion={
          <BotonEnlace href="/notas/reporte" variante="secundario">
            <Icono nombre="lista" tamano={16} />
            Reporte semanal
          </BotonEnlace>
        }
      />
      {avances.length === 0 ? (
        <EstadoVacio
          icono="libreta"
          titulo="Aún no hay bitácoras"
          descripcion="Crea un proyecto y podrás registrar en él tu diario técnico."
          accion={<BotonEnlace href="/proyectos/nuevo">Nuevo proyecto</BotonEnlace>}
        />
      ) : (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <FiltroPeriodoNotas ruta="/notas" actual={periodo} />
            <p className="text-suave text-sm">
              Entradas y tiempo por proyecto: {ETIQUETA_PERIODO[periodo].toLowerCase()}.
            </p>
          </div>
          <ul className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {avances.map((avance) => {
              const { proyecto, ultima } = avance;
              const total = totales.get(proyecto.id);
              const sinDefinir = ultima?.proximoPaso === PROXIMO_PASO_SIN_DEFINIR;
              return (
                <li key={proyecto.id}>
                  <Tarjeta className="h-full">
                    <div className="flex items-start justify-between gap-3">
                      <Enlace
                        href={`/proyectos/${proyecto.id}/notas`}
                        discreto
                        title={proyecto.nombre}
                        className="min-w-0 truncate text-lg font-bold"
                      >
                        {proyecto.nombre}
                      </Enlace>
                    </div>
                    <div>
                      <EstadoAvance avance={avance} />
                    </div>
                    <div className="tarjeta-fila p-4">
                      <p className="text-suave text-xs font-bold tracking-wide uppercase">
                        Próximo paso
                      </p>
                      {ultima ? (
                        <p
                          title={ultima.proximoPaso}
                          className={`mt-1 line-clamp-4 text-sm leading-relaxed font-bold break-words ${sinDefinir ? "text-tenue italic" : ""}`}
                        >
                          {ultima.proximoPaso}
                        </p>
                      ) : (
                        <p className="text-suave mt-1 text-sm">
                          Aún no hay entradas. Registra la primera para dejar el rumbo claro.
                        </p>
                      )}
                    </div>
                    <p className="text-suave flex items-center gap-1.5 text-xs">
                      <Icono nombre="reloj" tamano={14} />
                      {total
                        ? `${total.entradas} ${total.entradas === 1 ? "entrada" : "entradas"} · ${total.minutos > 0 ? formatearMinutos(total.minutos) : "sin tiempo registrado"}`
                        : "Sin entradas en este período"}
                    </p>
                    <div className="mt-auto flex flex-wrap gap-2 pt-1">
                      <BotonContinuar proyectoId={proyecto.id} ultimaNotaId={ultima?.id} />
                      <BotonEnlace
                        href={`/proyectos/${proyecto.id}/notas/nueva`}
                        variante="secundario"
                      >
                        <Icono nombre="mas" tamano={16} />
                        Nueva entrada
                      </BotonEnlace>
                    </div>
                  </Tarjeta>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </>
  );
}
