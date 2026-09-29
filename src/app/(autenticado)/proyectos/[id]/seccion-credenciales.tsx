import { Boton } from "@/componentes/boton";
import { BotonEnlace, Enlace } from "@/componentes/enlace";
import { Icono } from "@/componentes/icono";
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
        <BotonEnlace href="/credenciales/nueva" variante="secundario" tamano="pequeno">
          <Icono nombre="mas" tamano={14} />
          Nueva
        </BotonEnlace>
      }
    >
      {credenciales.length === 0 ? (
        <p className="text-suave text-sm">Este proyecto aún no tiene credenciales asociadas.</p>
      ) : (
        <ul className="lista-filas">
          {credenciales.map((credencial) => (
            <li
              key={credencial.id}
              className="tarjeta-fila flex min-h-14 items-center justify-between gap-2 px-4 py-1.5"
            >
              <span className="flex min-w-0 items-center gap-2">
                <Icono nombre="llave" tamano={16} className="text-tenue shrink-0" />
                <Enlace
                  href={`/credenciales/${credencial.id}`}
                  discreto
                  title={credencial.nombre}
                  className="truncate font-bold"
                >
                  {credencial.nombre}
                </Enlace>
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
          className="border-linea-tarjeta flex flex-col gap-2 border-t pt-5 sm:flex-row sm:items-end"
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
