import { notFound } from "next/navigation";
import { TituloSeccion } from "@/componentes/shell/titulo-seccion";
import { obtenerCredencial } from "@/lib/credenciales/operaciones";
import { listarProyectos } from "@/lib/proyectos/operaciones";
import { accionEditarCredencial } from "../../acciones";
import { FormularioCredencial } from "../../formulario-credencial";

export const metadata = { title: "Editar credencial · Autogestión" };
export const dynamic = "force-dynamic";

export default async function EditarCredencial({ params }: PageProps<"/credenciales/[id]/editar">) {
  const { id } = await params;
  const [credencial, proyectos] = await Promise.all([obtenerCredencial(id), listarProyectos()]);
  if (!credencial) notFound();

  return (
    <>
      <TituloSeccion modulo="Credenciales" titulo={`Editar ${credencial.nombre}`} />
      <FormularioCredencial
        accion={accionEditarCredencial.bind(null, credencial.id)}
        proyectos={proyectos.map(({ id: proyectoId, nombre }) => ({ id: proyectoId, nombre }))}
        valoresIniciales={{
          nombre: credencial.nombre,
          categoria: credencial.categoria,
          usuario: credencial.usuario ?? "",
          host: credencial.host ?? "",
          nota: credencial.nota ?? "",
          global: credencial.global,
          proyectoIds: credencial.proyectos.map((vinculo) => vinculo.proyecto.id),
        }}
        editando
        textoEnviar="Guardar cambios"
        rutaCancelar={`/credenciales/${credencial.id}`}
      />
    </>
  );
}
