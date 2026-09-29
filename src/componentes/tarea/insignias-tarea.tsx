import { Icono } from "@/componentes/icono";
import { Insignia } from "@/componentes/insignia";
import { ESTADO_LABEL, PRIORIDAD_LABEL } from "@/lib/tareas/presentacion";
import { TONO_SEMAFORO, type ResultadoSemaforo } from "@/lib/tareas/semaforo";

type TonoInsignia = "info" | "primary" | "ghost" | "error" | "success" | "warning" | "neutral";

const TONO_ESTADO: Record<string, TonoInsignia> = {
  NUEVA: "info",
  EN_DESARROLLO: "primary",
  PAUSADA: "neutral",
  BLOQUEADA: "error",
  COMPLETADA: "success",
  CANCELADA: "ghost",
};

const TONO_PRIORIDAD: Record<string, TonoInsignia> = {
  BAJA: "ghost",
  MEDIA: "neutral",
  ALTA: "warning",
  URGENTE: "error",
};

export function InsigniaEstado({ estado }: { estado: string }) {
  return (
    <Insignia tono={TONO_ESTADO[estado] ?? "neutral"} contorno>
      {ESTADO_LABEL[estado] ?? estado}
    </Insignia>
  );
}

// La prioridad va con contorno e icono para no confundirse con el semáforo de vencimiento
export function InsigniaPrioridad({ prioridad }: { prioridad: string }) {
  return (
    <Insignia tono={TONO_PRIORIDAD[prioridad] ?? "neutral"} contorno className="gap-1">
      <Icono nombre="bandera" tamano={12} />
      {PRIORIDAD_LABEL[prioridad] ?? prioridad}
    </Insignia>
  );
}

// El color del semáforo siempre va acompañado de icono y texto
export function InsigniaSemaforo({ semaforo }: { semaforo: ResultadoSemaforo }) {
  const esUrgente = semaforo.nivel === "rojo";
  return (
    <Insignia tono={TONO_SEMAFORO[semaforo.nivel]} className="gap-1">
      <Icono nombre={esUrgente ? "alerta" : "reloj"} tamano={12} />
      {semaforo.texto}
    </Insignia>
  );
}
