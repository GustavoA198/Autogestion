import Link from "next/link";
import { ETIQUETA_PERIODO, PERIODOS_NOTAS, type PeriodoNotas } from "@/lib/notas/periodo";

type Propiedades = {
  ruta: string;
  actual: PeriodoNotas;
  // Parámetros de la URL que se conservan al cambiar de período (por ejemplo la búsqueda)
  parametros?: Record<string, string | undefined>;
};

// Segmentos Esta semana | Este mes | Todo como enlaces, para que funcionen sin JavaScript
export function FiltroPeriodoNotas({ ruta, actual, parametros = {} }: Propiedades) {
  function destino(periodo: PeriodoNotas): string {
    const consulta = new URLSearchParams();
    for (const [clave, valor] of Object.entries(parametros)) if (valor) consulta.set(clave, valor);
    if (periodo !== "todo") consulta.set("periodo", periodo);
    const texto = consulta.toString();
    return texto ? `${ruta}?${texto}` : ruta;
  }

  return (
    <nav aria-label="Período de las entradas" className="join">
      {PERIODOS_NOTAS.map((periodo) => {
        const activo = periodo === actual;
        return (
          <Link
            key={periodo}
            href={destino(periodo)}
            aria-current={activo ? "page" : undefined}
            className={`btn join-item ${activo ? "btn-primary" : "btn-outline"}`}
          >
            {ETIQUETA_PERIODO[periodo]}
          </Link>
        );
      })}
    </nav>
  );
}
