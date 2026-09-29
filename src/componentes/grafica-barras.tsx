type DatoBarra = {
  etiqueta: string;
  cantidad: number;
  ariaLabel: string;
  // Texto completo para la tabla y el tooltip cuando la etiqueta está abreviada
  detalle?: string;
};

type Props = {
  datos: DatoBarra[];
  titulo: string;
  altoMaximo?: number;
  unidad?: string;
  tono?: "primary" | "accent";
};

const RELLENO = { primary: "bg-verde", accent: "bg-accent" } as const;

// Tope del eje: par y nunca menor que 2, para tener marcas enteras en 0, mitad y tope
function topeEje(maximo: number): number {
  return Math.max(2, Math.ceil(maximo / 2) * 2);
}

// Alternativa tabular accesible con los mismos datos que la gráfica
function TablaDatos({ datos, titulo, unidad }: Pick<Props, "datos" | "titulo" | "unidad">) {
  return (
    <details className="group mt-4">
      <summary className="text-primary min-h-11 cursor-pointer text-sm font-bold select-none">
        Ver datos en tabla
      </summary>
      <div className="bg-hundida border-linea-tarjeta mt-2 overflow-x-auto rounded-2xl border">
        <table className="table-sm table">
          <caption className="sr-only">{titulo}</caption>
          <thead>
            <tr>
              <th scope="col">Categoría</th>
              <th scope="col" className="text-right">
                {unidad ?? "Cantidad"}
              </th>
            </tr>
          </thead>
          <tbody>
            {datos.map((dato) => (
              <tr key={dato.detalle ?? dato.etiqueta}>
                <th scope="row" className="font-normal">
                  {dato.detalle ?? dato.etiqueta}
                </th>
                <td className="text-right tabular-nums">{dato.cantidad}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

function resumenAccesible(datos: DatoBarra[]): string {
  return datos.map((dato) => dato.ariaLabel).join(". ");
}

// Columnas verticales con eje, líneas guía y valor sobre cada barra
export function GraficaBarras({
  datos,
  titulo,
  altoMaximo = 180,
  unidad = "Tareas completadas",
  tono = "primary",
}: Props) {
  if (datos.length === 0) return null;
  const tope = topeEje(Math.max(...datos.map((dato) => dato.cantidad)));
  const marcas = [tope, tope / 2, 0];

  return (
    <figure>
      <figcaption className="sr-only">{titulo}</figcaption>
      <div
        role="img"
        aria-label={`${titulo}. ${resumenAccesible(datos)}`}
        className="mt-6 grid grid-cols-[auto_1fr] gap-x-3"
      >
        <div
          className="text-suave flex flex-col justify-between text-right text-xs tabular-nums"
          style={{ height: altoMaximo }}
          aria-hidden="true"
        >
          {marcas.map((marca) => (
            <span key={marca} className="-my-2 leading-4">
              {marca}
            </span>
          ))}
        </div>
        <div className="relative" style={{ height: altoMaximo }} aria-hidden="true">
          {marcas.map((marca, indice) => (
            <span
              key={marca}
              className="border-linea-tarjeta absolute inset-x-0 border-t"
              style={{ top: `${(indice / 2) * 100}%` }}
            />
          ))}
          <div className="absolute inset-0 flex items-end gap-1.5 sm:gap-3">
            {datos.map((dato) => (
              <div
                key={dato.etiqueta}
                title={`${dato.detalle ?? dato.etiqueta}: ${dato.cantidad}`}
                className="group/barra flex h-full min-w-0 flex-1 flex-col items-center justify-end"
              >
                <span
                  className="relative w-full max-w-14"
                  style={{
                    height: `${Math.max((dato.cantidad / tope) * 100, dato.cantidad > 0 ? 3 : 0.5)}%`,
                  }}
                >
                  <span className="text-base-content absolute bottom-full left-1/2 mb-1 -translate-x-1/2 font-mono text-xs font-bold tabular-nums">
                    {dato.cantidad}
                  </span>
                  <span
                    className={`${RELLENO[tono]} block h-full w-full rounded-t-lg transition-opacity duration-150 group-hover/barra:opacity-80`}
                  />
                </span>
              </div>
            ))}
          </div>
        </div>
        <span aria-hidden="true" />
        <div className="mt-2 flex gap-1.5 sm:gap-3" aria-hidden="true">
          {datos.map((dato) => (
            <span
              key={dato.etiqueta}
              title={dato.detalle ?? dato.etiqueta}
              className="text-suave min-w-0 flex-1 truncate text-center text-xs"
            >
              {dato.etiqueta}
            </span>
          ))}
        </div>
      </div>
      <TablaDatos datos={datos} titulo={titulo} unidad={unidad} />
    </figure>
  );
}

// Barras horizontales para categorías con nombres largos, como los proyectos
export function GraficaBarrasHorizontal({
  datos,
  titulo,
  unidad = "Tareas completadas",
  tono = "accent",
}: Omit<Props, "altoMaximo">) {
  if (datos.length === 0) return null;
  const maximo = Math.max(...datos.map((dato) => dato.cantidad), 1);

  return (
    <figure>
      <figcaption className="sr-only">{titulo}</figcaption>
      <ul role="img" aria-label={`${titulo}. ${resumenAccesible(datos)}`} className="space-y-3">
        {datos.map((dato) => (
          <li
            key={dato.detalle ?? dato.etiqueta}
            aria-hidden="true"
            className="grid grid-cols-[minmax(0,8rem)_1fr_auto] items-center gap-3 sm:grid-cols-[minmax(0,12rem)_1fr_auto]"
          >
            <span className="truncate text-sm" title={dato.detalle ?? dato.etiqueta}>
              {dato.detalle ?? dato.etiqueta}
            </span>
            <span className="bg-hundida h-3 overflow-hidden rounded-full">
              <span
                className={`${RELLENO[tono]} block h-full rounded-full`}
                style={{ width: `${(dato.cantidad / maximo) * 100}%` }}
              />
            </span>
            <span className="w-6 text-right font-mono text-sm font-bold tabular-nums">
              {dato.cantidad}
            </span>
          </li>
        ))}
      </ul>
      <TablaDatos datos={datos} titulo={titulo} unidad={unidad} />
    </figure>
  );
}
