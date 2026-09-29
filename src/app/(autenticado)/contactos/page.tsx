import { BarraFiltros } from "@/componentes/barra-filtros";
import { BotonEnlace, Enlace } from "@/componentes/enlace";
import { Entrada } from "@/componentes/entrada";
import { EstadoVacio } from "@/componentes/estado-vacio";
import { Icono } from "@/componentes/icono";
import { Insignia } from "@/componentes/insignia";
import { Selector } from "@/componentes/selector";
import { TituloSeccion } from "@/componentes/shell/titulo-seccion";
import { Tabla } from "@/componentes/tabla";
import { listarContactos } from "@/lib/contactos/operaciones";
import { listarProyectos } from "@/lib/proyectos/operaciones";
import { tiempoRelativo } from "@/lib/tiempo";

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
    <BotonEnlace href="/contactos/nueva">
      <Icono nombre="mas" tamano={16} />
      Nuevo contacto
    </BotonEnlace>
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
          titulo="Tu libreta está vacía"
          descripcion="Podrás registrar contactos globales, de un único proyecto o compartidos entre varios frentes."
          accion={botonCrear}
        />
      ) : (
        <div className="space-y-5">
          <BarraFiltros
            etiqueta="Filtros de contactos"
            hayFiltros={hayFiltros}
            rutaLimpiar="/contactos"
          >
            <Entrada
              etiqueta="Buscar"
              name="texto"
              type="search"
              defaultValue={texto ?? ""}
              placeholder="Nombre, correo o empresa"
            />
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
          {contactos.length === 0 ? (
            <EstadoVacio
              icono="usuarios"
              titulo="Ningún contacto coincide con los filtros"
              descripcion="Prueba con otro texto o alcance, o limpia los filtros."
            />
          ) : (
            <Tabla apilada="ancha" aria-label="Listado de contactos">
              <thead>
                <tr>
                  <th scope="col">Nombre</th>
                  <th scope="col">Correo</th>
                  <th scope="col">Empresa / Cargo</th>
                  <th scope="col">Alcance</th>
                  <th scope="col" className="xl:max-2xl:hidden">
                    Actualizado
                  </th>
                </tr>
              </thead>
              <tbody>
                {contactos.map((contacto) => (
                  <tr key={contacto.id}>
                    <th scope="row" className="font-bold">
                      <Enlace
                        href={`/contactos/${contacto.id}`}
                        discreto
                        title={contacto.nombre}
                        className="block max-w-56 truncate"
                      >
                        {contacto.nombre}
                      </Enlace>
                    </th>
                    <td data-etiqueta="Correo" className="font-mono text-sm">
                      <a
                        href={`mailto:${contacto.correo}`}
                        title={contacto.correo}
                        className="enlace block max-w-64 min-w-0 truncate"
                      >
                        {contacto.correo}
                      </a>
                    </td>
                    <td data-etiqueta="Empresa / Cargo">
                      <span
                        className="block max-w-52 truncate"
                        title={contacto.empresaOCargo ?? undefined}
                      >
                        {contacto.empresaOCargo ?? "—"}
                      </span>
                    </td>
                    <td data-etiqueta="Alcance">
                      {contacto.global ? (
                        <Insignia tono="primary">Global</Insignia>
                      ) : contacto.proyectos.length > 0 ? (
                        <span
                          className="block max-w-48 truncate"
                          title={contacto.proyectos
                            .map(({ proyecto }) => proyecto.nombre)
                            .join(", ")}
                        >
                          {contacto.proyectos.map(({ proyecto }) => proyecto.nombre).join(", ")}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td
                      data-etiqueta="Actualizado"
                      className="text-suave font-mono text-xs whitespace-nowrap xl:max-2xl:hidden"
                    >
                      {tiempoRelativo(contacto.actualizadoEn)}
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
