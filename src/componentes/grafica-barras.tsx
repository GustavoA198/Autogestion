type DatoBarra = {
  etiqueta: string;
  cantidad: number;
  ariaLabel: string;
};

type Props = {
  datos: DatoBarra[];
  altoMaximo?: number;
};

export function GraficaBarras({ datos, altoMaximo = 200 }: Props) {
  if (datos.length === 0) return null;

  const maximo = Math.max(...datos.map((d) => d.cantidad), 1);

  return (
    <div className="overflow-x-auto" role="group" aria-label="Gráfico de barras">
      <table className="table table-sm w-full">
        <caption className="sr-only">Cantidad de tareas completadas por período</caption>
        <thead>
          <tr>
            {datos.map((d) => (
              <th key={d.etiqueta} scope="col" className="text-center">
                <span aria-hidden="true">{d.etiqueta}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {datos.map((d) => {
              const alturaPx = Math.round((d.cantidad / maximo) * altoMaximo);
              return (
                <td key={d.etiqueta} className="align-end text-center p-1">
                  <button
                    type="button"
                    aria-label={d.ariaLabel}
                    className="btn btn-square bg-primary text-primary-content w-full max-w-16 justify-center"
                    style={{ height: `${Math.max(alturaPx, 8)}px` }}
                  >
                    <span className="text-xs font-semibold">{d.cantidad}</span>
                  </button>
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
