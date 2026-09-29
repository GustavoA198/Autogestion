import type { ReactNode } from "react";
import { Boton } from "@/componentes/boton";
import { Enlace } from "@/componentes/enlace";
import { Entrada } from "@/componentes/entrada";
import { EstadoError } from "@/componentes/estado-error";
import { EstadoVacio } from "@/componentes/estado-vacio";
import { Icono, type NombreIcono } from "@/componentes/icono";
import { Insignia } from "@/componentes/insignia";
import { Tarjeta } from "@/componentes/shell/tarjeta";
import { TituloSeccion } from "@/componentes/shell/titulo-seccion";
import { accionBuscar } from "./acciones";

export const dynamic = "force-dynamic";

function primero(valor: string | string[] | undefined): string | undefined {
  const texto = Array.isArray(valor) ? valor[0] : valor;
  return texto || undefined;
}

type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

// Formulario de búsqueda propio de la página, además del buscador de la cabecera
function FormularioBusqueda({ termino }: { termino?: string }) {
  return (
    <form
      method="get"
      role="search"
      aria-label="Buscar en toda la aplicación"
      className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end"
    >
      <div className="max-w-xl flex-1">
        <Entrada
          etiqueta="Término de búsqueda"
          name="q"
          type="search"
          defaultValue={termino}
          placeholder="Credencial, contacto, nota o tarea"
          autoComplete="off"
        />
      </div>
      <Boton type="submit">
        <Icono nombre="busqueda" tamano={16} />
        Buscar
      </Boton>
    </form>
  );
}

function Grupo({
  id,
  titulo,
  icono,
  cantidad,
  children,
}: {
  id: string;
  titulo: string;
  icono: NombreIcono;
  cantidad: number;
  children: ReactNode;
}) {
  if (cantidad === 0) return null;
  return (
    <section aria-labelledby={id}>
      <Tarjeta>
        <h2 id={id} className="flex items-center gap-2 text-lg font-bold">
          <span className="bg-primary/15 text-primary grid size-9 place-items-center rounded-full">
            <Icono nombre={icono} tamano={16} />
          </span>
          {titulo}
          <Insignia tono="ghost">{cantidad}</Insignia>
        </h2>
        <ul className="lista-filas">{children}</ul>
      </Tarjeta>
    </section>
  );
}

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
        <FormularioBusqueda />
        <EstadoVacio
          icono="busqueda"
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
        <FormularioBusqueda termino={termino} />
        <EstadoError titulo="No se pudo buscar" mensaje={resultado.error} />
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
        <FormularioBusqueda termino={termino} />
        <EstadoVacio
          icono="busqueda"
          titulo="Sin resultados"
          descripcion={`No se encontró nada para "${termino}". Prueba con otra palabra.`}
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
      <FormularioBusqueda termino={termino} />
      <div className="grid gap-5 lg:grid-cols-2">
        <Grupo
          id="credenciales-heading"
          titulo="Credenciales"
          icono="llave"
          cantidad={resultados.credenciales.length}
        >
          {resultados.credenciales.map((item) => (
            <li key={item.id} className="tarjeta-fila px-4 py-3 font-bold">
              <Enlace href={`/credenciales/${item.id}`} discreto>
                {item.nombre}
              </Enlace>
            </li>
          ))}
        </Grupo>

        <Grupo
          id="contactos-heading"
          titulo="Contactos"
          icono="usuarios"
          cantidad={resultados.contactos.length}
        >
          {resultados.contactos.map((item) => (
            <li key={item.id} className="tarjeta-fila px-4 py-3 font-bold">
              <Enlace href={`/contactos/${item.id}`} discreto>
                {item.nombre}
              </Enlace>
              {item.correo ? (
                <span className="text-suave block text-sm break-all">{item.correo}</span>
              ) : null}
            </li>
          ))}
        </Grupo>

        <Grupo id="notas-heading" titulo="Notas" icono="libreta" cantidad={resultados.notas.length}>
          {resultados.notas.map((item) => (
            <li key={item.id} className="tarjeta-fila px-4 py-3 font-bold">
              <Enlace
                href={`/proyectos/${item.proyectoId}/notas/${item.id}`}
                discreto
                title={item.texto}
                className="line-clamp-2 break-words"
              >
                {item.texto}
              </Enlace>
            </li>
          ))}
        </Grupo>

        <Grupo
          id="tareas-heading"
          titulo="Tareas"
          icono="lista"
          cantidad={resultados.tareas.length}
        >
          {resultados.tareas.map((item) => (
            <li key={item.id} className="tarjeta-fila px-4 py-3 font-bold">
              <Enlace href={`/tareas/${item.id}`} discreto>
                {item.titulo}
              </Enlace>
            </li>
          ))}
        </Grupo>
      </div>
    </>
  );
}
