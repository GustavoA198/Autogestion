import { Boton } from "@/componentes/boton";
import { BotonEnlace, Enlace } from "@/componentes/enlace";
import { Icono } from "@/componentes/icono";
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
        <BotonEnlace href="/contactos/nueva" variante="secundario" tamano="pequeno">
          <Icono nombre="mas" tamano={14} />
          Nuevo
        </BotonEnlace>
      }
    >
      {contactos.length === 0 ? (
        <p className="text-suave text-sm">Este proyecto aún no tiene contactos asociados.</p>
      ) : (
        <ul className="lista-filas">
          {contactos.map((contacto) => (
            <li
              key={contacto.id}
              className="tarjeta-fila flex min-h-14 items-center justify-between gap-2 px-4 py-1.5"
            >
              <span className="flex min-w-0 items-center gap-2">
                <Enlace
                  href={`/contactos/${contacto.id}`}
                  discreto
                  title={contacto.nombre}
                  className="truncate font-bold"
                >
                  {contacto.nombre}
                </Enlace>
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
          className="border-linea-tarjeta flex flex-col gap-2 border-t pt-5 sm:flex-row sm:items-end"
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
