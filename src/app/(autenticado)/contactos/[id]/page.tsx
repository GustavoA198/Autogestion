import { notFound } from "next/navigation";
import { BotonEnlace, Enlace } from "@/componentes/enlace";
import { Clipboard } from "@/componentes/clipboard";
import { Icono } from "@/componentes/icono";
import { Insignia } from "@/componentes/insignia";
import { ListaDatos } from "@/componentes/lista-datos";
import { Tarjeta } from "@/componentes/shell/tarjeta";
import { TituloSeccion } from "@/componentes/shell/titulo-seccion";
import { obtenerContacto } from "@/lib/contactos/operaciones";
import { BotonEliminarContacto } from "./boton-eliminar";

export const dynamic = "force-dynamic";

export default async function FichaContacto({ params }: PageProps<"/contactos/[id]">) {
  const { id } = await params;
  const contacto = await obtenerContacto(id);
  if (!contacto) notFound();

  return (
    <>
      <TituloSeccion
        modulo="Contacto"
        titulo={contacto.nombre}
        descripcion={contacto.empresaOCargo ?? undefined}
        accion={
          <>
            <BotonEnlace href={`/contactos/${contacto.id}/editar`} variante="secundario">
              <Icono nombre="editar" tamano={16} />
              Editar
            </BotonEnlace>
            <BotonEliminarContacto id={contacto.id} nombre={contacto.nombre} />
          </>
        }
      />
      <div className="max-w-3xl space-y-5">
        <Tarjeta titulo="Datos">
          <ListaDatos
            filas={[
              {
                etiqueta: "Correo",
                valor: (
                  <span className="flex flex-wrap items-center gap-x-2">
                    <Enlace href={`mailto:${contacto.correo}`} className="break-all">
                      {contacto.correo}
                    </Enlace>
                    <Clipboard texto={contacto.correo} etiqueta="Copiar correo" />
                  </span>
                ),
              },
              { etiqueta: "Teléfono", valor: contacto.telefono },
              { etiqueta: "Empresa o cargo", valor: contacto.empresaOCargo },
              {
                etiqueta: "Nota",
                valor: contacto.nota ? (
                  <span className="whitespace-pre-wrap">{contacto.nota}</span>
                ) : null,
              },
              {
                etiqueta: "Alcance",
                valor:
                  contacto.global || contacto.proyectos.length > 0 ? (
                    <span className="flex flex-wrap items-center gap-2">
                      {contacto.global ? <Insignia tono="primary">Global</Insignia> : null}
                      {contacto.proyectos.map(({ proyecto }) => (
                        <Enlace key={proyecto.id} href={`/proyectos/${proyecto.id}`}>
                          {proyecto.nombre}
                        </Enlace>
                      ))}
                    </span>
                  ) : (
                    <span className="text-suave">Sin proyectos asociados</span>
                  ),
              },
            ]}
          />
        </Tarjeta>
      </div>
    </>
  );
}
