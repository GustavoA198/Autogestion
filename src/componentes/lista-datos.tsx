import type { ReactNode } from "react";

type Fila = { etiqueta: string; valor: ReactNode };

// Lista de términos y valores de una ficha; los valores vacíos muestran un guion tenue
export function ListaDatos({ filas }: { filas: Fila[] }) {
  return (
    <dl className="divide-linea-tarjeta/60 divide-y text-sm">
      {filas.map((fila) => (
        <div
          key={fila.etiqueta}
          className="grid gap-1 py-3 first:pt-0 last:pb-0 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-6"
        >
          <dt className="text-suave font-bold">{fila.etiqueta}</dt>
          <dd className="min-w-0 break-words">
            {fila.valor ?? <span className="text-tenue">—</span>}
          </dd>
        </div>
      ))}
    </dl>
  );
}
