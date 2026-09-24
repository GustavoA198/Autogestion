import { Icono } from "@/componentes/icono";

export function Marca() {
  return (
    <div className="flex items-center gap-3">
      <span
        aria-hidden="true"
        className="bg-primary text-primary-content grid h-9 w-9 place-items-center rounded-md"
      >
        <Icono nombre="panel" tamano={18} />
      </span>
      <div className="leading-tight">
        <p className="font-semibold tracking-wide">NEXUS</p>
        <p className="text-xs tracking-widest uppercase opacity-60">Command Center</p>
      </div>
    </div>
  );
}
