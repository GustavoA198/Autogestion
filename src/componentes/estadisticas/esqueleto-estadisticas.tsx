// Esqueleto de las estadísticas con la misma rejilla que la página final, para evitar saltos de diseño.
function BloqueSeccion() {
  return (
    <section className="space-y-4">
      <div className="space-y-2">
        <span className="skeleton block h-6 w-40" />
        <span className="skeleton block h-4 w-96 max-w-full" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <span key={i} className="skeleton rounded-box block h-32" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {[1, 2].map((i) => (
          <span key={i} className="skeleton rounded-box block h-80" />
        ))}
      </div>
    </section>
  );
}

export function EsqueletoEstadisticas({ secciones = 2 }: { secciones?: number }) {
  return (
    <output aria-live="polite" aria-busy="true" className="block space-y-10">
      <span className="sr-only">Cargando estadísticas</span>
      {Array.from({ length: secciones }, (_, i) => (
        <BloqueSeccion key={i} />
      ))}
    </output>
  );
}
