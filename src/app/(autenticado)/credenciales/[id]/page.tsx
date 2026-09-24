import Link from "next/link";
import { notFound } from "next/navigation";
import { Insignia } from "@/componentes/insignia";
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

export async function generateMetadata({ params }: PageProps<"/credenciales/[id]">) {
  const { id } = await params;
  const credencial = await obtenerCredencial(id);
  return { title: `${credencial?.nombre ?? "Credencial"} · Autogestión` };
}

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
            <Link href={`/credenciales/${credencial.id}/editar`} className="btn btn-outline">
              Editar
            </Link>
            <BotonEliminarCredencial id={credencial.id} nombre={credencial.nombre} />
          </>
        }
      />
      <div className="space-y-6">
        <Tarjeta titulo="Datos">
          <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-[10rem_1fr]">
            <dt className="opacity-70">Categoría</dt>
            <dd>
              <Insignia tono="info" contorno>
                {CATEGORIAS[credencial.categoria]}
              </Insignia>
            </dd>
            <dt className="opacity-70">Usuario</dt>
            <dd>{credencial.usuario ?? "—"}</dd>
            <dt className="opacity-70">Secreto</dt>
            <dd>
              <SecretoCredencial id={credencial.id} nombre={credencial.nombre} />
            </dd>
            <dt className="opacity-70">Host o URL</dt>
            <dd className="break-all">{credencial.host ?? "—"}</dd>
            <dt className="opacity-70">Nota</dt>
            <dd className="whitespace-pre-wrap">{credencial.nota ?? "—"}</dd>
            <dt className="opacity-70">Alcance</dt>
            <dd className="flex flex-wrap gap-2">
              {credencial.global ? <Insignia tono="primary">Global</Insignia> : null}
              {credencial.proyectos.map(({ proyecto }) => (
                <Link key={proyecto.id} href={`/proyectos/${proyecto.id}`} className="link">
                  {proyecto.nombre}
                </Link>
              ))}
              {!credencial.global && credencial.proyectos.length === 0 ? (
                <span className="opacity-70">Sin proyectos asociados</span>
              ) : null}
            </dd>
          </dl>
        </Tarjeta>
        <Tarjeta titulo="Historial de cambios">
          {credencial.historial.length === 0 ? (
            <p className="text-sm opacity-70">Esta credencial aún no ha sido modificada.</p>
          ) : (
            <Tabla aria-label="Historial de cambios">
              <thead>
                <tr>
                  <th scope="col">Fecha</th>
                  <th scope="col">Campo modificado</th>
                </tr>
              </thead>
              <tbody>
                {credencial.historial.map((cambio) => (
                  <tr key={cambio.id}>
                    <td>{FORMATO_FECHA.format(cambio.fecha)}</td>
                    <td>{cambio.campo}</td>
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
