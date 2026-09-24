import Link from "next/link";
import { notFound } from "next/navigation";
import { Insignia } from "@/componentes/insignia";
import { Tarjeta } from "@/componentes/shell/tarjeta";
import { TituloSeccion } from "@/componentes/shell/titulo-seccion";
import { Clipboard } from "@/componentes/clipboard";
import { obtenerContacto } from "@/lib/contactos/operaciones";
import { BotonEliminarContacto } from "./boton-eliminar";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/contactos/[id]">) {
  const { id } = await params;
  const contacto = await obtenerContacto(id);
  return { title: `${contacto?.nombre ?? "Contacto"} · Autogestion` };
}

export default async function FichaContacto({ params }: PageProps<"/contactos/[id]">) {
  const { id } = await params;
  const contacto = await obtenerContacto(id);
  if (!contacto) notFound();

  return (
    <>
      <TituloSeccion
        modulo="Contacto"
        titulo={contacto.nombre}
        accion={
          <>
            <Link href={`/contactos/${contacto.id}/editar`} className="btn btn-outline">
              Editar
            </Link>
            <BotonEliminarContacto id={contacto.id} nombre={contacto.nombre} />
          </>
        }
      />
      <div className="space-y-6">
        <Tarjeta titulo="Datos">
          <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-[10rem_1fr]">
            <dt className="opacity-70">Correo</dt>
            <dd className="flex items-center gap-2">
              <a href={`mailto:${contacto.correo}`} className="link link-hover">
                {contacto.correo}
              </a>
              <Clipboard texto={contacto.correo} />
            </dd>
            <dt className="opacity-70">Telefono</dt>
            <dd>{contacto.telefono ?? "—"}</dd>
            <dt className="opacity-70">Empresa / Cargo</dt>
            <dd>{contacto.empresaOCargo ?? "—"}</dd>
            <dt className="opacity-70">Nota</dt>
            <dd className="whitespace-pre-wrap">{contacto.nota ?? "—"}</dd>
            <dt className="opacity-70">Alcance</dt>
            <dd className="flex flex-wrap gap-2">
              {contacto.global ? <Insignia tono="primary">Global</Insignia> : null}
              {contacto.proyectos.map(({ proyecto }) => (
                <Link key={proyecto.id} href={`/proyectos/${proyecto.id}`} className="link">
                  {proyecto.nombre}
                </Link>
              ))}
              {!contacto.global && contacto.proyectos.length === 0 ? (
                <span className="opacity-70">Sin proyectos asociados</span>
              ) : null}
            </dd>
          </dl>
        </Tarjeta>
      </div>
    </>
  );
}
