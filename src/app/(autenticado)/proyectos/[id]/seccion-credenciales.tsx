import Link from "next/link";
import { Boton } from "@/componentes/boton";
import { Insignia } from "@/componentes/insignia";
import { Selector } from "@/componentes/selector";
import { Tarjeta } from "@/componentes/shell/tarjeta";
import {
  accionDesvincularCredencial,
  accionVincularCredencial,
} from "@/app/(autenticado)/credenciales/acciones";
import {
  listarCredencialesDeProyecto,
  listarCredencialesVinculables,
} from "@/lib/credenciales/operaciones";

// Lista las propias y las globales; vincular o desvincular nunca borra la credencial
export async function SeccionCredenciales({ proyectoId }: { proyectoId: string }) {
  const [credenciales, vinculables] = await Promise.all([
    listarCredencialesDeProyecto(proyectoId),
    listarCredencialesVinculables(proyectoId),
  ]);

  return (
    <Tarjeta
      titulo="Credenciales"
      accion={
        <Link href="/credenciales/nueva" className="btn btn-outline btn-sm">
          Nueva
        </Link>
      }
    >
      {credenciales.length === 0 ? (
        <p className="text-sm opacity-70">Este proyecto aún no tiene credenciales asociadas.</p>
      ) : (
        <ul className="divide-base-300 divide-y">
          {credenciales.map((credencial) => (
            <li key={credencial.id} className="flex items-center justify-between gap-2 py-2">
              <span className="flex min-w-0 items-center gap-2">
                <Link
                  href={`/credenciales/${credencial.id}`}
                  className="link link-hover truncate font-medium"
                >
                  {credencial.nombre}
                </Link>
                {credencial.global ? <Insignia tono="primary">Global</Insignia> : null}
              </span>
              {credencial.global ? null : (
                <form action={accionDesvincularCredencial.bind(null, proyectoId)}>
                  <input type="hidden" name="credencialId" value={credencial.id} />
                  <Boton
                    type="submit"
                    variante="fantasma"
                    tamano="pequeno"
                    aria-label={`Desvincular ${credencial.nombre}`}
                  >
                    Desvincular
                  </Boton>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}
      {vinculables.length > 0 ? (
        <form
          action={accionVincularCredencial.bind(null, proyectoId)}
          className="flex items-end gap-2 pt-2"
        >
          <Selector etiqueta="Vincular una credencial existente" name="credencialId" required>
            <option value="">Elige una credencial</option>
            {vinculables.map((credencial) => (
              <option key={credencial.id} value={credencial.id}>
                {credencial.nombre}
              </option>
            ))}
          </Selector>
          <Boton type="submit" variante="secundario">
            Vincular
          </Boton>
        </form>
      ) : null}
    </Tarjeta>
  );
}
