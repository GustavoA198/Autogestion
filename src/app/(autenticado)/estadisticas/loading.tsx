// Esqueleto de carga de las estadísticas: cabecera, barra de secciones y bloques con la rejilla final.
import { EsqueletoEstadisticas } from "@/componentes/estadisticas/esqueleto-estadisticas";

export default function Loading() {
  return (
    <>
      <div className="space-y-2 pb-6">
        <span className="skeleton block h-3 w-24" />
        <span className="skeleton block h-8 w-56" />
        <span className="skeleton block h-4 w-96 max-w-full" />
      </div>
      <span className="skeleton mb-6 block h-11 w-full max-w-md rounded-full" />
      <EsqueletoEstadisticas />
    </>
  );
}
