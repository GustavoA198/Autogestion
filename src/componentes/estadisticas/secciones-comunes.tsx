// Piezas comunes de las secciones de estadísticas: envoltorio con título, rejillas y datos semanales.
import type { ReactNode } from "react";
import { etiquetaSemana, type DatoSemanal } from "@/lib/estadisticas/semanas";
import type { Categoria, PuntoSimple } from "@/componentes/estadisticas/tipos";

type PropsSeccion = {
  id: string;
  titulo: string;
  // Frase corta que explica qué mide la sección
  queMide: string;
  children: ReactNode;
};

export function SeccionEstadisticas({ id, titulo, queMide, children }: PropsSeccion) {
  return (
    <section id={id} aria-labelledby={`${id}-titulo`} className="scroll-mt-36 space-y-5">
      <header>
        <h2 id={`${id}-titulo`} className="text-xl font-extrabold tracking-tight">
          {titulo}
        </h2>
        <p className="text-suave mt-1 max-w-3xl text-sm">{queMide}</p>
      </header>
      {children}
    </section>
  );
}

export function RejillaKpi({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-4">{children}</div>;
}

export function RejillaGraficas({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:[&>*:last-child:nth-child(odd)]:col-span-2">
      {children}
    </div>
  );
}

// Categorías semanales con etiqueta corta ("21 sep") y detalle accesible ("Semana del 21 sep")
export function categoriasSemanales(semanas: string[]): Categoria[] {
  return semanas.map((semana) => ({
    etiqueta: etiquetaSemana(semana),
    detalle: `Semana del ${etiquetaSemana(semana)}`,
  }));
}

export function puntosSemanales(datos: DatoSemanal[]): PuntoSimple[] {
  return datos.map((dato) => ({
    etiqueta: etiquetaSemana(dato.semana),
    detalle: `Semana del ${etiquetaSemana(dato.semana)}`,
    valor: dato.valor,
  }));
}
