type Propiedades = {
  // null significa "sin avance que mostrar" (tarea sin subtareas y sin completar): no se pinta nada
  valor: number | null;
  etiqueta?: string;
  // En modo compacto el porcentaje va a la derecha y la barra es más fina
  compacta?: boolean;
  completada?: boolean;
  // Oculta el porcentaje en texto cuando otro elemento cercano ya lo muestra
  mostrarTexto?: boolean;
  className?: string;
};

// Barra de progreso nativa con el porcentaje también en texto
export function BarraAvance({
  valor,
  etiqueta = "Avance de la tarea",
  compacta = false,
  completada = false,
  mostrarTexto = true,
  className,
}: Propiedades) {
  if (valor === null) return null;
  const porcentaje = Math.min(100, Math.max(0, Math.round(valor)));
  const tono = completada || porcentaje === 100 ? "bg-success" : "bg-primary";
  return (
    <div className={["flex items-center gap-2", className].filter(Boolean).join(" ")}>
      <div
        className="bg-base-300 h-2 min-w-0 flex-1 overflow-hidden rounded-full"
        role="progressbar"
        aria-label={etiqueta}
        aria-valuenow={porcentaje}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`${tono} h-2 rounded-full transition-[width] duration-200`}
          style={{ width: `${porcentaje}%` }}
        />
      </div>
      {mostrarTexto ? (
        <span
          className={`text-suave shrink-0 tabular-nums ${compacta ? "text-xs" : "text-sm font-bold"}`}
        >
          {porcentaje} %
        </span>
      ) : null}
    </div>
  );
}
