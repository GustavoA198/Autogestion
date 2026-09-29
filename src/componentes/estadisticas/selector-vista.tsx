"use client";

import { ETIQUETA_VISTA, type TipoVista } from "@/componentes/estadisticas/tipos";
import type { DisponibilidadVista } from "@/componentes/estadisticas/modelo";

type Props = {
  actual: TipoVista;
  vistas: TipoVista[];
  disponibilidad: Record<TipoVista, DisponibilidadVista>;
  alElegir: (vista: TipoVista) => void;
};

// Grupo de botones para cambiar la representación; las vistas que no aplican quedan deshabilitadas con su motivo
export function SelectorVista({ actual, vistas, disponibilidad, alElegir }: Props) {
  return (
    <div role="group" aria-label="Tipo de representación" className="join flex-wrap">
      {vistas.map((vista) => {
        const { activa, motivo } = disponibilidad[vista];
        const seleccionada = vista === actual;
        return (
          <button
            key={vista}
            type="button"
            aria-pressed={seleccionada}
            disabled={!activa}
            title={!activa ? motivo : undefined}
            aria-label={
              !activa && motivo ? `${ETIQUETA_VISTA[vista]}, no disponible: ${motivo}` : undefined
            }
            className={["btn btn-sm join-item", seleccionada ? "btn-primary" : "btn-outline"].join(
              " ",
            )}
            onClick={() => alElegir(vista)}
          >
            {ETIQUETA_VISTA[vista]}
          </button>
        );
      })}
    </div>
  );
}
