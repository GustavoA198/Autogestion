import { EsqueletoAgenda } from "@/componentes/calendario/vista-agenda";
import { TituloSeccion } from "@/componentes/shell/titulo-seccion";

// Mismo marco que el calendario para que la carga no mueva el contenido
export default function CargandoCalendario() {
  return (
    <>
      <TituloSeccion
        modulo="Agenda"
        titulo="Calendario"
        descripcion="Reuniones sincronizadas desde tus calendarios."
      />
      <div className="space-y-3" role="status" aria-live="polite">
        <span className="sr-only">Cargando calendario</span>
        <div
          className="tarjeta flex min-h-[4.25rem] items-center gap-3 border p-3"
          aria-hidden="true"
        >
          <span className="skeleton h-10 w-16" />
          <span className="skeleton h-10 w-20" />
          <span className="skeleton h-6 w-44" />
        </div>
        <EsqueletoAgenda />
      </div>
    </>
  );
}
