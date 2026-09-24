import Link from "next/link";
import { EstadoError } from "@/componentes/estado-error";
import { EstadoVacio } from "@/componentes/estado-vacio";
import { TituloSeccion } from "@/componentes/shell/titulo-seccion";
import { accionBuscar } from "./acciones";

export const metadata = { title: "Buscar · Autogestión" };
export const dynamic = "force-dynamic";

function primero(valor: string | string[] | undefined): string | undefined {
  const texto = Array.isArray(valor) ? valor[0] : valor;
  return texto || undefined;
}

type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function PaginaBuscar({ searchParams }: PageProps) {
  const params = await searchParams;
  const termino = primero(params.q);

  if (!termino) {
    return (
      <>
        <TituloSeccion
          modulo="Herramientas"
          titulo="Buscar"
          descripcion="Busca en todas tus credenciales, contactos, notas y tareas."
        />
        <EstadoVacio
          icono="panel"
          titulo="Escribe un término"
          descripcion="Usa Ctrl+K para enfocar el buscador desde cualquier página."
        />
      </>
    );
  }

  const resultado = await accionBuscar(termino);

  if (!resultado.ok) {
    return (
      <>
        <TituloSeccion modulo="Herramientas" titulo="Buscar" />
        <EstadoError mensaje={resultado.error} />
      </>
    );
  }

  const { resultados } = resultado;
  const total =
    resultados.credenciales.length +
    resultados.contactos.length +
    resultados.notas.length +
    resultados.tareas.length;

  if (total === 0) {
    return (
      <>
        <TituloSeccion modulo="Herramientas" titulo="Buscar" />
        <EstadoVacio
          icono="panel"
          titulo="Sin resultados"
          descripcion={`No se encontró nada para "${termino}".`}
        />
      </>
    );
  }

  return (
    <>
      <TituloSeccion
        modulo="Herramientas"
        titulo="Buscar"
        descripcion={`${total} resultado${total !== 1 ? "s" : ""} para "${termino}"`}
      />
      <div className="space-y-8">
        {resultados.credenciales.length > 0 && (
          <section aria-labelledby="credenciales-heading">
            <h2 id="credenciales-heading" className="mb-3 text-lg font-semibold">
              Credenciales
              <span className="badge badge-ghost ml-2">{resultados.credenciales.length}</span>
            </h2>
            <ul className="space-y-2">
              {resultados.credenciales.map((item) => (
                <li key={item.id}>
                  <Link href={`/credenciales/${item.id}`} className="link link-hover">
                    {item.nombre}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {resultados.contactos.length > 0 && (
          <section aria-labelledby="contactos-heading">
            <h2 id="contactos-heading" className="mb-3 text-lg font-semibold">
              Contactos
              <span className="badge badge-ghost ml-2">{resultados.contactos.length}</span>
            </h2>
            <ul className="space-y-2">
              {resultados.contactos.map((item) => (
                <li key={item.id}>
                  <Link href={`/contactos/${item.id}`} className="link link-hover">
                    {item.nombre}
                  </Link>
                  {item.correo && <span className="ml-2 text-sm opacity-60">{item.correo}</span>}
                </li>
              ))}
            </ul>
          </section>
        )}

        {resultados.notas.length > 0 && (
          <section aria-labelledby="notas-heading">
            <h2 id="notas-heading" className="mb-3 text-lg font-semibold">
              Notas
              <span className="badge badge-ghost ml-2">{resultados.notas.length}</span>
            </h2>
            <ul className="space-y-2">
              {resultados.notas.map((item) => (
                <li key={item.id} className="truncate">
                  <Link
                    href={`/proyectos/${item.proyectoId}/notas/${item.id}`}
                    className="link link-hover"
                  >
                    {item.texto}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {resultados.tareas.length > 0 && (
          <section aria-labelledby="tareas-heading">
            <h2 id="tareas-heading" className="mb-3 text-lg font-semibold">
              Tareas
              <span className="badge badge-ghost ml-2">{resultados.tareas.length}</span>
            </h2>
            <ul className="space-y-2">
              {resultados.tareas.map((item) => (
                <li key={item.id}>
                  <Link href={`/tareas/${item.id}`} className="link link-hover">
                    {item.titulo}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}
