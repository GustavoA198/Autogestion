// Alternativa tabular accesible con los mismos datos de la gráfica.
import { formatearNumero } from "@/componentes/estadisticas/escala";
import { esSerieUnica, nombreCategoria, valorCategoria } from "@/componentes/estadisticas/modelo";
import type { ModeloGrafica } from "@/componentes/estadisticas/tipos";

type Props = {
  modelo: ModeloGrafica;
  titulo: string;
  etiquetaCategoria: string;
  // Con datos que no son una serie temporal se añade la proporción de cada categoría
  conProporcion: boolean;
};

function textoEncabezado(unidad: string): string {
  return unidad === "%" ? "Porcentaje" : unidad.charAt(0).toUpperCase() + unidad.slice(1);
}

export function VistaTabla({ modelo, titulo, etiquetaCategoria, conProporcion }: Props) {
  const unica = esSerieUnica(modelo);
  const total = modelo.series[0]?.valores.reduce((suma, v) => suma + v, 0) ?? 0;
  const mostrarProporcion = conProporcion && unica && total > 0 && modelo.unidad !== "%";

  return (
    <div className="bg-hundida border-linea-tarjeta max-h-96 overflow-auto rounded-2xl border">
      <table className="table-sm table">
        <caption className="sr-only">{titulo}</caption>
        <thead>
          <tr>
            <th scope="col">{etiquetaCategoria}</th>
            {modelo.series.map((serie) => (
              <th key={serie.nombre} scope="col" className="text-right">
                {unica ? textoEncabezado(modelo.unidad) : serie.nombre}
              </th>
            ))}
            {mostrarProporcion ? (
              <th scope="col" className="text-right">
                Proporción
              </th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {modelo.categorias.map((_, cat) => (
            <tr key={cat}>
              <th scope="row" className="font-medium">
                {nombreCategoria(modelo, cat)}
              </th>
              {modelo.series.map((serie, s) => (
                <td key={serie.nombre + s} className="text-right tabular-nums">
                  {formatearNumero(valorCategoria(modelo, cat, s))}
                </td>
              ))}
              {mostrarProporcion ? (
                <td className="text-right tabular-nums">
                  {Math.round((valorCategoria(modelo, cat, 0) / total) * 100)} %
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
