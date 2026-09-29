type Propiedades = {
  filas?: number;
  etiqueta?: string;
};

// La última fila es más corta para que el marcador imite un párrafo real
export function EstadoCarga({ filas = 3, etiqueta = "Cargando" }: Propiedades) {
  return (
    <output className="flex flex-col gap-3" aria-live="polite" aria-busy="true">
      <span className="sr-only">{etiqueta}</span>
      {Array.from({ length: filas }).map((_, indice) => (
        <span
          key={indice}
          className={`skeleton h-4 ${indice === filas - 1 && filas > 1 ? "w-2/3" : "w-full"}`}
        />
      ))}
    </output>
  );
}
