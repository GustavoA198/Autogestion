// Esqueleto de carga del reporte semanal.
export default function Loading() {
  return (
    <output aria-live="polite" aria-busy="true" className="block">
      <span className="sr-only">Cargando el reporte semanal</span>
      <div className="space-y-2 pb-6">
        <span className="skeleton block h-3 w-16" />
        <span className="skeleton block h-8 w-64" />
        <span className="skeleton block h-4 w-96 max-w-full" />
      </div>
      <span className="skeleton mb-6 block h-14 rounded-box" />
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <span key={i} className="skeleton block h-40 rounded-box" />
        ))}
      </div>
    </output>
  );
}
