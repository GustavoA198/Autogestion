import type { ReactNode } from "react";
import { Icono, type NombreIcono } from "@/componentes/icono";

type Tono = "info" | "exito" | "atencion" | "critico";

const ESTILOS: Record<Tono, { icono: NombreIcono; clases: string }> = {
  info: { icono: "info", clases: "border-info/30 bg-info/10 text-info" },
  exito: { icono: "check-circulo", clases: "border-success/30 bg-success/10 text-success" },
  atencion: { icono: "alerta", clases: "border-warning/30 bg-warning/10 text-warning" },
  critico: { icono: "error", clases: "border-error/30 bg-error/10 text-error" },
};

// Mensaje en línea con ícono; los críticos se anuncian de inmediato y el resto de forma cortés
export function Alerta({ tono = "info", children }: { tono?: Tono; children: ReactNode }) {
  const { icono, clases } = ESTILOS[tono];
  return (
    <div
      role={tono === "critico" ? "alert" : "status"}
      className={`flex items-start gap-2.5 rounded-2xl border px-4 py-3 text-sm ${clases}`}
    >
      <Icono nombre={icono} tamano={18} className="mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
