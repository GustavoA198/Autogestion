import { notFound } from "next/navigation";
import { BotonEnlace, Enlace } from "@/componentes/enlace";
import { Icono } from "@/componentes/icono";
import { Insignia } from "@/componentes/insignia";
import { ListaDatos } from "@/componentes/lista-datos";
import { Tarjeta } from "@/componentes/shell/tarjeta";
import { TituloSeccion } from "@/componentes/shell/titulo-seccion";
import { Tabla } from "@/componentes/tabla";
import { CATEGORIAS } from "@/lib/credenciales/categorias";
import { obtenerCredencial } from "@/lib/credenciales/operaciones";
import { tiempoRelativo } from "@/lib/tiempo";
import { SecretoCredencial } from "../secreto-credencial";
import { BotonEliminarCredencial } from "./boton-eliminar";

export const dynamic = "force-dynamic";

const FORMATO_FECHA = new Intl.DateTimeFormat("es", { dateStyle: "medium", timeStyle: "short" });

export default async function FichaCredencial({ params }: PageProps<"/credenciales/[id]">) {
  const { id } = await params;
  const credencial = await obtenerCredencial(id);
  if (!credencial) notFound();

  return (
    <>
      <TituloSeccion
        modulo="Credencial"
        titulo={credencial.nombre}
        descripcion={
          <>
            Secreto actualizado {tiempoRelativo(credencial.secretoActualizadoEn)} (
            {FORMATO_FECHA.format(credencial.secretoActualizadoEn)})
          </>
        }
        accion={
          <>
            <BotonEnlace href={`/credenciales/${credencial.id}/editar`} variante="secundario">
              <Icono nombre="editar" tamano={16} />
              Editar
            </BotonEnlace>
            <BotonEliminarCredencial id={credencial.id} nombre={credencial.nombre} />
          </>
        }
      />
      <div className="max-w-3xl space-y-5">
        <Tarjeta titulo="Datos">
          <ListaDatos
            filas={[
              {
                etiqueta: "Categoría",
                valor: (
                  <Insignia tono="info" contorno>
                    {CATEGORIAS[credencial.categoria]}
                  </Insignia>
                ),
              },
              {
                etiqueta: "Usuario",
                valor: credencial.usuario ? (
                  <span className="font-mono">{credencial.usuario}</span>
                ) : null,
              },
              {
                etiqueta: "Secreto",
                valor: <SecretoCredencial id={credencial.id} nombre={credencial.nombre} />,
              },
              {
                etiqueta: "Host o URL",
                valor: credencial.host ? (
                  <span className="font-mono break-all">{credencial.host}</span>
                ) : null,
              },
              {
                etiqueta: "Nota",
                valor: credencial.nota ? (
                  <span className="whitespace-pre-wrap">{credencial.nota}</span>
                ) : null,
              },
              {
                etiqueta: "Alcance",
                valor:
                  credencial.global || credencial.proyectos.length > 0 ? (
                    <span className="flex flex-wrap items-center gap-2">
                      {credencial.global ? <Insignia tono="primary">Global</Insignia> : null}
                      {credencial.proyectos.map(({ proyecto }) => (
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
        <Tarjeta titulo="Historial de cambios">
          {credencial.historial.length === 0 ? (
            <p className="text-suave text-sm">Esta credencial aún no ha sido modificada.</p>
          ) : (
            <Tabla aria-label="Historial de cambios" sinMarco>
              <thead>
                <tr>
                  <th scope="col">Fecha</th>
                  <th scope="col">Campo modificado</th>
                </tr>
              </thead>
              <tbody>
                {credencial.historial.map((cambio) => (
                  <tr key={cambio.id}>
                    <td data-etiqueta="Fecha" className="font-mono text-sm">
                      {FORMATO_FECHA.format(cambio.fecha)}
                    </td>
                    <td data-etiqueta="Campo modificado">{cambio.campo}</td>
                  </tr>
                ))}
              </tbody>
            </Tabla>
          )}
        </Tarjeta>
      </div>
    </>
  );
}
