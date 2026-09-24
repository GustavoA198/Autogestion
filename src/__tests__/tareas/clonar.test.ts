import { describe, it, expect, vi, beforeEach } from "vitest";
import { clonarTareas } from "@/lib/tareas/operaciones";

const TareaModelo = {
  id: "tarea-1",
  titulo: "Tarea 1",
  descripcion: "Desc",
  tipoFrecuencia: "DIARIA" as const,
  diaSemana: null,
  diaMes: null,
  fechaPuntual: null,
  proyectoId: "proy-origen",
  activa: true,
  creadoEn: new Date(),
  actualizadoEn: new Date(),
};

const mockCrear = vi.fn();
const mockTx = {
  tarea: {
    findMany: vi.fn(),
    create: vi.fn(),
  },
};

vi.mock("@/lib/prisma", () => ({
  obtenerPrisma: () => ({
    $transaction: (fn: (tx: typeof mockTx) => Promise<unknown>) => fn(mockTx),
  }),
}));

describe("clonarTareas", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("no clona si origen y destino son el mismo", async () => {
    const resultado = await clonarTareas("proy-a", "proy-a", ["tarea-1"]);
    expect(resultado.cantidad).toBe(0);
    expect(resultado.ids).toEqual([]);
  });

  it("clona una tarea correctamente", async () => {
    mockTx.tarea.findMany.mockResolvedValue([TareaModelo]);
    mockCrear.mockResolvedValue({ id: "tarea-nueva" });
    mockTx.tarea.create.mockImplementation(mockCrear);

    const resultado = await clonarTareas("proy-origen", "proy-destino", ["tarea-1"]);

    expect(resultado.cantidad).toBe(1);
    expect(resultado.ids).toEqual(["tarea-nueva"]);
    expect(mockTx.tarea.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        titulo: "Tarea 1",
        descripcion: "Desc",
        tipoFrecuencia: "DIARIA",
        proyectoId: "proy-destino",
        activa: true,
      }),
      select: { id: true },
    });
  });

  it("clona multiples tareas", async () => {
    const tarea2 = { ...TareaModelo, id: "tarea-2", titulo: "Tarea 2" };
    mockTx.tarea.findMany.mockResolvedValue([TareaModelo, tarea2]);
    mockTx.tarea.create
      .mockResolvedValueOnce({ id: "tarea-nueva-1" })
      .mockResolvedValueOnce({ id: "tarea-nueva-2" });

    const resultado = await clonarTareas("proy-origen", "proy-destino", ["tarea-1", "tarea-2"]);

    expect(resultado.cantidad).toBe(2);
    expect(resultado.ids).toEqual(["tarea-nueva-1", "tarea-nueva-2"]);
  });

  it("no clona si alguna tarea no existe o no es del origen", async () => {
    mockTx.tarea.findMany.mockResolvedValue([TareaModelo]);

    const resultado = await clonarTareas("proy-origen", "proy-destino", [
      "tarea-1",
      "tarea-inexistente",
    ]);

    expect(resultado.cantidad).toBe(0);
    expect(resultado.ids).toEqual([]);
  });

  it("la tarea original queda intacta", async () => {
    mockTx.tarea.findMany.mockResolvedValue([TareaModelo]);
    mockTx.tarea.create.mockResolvedValue({ id: "nueva" });

    await clonarTareas("proy-origen", "proy-destino", ["tarea-1"]);

    expect(mockTx.tarea.create).not.toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ id: "tarea-1" }) }),
    );
  });

  it("no copia el historial de completadas", async () => {
    mockTx.tarea.findMany.mockResolvedValue([TareaModelo]);
    mockTx.tarea.create.mockResolvedValue({ id: "nueva" });

    await clonarTareas("proy-origen", "proy-destino", ["tarea-1"]);

    expect(mockTx.tarea.create).toHaveBeenCalledWith(
      expect.not.objectContaining({
        data: expect.objectContaining({ completadas: expect.anything() }),
      }),
    );
  });
});
