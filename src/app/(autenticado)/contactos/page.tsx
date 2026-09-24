import Link from "next/link";
import { EstadoVacio } from "@/componentes/estado-vacio";
import { Insignia } from "@/componentes/insignia";
import { Selector } from "@/componentes/selector";
import { TituloSeccion } from "@/componentes/shell/titulo-seccion";
import { Tabla } from "@/componentes/tabla";
import { listarContactos } from "@/lib/contactos/operaciones";
import { listarProyectos } from "@/lib/proyectos/operaciones";
import { tiempoRelativo } from "@/lib/tiempo";

export const metadata = { title: "Contactos · Autogestion" };
export const dynamic = "force-dynamic";

function primero(valor: string | string[] | undefined): string | undefined {
  const texto = Array.isArray(valor) ? valor[0] : valor;
  return texto || undefined;
}

export default async function Contactos({ searchParams }: PageProps<"/contactos">) {
  const consulta = await searchParams;
  const texto = primero(consulta.texto);
  const alcance = primero(consulta.alcance);
  const hayFiltros = Boolean(texto || alcance);

  const [contactos, proyectos] = await Promise.all([
    listarContactos({ texto, alcance }),
    listarProyectos(),
  ]);
  const botonCrear = (
    <Link href="/contactos/nueva" className="btn btn-primary">
      Nuevo contacto
    </Link>
  );
  const listaVacia = contactos.length === 0 && !hayFiltros;

  return (
    <>
      <TituloSeccion
        modulo="Libreta"
        titulo="Contactos"
        descripcion="Personas de contacto globales o asociadas a proyectos."
        accion={listaVacia ? undefined : botonCrear}
      />
      {listaVacia ? (
        <EstadoVacio
          icono="usuarios"
          titulo="Tu libreta esta vacia"
          descripcion="Podras registrar contactos globales, de un unico proyecto o compartidos entre varios frentes."
          accion={botonCrear}
        />
      ) : (
        <div className="space-y-4">
          <form method="get" className="flex flex-wrap items-end gap-3" aria-label="Filtros">
            <Selector etiqueta="Buscar" name="texto" defaultValue={texto ?? ""}>
              <option value="">Todos</option>
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
              <Link href="/contactos" className="btn btn-ghost">
                Limpiar filtros
              </Link>
            ) : null}
          </form>
          {contactos.length === 0 ? (
            <EstadoVacio
              icono="usuarios"
              titulo="Ningun contacto coincide con los filtros"
              descripcion="Prueba con otro texto o alcance, o limpia los filtros."
            />
          ) : (
            <Tabla aria-label="Listado de contactos">
              <thead>
                <tr>
                  <th scope="col">Nombre</th>
                  <th scope="col">Correo</th>
                  <th scope="col">Empresa / Cargo</th>
                  <th scope="col">Alcance</th>
                  <th scope="col">Actualizado</th>
                </tr>
              </thead>
              <tbody>
                {contactos.map((contacto) => (
                  <tr key={contacto.id}>
                    <th scope="row" className="font-medium">
                      <Link href={`/contactos/${contacto.id}`} className="link link-hover">
                        {contacto.nombre}
                      </Link>
                    </th>
                    <td>
                      <a href={`mailto:${contacto.correo}`} className="link link-hover">
                        {contacto.correo}
                      </a>
                    </td>
                    <td>{contacto.empresaOCargo ?? "—"}</td>
                    <td>
                      {contacto.global ? (
                        <Insignia tono="primary">Global</Insignia>
                      ) : contacto.proyectos.length > 0 ? (
                        contacto.proyectos.map(({ proyecto }) => (
                          <span key={proyecto.id} className="mr-1">
                            {proyecto.nombre}
                          </span>
                        ))
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="whitespace-nowrap">{tiempoRelativo(contacto.actualizadoEn)}</td>
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
