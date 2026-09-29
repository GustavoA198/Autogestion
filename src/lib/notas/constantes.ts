// Días sin entradas a partir de los cuales un proyecto se considera sin avance
export const DIAS_SIN_AVANCE = 5;

// Valor con el que se rellenaron las entradas anteriores a que el próximo paso fuera obligatorio
export const PROXIMO_PASO_SIN_DEFINIR = "Sin definir";

// Un proyecto está sin avance cuando supera el umbral de días desde su última entrada
export function estaSinAvance(dias: number, umbral: number = DIAS_SIN_AVANCE): boolean {
  return dias > umbral;
}
