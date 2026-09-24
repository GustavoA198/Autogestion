import Link from "next/link";
import { EstadoVacio } from "@/componentes/estado-vacio";
import { Tabla } from "@/componentes/tabla";
import { TituloSeccion } from "@/componentes/shell/titulo-seccion";
import { listarProyectos } from "@/lib/proyectos/operaciones";
import { EnlaceDocumentacion } from "./enlace-documentacion";

export const metadata = { title: "Proyectos · Autogestión" };
export const dynamic = "force-dynamic";

export default async function Proyectos() {
  const proyectos = await listarProyectos();
  const botonCrear = (
    <Link href="/proyectos/nuevo" className="btn btn-primary">
      Nuevo proyecto
    </Link>
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
        <Tabla aria-label="Listado de proyectos">
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
                <th scope="row" className="font-medium">
                  <Link href={`/proyectos/${proyecto.id}`} className="link link-hover">
                    {proyecto.nombre}
                  </Link>
                </th>
                <td className="max-w-xs truncate">{proyecto.descripcion ?? "—"}</td>
                <td>
                  {proyecto.enlaceDocumentacion ? (
                    <EnlaceDocumentacion url={proyecto.enlaceDocumentacion} />
                  ) : (
                    "—"
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
