import { BarraFiltros } from "@/componentes/barra-filtros";
import { Casilla } from "@/componentes/casilla";
import { BotonEnlace } from "@/componentes/enlace";
import { EstadoVacio } from "@/componentes/estado-vacio";
import { Icono } from "@/componentes/icono";
import { Selector } from "@/componentes/selector";
import { TituloSeccion } from "@/componentes/shell/titulo-seccion";
import { TarjetaTarea } from "@/componentes/tarea/tarjeta-tarea";
import {
  idsCompletadasHoy,
  listarTareas,
  type FiltrosTareas,
  type TareaUI,
} from "@/lib/tareas/operaciones";
import { esPendiente } from "@/lib/tareas/pendientes";
import { ESTADO_LABEL } from "@/lib/tareas/presentacion";
import { vencimientoEfectivo } from "@/lib/tareas/semaforo";
import { leerEntornoTiempo } from "@/lib/tareas/tiempo";
import { VALORES_ESTADO, estaAbierta } from "@/lib/tareas/validacion";
import { esDeHoy, semaforoDeTarea } from "@/lib/tareas/vista";
import { listarProyectos } from "@/lib/proyectos/operaciones";
import { GrupoTareas } from "./grupo-tareas";

export const dynamic = "force-dynamic";

type Vista = "hoy" | "pendientes" | "abiertas" | "completadas" | "todas";

const VISTAS: Vista[] = ["hoy", "pendientes", "abiertas", "completadas", "todas"];

// Ventanas admitidas para "vence pronto" en el listado (el panel enlaza con 10)
const DIAS_VENCEN_PRONTO = 5;
const VENTANAS_VENCEN = [DIAS_VENCEN_PRONTO, 10];

// Toma el primer valor de un parámetro de la URL
function texto(valor: string | string[] | undefined): string {
  return (Array.isArray(valor) ? valor[0] : valor) ?? "";
}

// Ordena por vencimiento efectivo ascendente; sin fecha va al final
function porVencimiento(a: TareaUI, b: TareaUI): number {
  const va = vencimientoEfectivo(a)?.getTime() ?? Number.POSITIVE_INFINITY;
  const vb = vencimientoEfectivo(b)?.getTime() ?? Number.POSITIVE_INFINITY;
  return va - vb;
}

export default async function Tareas({ searchParams }: PageProps<"/tareas">) {
  const consulta = await searchParams;
  const vistaPedida = texto(consulta.vista);
  const vista: Vista = VISTAS.includes(vistaPedida as Vista) ? (vistaPedida as Vista) : "hoy";
  const { TZ } = leerEntornoTiempo();
  const ahora = new Date();

  const [proyectos, todasLasTareas] = await Promise.all([
    listarProyectos(),
    listarTareas({ incluirCerradas: true }),
  ]);

  const estadoPedido = texto(consulta.estado);
  const proyectoPedido = texto(consulta.proyecto);
  const estado = VALORES_ESTADO.includes(estadoPedido) ? estadoPedido : "";
  const proyectoId = proyectos.some((p) => p.id === proyectoPedido) ? proyectoPedido : "";
  const ventana = Number(texto(consulta.vencen));
  const vencenPronto = VENTANAS_VENCEN.includes(ventana) && vista !== "completadas";
  const diasVencen = vencenPronto ? ventana : DIAS_VENCEN_PRONTO;
  const hayFiltros = Boolean(estado || proyectoId || vencenPronto);

  const completadasHoy = await idsCompletadasHoy(todasLasTareas.map((t) => t.id));
  const tareasDeHoy = todasLasTareas.filter((t) => esDeHoy(t, completadasHoy, ahora, TZ));
  const recurrentesHoy = tareasDeHoy.filter((t) => t.tipoFrecuencia !== "PUNTUAL");
  const puntualesHoy = tareasDeHoy.filter((t) => t.tipoFrecuencia === "PUNTUAL");

  // Pendientes: puntuales abiertas sin fecha, de la más reciente a la más antigua (ya vienen así)
  const pendientes = todasLasTareas.filter(esPendiente);

  const conteos: Record<Vista, number> = {
    hoy: tareasDeHoy.length,
    pendientes: pendientes.length,
    abiertas: todasLasTareas.filter((t) => t.activa).length,
    completadas: todasLasTareas.filter((t) => t.estado === "COMPLETADA").length,
    todas: todasLasTareas.length,
  };

  let listado: TareaUI[] = [];
  if (vista !== "hoy" && vista !== "pendientes") {
    const filtros: FiltrosTareas = {
      proyectoId: proyectoId || undefined,
      vencenEnDias: vencenPronto ? diasVencen : undefined,
      // Vencer solo tiene sentido en tareas abiertas
      incluirCerradas: vista !== "abiertas" && !vencenPronto,
    };
    if (vista === "completadas") filtros.estado = "COMPLETADA";
    else if (estado) filtros.estado = estado as NonNullable<FiltrosTareas["estado"]>;
    listado = await listarTareas(filtros);
    if (vencenPronto) listado = [...listado].sort(porVencimiento);
  }

  const botonCrear = (
    <BotonEnlace href="/tareas/nueva">
      <Icono nombre="mas" tamano={16} />
      Nueva tarea
    </BotonEnlace>
  );

  const etiquetasVista: Record<Vista, string> = {
    hoy: "Hoy",
    pendientes: "Pendientes",
    abiertas: "Abiertas",
    completadas: "Completadas",
    todas: "Todas",
  };

  const estadosFiltrables = Object.entries(ESTADO_LABEL).filter(
    ([valor]) => vista === "todas" || estaAbierta(valor),
  );

  // Las puntuales se completan desde cualquier vista; las recurrentes solo en Hoy, que es cuando tocan
  function filaDe(tarea: TareaUI, enHoy: boolean) {
    return (
      <TarjetaTarea
        key={tarea.id}
        tarea={tarea}
        semaforo={semaforoDeTarea(tarea)}
        marcable={enHoy || tarea.tipoFrecuencia === "PUNTUAL"}
        completadaHoy={completadasHoy.has(tarea.id)}
        sinFecha={esPendiente(tarea)}
      />
    );
  }

  return (
    <>
      <TituloSeccion
        modulo="Autogestión"
        titulo="Tareas"
        descripcion="Tareas recurrentes y puntuales con estado, fechas y subtareas. Mira lo de hoy, los pendientes sin fecha o filtra el listado."
        accion={botonCrear}
      />

      <nav aria-label="Vista de tareas" className="mb-6">
        <div className="tarjeta flex flex-wrap gap-1 rounded-[1.75rem] p-1.5 sm:inline-flex sm:rounded-full">
          {VISTAS.map((clave) => (
            <BotonEnlace
              key={clave}
              href={`/tareas?vista=${clave}`}
              variante={vista === clave ? "primario" : "fantasma"}
              tamano="pequeno"
              className="whitespace-nowrap"
              aria-current={vista === clave ? "page" : undefined}
            >
              {`${etiquetasVista[clave]} (${conteos[clave]})`}
            </BotonEnlace>
          ))}
        </div>
      </nav>

      {vista === "hoy" && (
        <div className="space-y-8">
          {tareasDeHoy.length === 0 ? (
            <EstadoVacio
              icono="lista"
              titulo="No hay tareas para hoy"
              descripcion="Crea una tarea diaria, semanal o mensual, o una tarea puntual para hoy."
              accion={botonCrear}
            />
          ) : (
            <>
              {recurrentesHoy.length > 0 && (
                <GrupoTareas titulo="Recurrentes de hoy" cantidad={recurrentesHoy.length}>
                  {recurrentesHoy.map((tarea) => filaDe(tarea, true))}
                </GrupoTareas>
              )}
              {puntualesHoy.length > 0 && (
                <GrupoTareas titulo="Puntuales de hoy" cantidad={puntualesHoy.length}>
                  {puntualesHoy.map((tarea) => filaDe(tarea, true))}
                </GrupoTareas>
              )}
            </>
          )}
        </div>
      )}

      {vista === "pendientes" && (
        <div className="space-y-8">
          <p className="text-suave text-sm">
            Tareas puntuales sin fecha. No aparecen en el calendario hasta que les asignes una.
          </p>
          {pendientes.length === 0 ? (
            <EstadoVacio
              icono="check-circulo"
              titulo="No tienes pendientes sin fecha"
              descripcion="Las tareas puntuales que crees sin fecha aparecerán aquí hasta que las programes."
              accion={botonCrear}
            />
          ) : (
            <GrupoTareas titulo="Pendientes sin fecha" cantidad={pendientes.length}>
              {pendientes.map((tarea) => filaDe(tarea, false))}
            </GrupoTareas>
          )}
        </div>
      )}

      {vista !== "hoy" && vista !== "pendientes" && (
        <div className="space-y-6">
          <BarraFiltros
            etiqueta="Filtrar tareas"
            hayFiltros={hayFiltros}
            rutaLimpiar={`/tareas?vista=${vista}`}
          >
            <input type="hidden" name="vista" value={vista} />
            {vista !== "completadas" ? (
              <Selector etiqueta="Estado" name="estado" defaultValue={estado}>
                <option value="">Todos los estados</option>
                {estadosFiltrables.map(([valor, etiqueta]) => (
                  <option key={valor} value={valor}>
                    {etiqueta}
                  </option>
                ))}
              </Selector>
            ) : null}
            <Selector etiqueta="Proyecto" name="proyecto" defaultValue={proyectoId}>
              <option value="">Todos los proyectos</option>
              {proyectos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </Selector>
            {vista !== "completadas" ? (
              <div className="flex items-end">
                <Casilla
                  etiqueta={`Vencen pronto (${diasVencen} días o menos)`}
                  name="vencen"
                  value={diasVencen}
                  defaultChecked={vencenPronto}
                  className="checkbox-primary checkbox-sm"
                />
              </div>
            ) : null}
          </BarraFiltros>

          {listado.length === 0 ? (
            hayFiltros ? (
              <EstadoVacio
                icono="lista"
                titulo="Ninguna tarea coincide con los filtros"
                descripcion="Prueba con otro estado o proyecto, o limpia los filtros."
                accion={
                  <BotonEnlace href={`/tareas?vista=${vista}`} variante="secundario">
                    Limpiar filtros
                  </BotonEnlace>
                }
              />
            ) : (
              <EstadoVacio
                icono="lista"
                titulo={
                  vista === "completadas"
                    ? "Aún no hay tareas completadas"
                    : "No hay tareas todavía"
                }
                descripcion={
                  vista === "completadas"
                    ? "Las tareas puntuales que completes aparecerán aquí."
                    : "Crea tu primera tarea para empezar a organizar tu trabajo."
                }
                accion={botonCrear}
              />
            )
          ) : (
            <GrupoTareas titulo={etiquetasVista[vista]} cantidad={listado.length}>
              {listado.map((tarea) => filaDe(tarea, false))}
            </GrupoTareas>
          )}
        </div>
      )}
    </>
  );
}
