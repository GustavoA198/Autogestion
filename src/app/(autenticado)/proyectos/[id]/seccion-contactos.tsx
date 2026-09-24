import Link from "next/link";
import { Boton } from "@/componentes/boton";
import { Insignia } from "@/componentes/insignia";
import { Selector } from "@/componentes/selector";
import { Tarjeta } from "@/componentes/shell/tarjeta";
import {
  accionDesvincularContacto,
  accionVincularContacto,
} from "@/app/(autenticado)/contactos/acciones";
import { listarContactosDeProyecto, listarContactosVinculables } from "@/lib/contactos/operaciones";

export async function SeccionContactos({ proyectoId }: { proyectoId: string }) {
  const [contactos, vinculables] = await Promise.all([
    listarContactosDeProyecto(proyectoId),
    listarContactosVinculables(proyectoId),
  ]);

  return (
    <Tarjeta
      titulo="Contactos"
      accion={
        <Link href="/contactos/nueva" className="btn btn-outline btn-sm">
          Nuevo
        </Link>
      }
    >
      {contactos.length === 0 ? (
        <p className="text-sm opacity-70">Este proyecto aun no tiene contactos asociados.</p>
      ) : (
        <ul className="divide-base-300 divide-y">
          {contactos.map((contacto) => (
            <li key={contacto.id} className="flex items-center justify-between gap-2 py-2">
              <span className="flex min-w-0 items-center gap-2">
                <Link
                  href={`/contactos/${contacto.id}`}
                  className="link link-hover truncate font-medium"
                >
                  {contacto.nombre}
                </Link>
                {contacto.global ? <Insignia tono="primary">Global</Insignia> : null}
              </span>
              {contacto.global ? null : (
                <form action={accionDesvincularContacto.bind(null, proyectoId)}>
                  <input type="hidden" name="contactoId" value={contacto.id} />
                  <Boton
                    type="submit"
                    variante="fantasma"
                    tamano="pequeno"
                    aria-label={`Desvincular ${contacto.nombre}`}
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
          action={accionVincularContacto.bind(null, proyectoId)}
          className="flex items-end gap-2 pt-2"
        >
          <Selector etiqueta="Vincular un contacto existente" name="contactoId" required>
            <option value="">Elige un contacto</option>
            {vinculables.map((contacto) => (
              <option key={contacto.id} value={contacto.id}>
                {contacto.nombre}
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
