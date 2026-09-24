import Link from "next/link";
import { EstadoVacio } from "@/componentes/estado-vacio";
import { Insignia } from "@/componentes/insignia";
import { Selector } from "@/componentes/selector";
import { TituloSeccion } from "@/componentes/shell/titulo-seccion";
import { Tabla } from "@/componentes/tabla";
import { CATEGORIAS, esCategoria } from "@/lib/credenciales/categorias";
import { listarCredenciales } from "@/lib/credenciales/operaciones";
import { listarProyectos } from "@/lib/proyectos/operaciones";
import { tiempoRelativo } from "@/lib/tiempo";
import { SecretoCredencial } from "./secreto-credencial";

export const metadata = { title: "Credenciales · Autogestión" };
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
    <Link href="/credenciales/nueva" className="btn btn-primary">
      Nueva credencial
    </Link>
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
        <div className="space-y-4">
          <form method="get" className="flex flex-wrap items-end gap-3" aria-label="Filtros">
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
            <button type="submit" className="btn btn-outline">
              Filtrar
            </button>
            {hayFiltros ? (
              <Link href="/credenciales" className="btn btn-ghost">
                Limpiar filtros
              </Link>
            ) : null}
          </form>
          {credenciales.length === 0 ? (
            <EstadoVacio
              icono="llave"
              titulo="Ninguna credencial coincide con los filtros"
              descripcion="Prueba con otra categoría o alcance, o limpia los filtros."
            />
          ) : (
            <Tabla aria-label="Listado de credenciales">
              <thead>
                <tr>
                  <th scope="col">Nombre</th>
                  <th scope="col">Categoría</th>
                  <th scope="col">Usuario</th>
                  <th scope="col">Alcance</th>
                  <th scope="col">Secreto</th>
                  <th scope="col">Actualizado</th>
                </tr>
              </thead>
              <tbody>
                {credenciales.map((credencial) => (
                  <tr key={credencial.id}>
                    <th scope="row" className="font-medium">
                      <Link href={`/credenciales/${credencial.id}`} className="link link-hover">
                        {credencial.nombre}
                      </Link>
                    </th>
                    <td>
                      <Insignia tono="info" contorno>
                        {CATEGORIAS[credencial.categoria]}
                      </Insignia>
                    </td>
                    <td>{credencial.usuario ?? "—"}</td>
                    <td>
                      {credencial.global ? (
                        <Insignia tono="primary">Global</Insignia>
                      ) : credencial.proyectos.length > 0 ? (
                        credencial.proyectos.map(({ proyecto }) => proyecto.nombre).join(", ")
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      <SecretoCredencial id={credencial.id} nombre={credencial.nombre} />
                    </td>
                    <td className="whitespace-nowrap">
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
