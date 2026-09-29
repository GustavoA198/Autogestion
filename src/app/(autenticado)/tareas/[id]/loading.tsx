export default function CargandoTarea() {
  return (
    <output className="block" aria-live="polite" aria-busy="true">
      <span className="sr-only">Cargando tarea</span>
      <div className="space-y-2 pb-6">
        <span className="skeleton block h-3 w-16" />
        <span className="skeleton block h-8 w-2/3 max-w-lg" />
        <span className="skeleton block h-5 w-1/2 max-w-sm" />
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-5">
          <span className="skeleton rounded-box block h-44 w-full" />
          <span className="skeleton rounded-box block h-40 w-full" />
          <span className="skeleton rounded-box block h-32 w-full" />
        </div>
        <div className="space-y-5">
          <span className="skeleton rounded-box block h-56 w-full" />
          <span className="skeleton rounded-box block h-28 w-full" />
        </div>
      </div>
    </output>
  );
}
