import { BotonEnlace, Enlace } from "@/componentes/enlace";
import { EstadoVacio } from "@/componentes/estado-vacio";
import { Icono } from "@/componentes/icono";
import { Tabla } from "@/componentes/tabla";
import { TituloSeccion } from "@/componentes/shell/titulo-seccion";
import { listarProyectos } from "@/lib/proyectos/operaciones";
import { EnlaceDocumentacion } from "./enlace-documentacion";

export const dynamic = "force-dynamic";

export default async function Proyectos() {
  const proyectos = await listarProyectos();
  const botonCrear = (
    <BotonEnlace href="/proyectos/nuevo">
      <Icono nombre="mas" tamano={16} />
      Nuevo proyecto
    </BotonEnlace>
  );

  return (
    <>
      <TituloSeccion
        modulo="Frentes de trabajo"
        titulo="Proyectos"
        descripcion="Fichas livianas de cada frente, con enlace a su documentación."
        accion={proyectos.length > 0 ? botonCrear : undefined}
      />
      {proyectos.length === 0 ? (
        <EstadoVacio
          icono="proyectos"
          titulo="Aún no tienes proyectos registrados"
          descripcion="Crea tu primer proyecto para agrupar sus credenciales, contactos, tareas y notas."
          accion={botonCrear}
        />
      ) : (
        <Tabla apilada="ancha" aria-label="Listado de proyectos">
          <thead>
            <tr>
              <th scope="col">Nombre</th>
              <th scope="col">Descripción</th>
              <th scope="col">Documentación</th>
            </tr>
          </thead>
          <tbody>
            {proyectos.map((proyecto) => (
              <tr key={proyecto.id}>
                <th scope="row" className="font-bold">
                  <Enlace
                    href={`/proyectos/${proyecto.id}`}
                    discreto
                    title={proyecto.nombre}
                    className="block max-w-64 truncate"
                  >
                    {proyecto.nombre}
                  </Enlace>
                </th>
                <td data-etiqueta="Descripción">
                  <span
                    className="block max-w-xs truncate"
                    title={proyecto.descripcion ?? undefined}
                  >
                    {proyecto.descripcion ?? "—"}
                  </span>
                </td>
                <td data-etiqueta="Documentación">
                  {proyecto.enlaceDocumentacion ? (
                    <EnlaceDocumentacion url={proyecto.enlaceDocumentacion} />
                  ) : (
                    <span className="text-tenue">Sin enlace</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Tabla>
      )}
    </>
  );
}
