import { BarraFiltros } from "@/componentes/barra-filtros";
import { BotonEnlace, Enlace } from "@/componentes/enlace";
import { EstadoVacio } from "@/componentes/estado-vacio";
import { Icono } from "@/componentes/icono";
import { Insignia } from "@/componentes/insignia";
import { Selector } from "@/componentes/selector";
import { TituloSeccion } from "@/componentes/shell/titulo-seccion";
import { Tabla } from "@/componentes/tabla";
import { CATEGORIAS, esCategoria } from "@/lib/credenciales/categorias";
import { listarCredenciales } from "@/lib/credenciales/operaciones";
import { listarProyectos } from "@/lib/proyectos/operaciones";
import { tiempoRelativo } from "@/lib/tiempo";
import { SecretoCredencial } from "./secreto-credencial";

export const dynamic = "force-dynamic";

function primero(valor: string | string[] | undefined): string | undefined {
  const texto = Array.isArray(valor) ? valor[0] : valor;
  return texto || undefined;
}

export default async function Credenciales({ searchParams }: PageProps<"/credenciales">) {
  const consulta = await searchParams;
  const categoria = primero(consulta.categoria);
  const alcance = primero(consulta.alcance);
  const filtroCategoria = esCategoria(categoria) ? categoria : undefined;
  const hayFiltros = Boolean(filtroCategoria || alcance);

  const [credenciales, proyectos] = await Promise.all([
    listarCredenciales({ categoria: filtroCategoria, alcance }),
    listarProyectos(),
  ]);
  const botonCrear = (
    <BotonEnlace href="/credenciales/nueva">
      <Icono nombre="mas" tamano={16} />
      Nueva credencial
    </BotonEnlace>
  );
  // Sin filtros ni registros aún no hay nada que filtrar
  const bovedaVacia = credenciales.length === 0 && !hayFiltros;

  return (
    <>
      <TituloSeccion
        modulo="Bóveda"
        titulo="Credenciales"
        descripcion="Accesos globales, de un proyecto o compartidos entre varios."
        accion={bovedaVacia ? undefined : botonCrear}
      />
      {bovedaVacia ? (
        <EstadoVacio
          icono="llave"
          titulo="La bóveda está vacía"
          descripcion="Las credenciales se almacenan cifradas y pueden ser globales o asociarse a uno o varios proyectos."
          accion={botonCrear}
        />
      ) : (
        <div className="space-y-5">
          <BarraFiltros
            etiqueta="Filtros de credenciales"
            hayFiltros={hayFiltros}
            rutaLimpiar="/credenciales"
          >
            <Selector etiqueta="Categoría" name="categoria" defaultValue={filtroCategoria ?? ""}>
              <option value="">Todas</option>
              {Object.entries(CATEGORIAS).map(([valor, etiqueta]) => (
                <option key={valor} value={valor}>
                  {etiqueta}
                </option>
              ))}
            </Selector>
            <Selector etiqueta="Alcance" name="alcance" defaultValue={alcance ?? ""}>
              <option value="">Todos</option>
              <option value="global">Globales</option>
              {proyectos.map((proyecto) => (
                <option key={proyecto.id} value={proyecto.id}>
                  {proyecto.nombre}
                </option>
              ))}
            </Selector>
          </BarraFiltros>
          {credenciales.length === 0 ? (
            <EstadoVacio
              icono="llave"
              titulo="Ninguna credencial coincide con los filtros"
              descripcion="Prueba con otra categoría o alcance, o limpia los filtros."
            />
          ) : (
            <Tabla apilada="ancha" aria-label="Listado de credenciales">
              <thead>
                <tr>
                  <th scope="col">Nombre</th>
                  <th scope="col" className="xl:max-2xl:hidden">
                    Categoría
                  </th>
                  <th scope="col">Usuario</th>
                  <th scope="col">Alcance</th>
                  <th scope="col">Secreto</th>
                  <th scope="col" className="xl:max-2xl:hidden">
                    Actualizado
                  </th>
                </tr>
              </thead>
              <tbody>
                {credenciales.map((credencial) => (
                  <tr key={credencial.id}>
                    <th scope="row" className="font-bold">
                      <Enlace
                        href={`/credenciales/${credencial.id}`}
                        discreto
                        title={credencial.nombre}
                        className="block max-w-56 truncate"
                      >
                        {credencial.nombre}
                      </Enlace>
                    </th>
                    <td data-etiqueta="Categoría" className="xl:max-2xl:hidden">
                      <Insignia tono="info" contorno>
                        {CATEGORIAS[credencial.categoria]}
                      </Insignia>
                    </td>
                    <td data-etiqueta="Usuario" className="font-mono text-sm">
                      <span
                        className="block max-w-40 truncate"
                        title={credencial.usuario ?? undefined}
                      >
                        {credencial.usuario ?? "—"}
                      </span>
                    </td>
                    <td data-etiqueta="Alcance">
                      {credencial.global ? (
                        <Insignia tono="primary">Global</Insignia>
                      ) : credencial.proyectos.length > 0 ? (
                        <span
                          className="block max-w-48 truncate"
                          title={credencial.proyectos
                            .map(({ proyecto }) => proyecto.nombre)
                            .join(", ")}
                        >
                          {credencial.proyectos.map(({ proyecto }) => proyecto.nombre).join(", ")}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td data-etiqueta="Secreto">
                      <SecretoCredencial id={credencial.id} nombre={credencial.nombre} />
                    </td>
                    <td
                      data-etiqueta="Actualizado"
                      className="text-suave font-mono text-xs whitespace-nowrap xl:max-2xl:hidden"
                    >
                      {tiempoRelativo(credencial.secretoActualizadoEn)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Tabla>
          )}
        </div>
      )}
    </>
  );
}
