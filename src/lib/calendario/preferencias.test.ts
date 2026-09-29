import { afterEach, describe, expect, it, vi } from "vitest";

function almacenEnMemoria(inicial: Record<string, string> = {}) {
  const datos = new Map<string, string>(Object.entries(inicial));
  return {
    getItem: (clave: string) => datos.get(clave) ?? null,
    setItem: (clave: string, valor: string) => void datos.set(clave, valor),
  };
}

function ventanaFalsa() {
  const oyentes = new Map<string, Set<() => void>>();
  return {
    addEventListener: (tipo: string, fn: () => void) => {
      if (!oyentes.has(tipo)) oyentes.set(tipo, new Set());
      oyentes.get(tipo)?.add(fn);
    },
    removeEventListener: (tipo: string, fn: () => void) => void oyentes.get(tipo)?.delete(fn),
    dispatchEvent: (evento: Event) => {
      oyentes.get(evento.type)?.forEach((fn) => fn());
      return true;
    },
    cantidad: (tipo: string) => oyentes.get(tipo)?.size ?? 0,
  };
}

// El módulo guarda un respaldo en memoria: cada prueba lo importa de nuevo para partir limpia
async function cargarModulo() {
  vi.resetModules();
  return import("./preferencias");
}

afterEach(() => vi.unstubAllGlobals());

describe("vista guardada del calendario", () => {
  it("guarda y lee la vista en el almacenamiento", async () => {
    const { CLAVE_VISTA, guardarVista, leerVistaGuardada } = await cargarModulo();
    const almacen = almacenEnMemoria();
    vi.stubGlobal("localStorage", almacen);
    vi.stubGlobal("window", ventanaFalsa());
    guardarVista("semana");
    expect(almacen.getItem(CLAVE_VISTA)).toBe("semana");
    expect(leerVistaGuardada()).toBe("semana");
  });

  it("lee la vista que quedó guardada en una visita anterior", async () => {
    const { CLAVE_VISTA, leerVistaGuardada } = await cargarModulo();
    vi.stubGlobal("localStorage", almacenEnMemoria({ [CLAVE_VISTA]: "mes" }));
    expect(leerVistaGuardada()).toBe("mes");
  });

  it("ignora valores guardados que no son una vista", async () => {
    const { CLAVE_VISTA, leerVistaGuardada } = await cargarModulo();
    vi.stubGlobal("localStorage", almacenEnMemoria({ [CLAVE_VISTA]: "trimestre" }));
    expect(leerVistaGuardada()).toBeNull();
  });

  it("sin nada guardado devuelve null", async () => {
    const { leerVistaGuardada } = await cargarModulo();
    vi.stubGlobal("localStorage", almacenEnMemoria());
    expect(leerVistaGuardada()).toBeNull();
  });

  it("no lanza si el almacenamiento está bloqueado y conserva la vista en memoria", async () => {
    const { guardarVista, leerVistaGuardada } = await cargarModulo();
    const bloqueado = {
      getItem: () => {
        throw new Error("bloqueado");
      },
      setItem: () => {
        throw new Error("bloqueado");
      },
    };
    vi.stubGlobal("localStorage", bloqueado);
    vi.stubGlobal("window", ventanaFalsa());
    expect(leerVistaGuardada()).toBeNull();
    expect(() => guardarVista("mes")).not.toThrow();
    expect(leerVistaGuardada()).toBe("mes");
  });

  it("avisa a los suscriptores al guardar y deja de avisar al cancelar", async () => {
    const { EVENTO_VISTA, guardarVista, suscribirseALaVista } = await cargarModulo();
    const ventana = ventanaFalsa();
    vi.stubGlobal("localStorage", almacenEnMemoria());
    vi.stubGlobal("window", ventana);
    const alCambiar = vi.fn();
    const cancelar = suscribirseALaVista(alCambiar);
    expect(ventana.cantidad(EVENTO_VISTA)).toBe(1);
    guardarVista("dia");
    expect(alCambiar).toHaveBeenCalledTimes(1);
    cancelar();
    guardarVista("agenda");
    expect(alCambiar).toHaveBeenCalledTimes(1);
    expect(ventana.cantidad(EVENTO_VISTA)).toBe(0);
  });
});
