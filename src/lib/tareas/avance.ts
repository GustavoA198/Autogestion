// Avance de una tarea: función pura sin acceso a BD; se deriva de las subtareas, nunca se edita a mano.

export type SubtareaAvance = { hecho: boolean };

export type AvanceTarea = {
  total: number;
  hechas: number;
  // Entero de 0 a 100; null cuando no hay subtareas y la tarea no está completada (no se pinta barra)
  porcentaje: number | null;
};

// Con subtareas: hechas / total redondeado; sin ellas: 100 si está completada y null en otro caso
export function avanceDeTarea(tarea: {
  estado: string;
  subtareas: readonly SubtareaAvance[];
}): AvanceTarea {
  const total = tarea.subtareas.length;
  const hechas = tarea.subtareas.filter((s) => s.hecho).length;
  if (total > 0) return { total, hechas, porcentaje: Math.round((hechas / total) * 100) };
  return { total, hechas, porcentaje: tarea.estado === "COMPLETADA" ? 100 : null };
}
