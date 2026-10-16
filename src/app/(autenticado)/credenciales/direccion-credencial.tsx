import { Clipboard } from "@/componentes/clipboard";
import { EnlaceExterno } from "@/componentes/enlace";
import { Icono } from "@/componentes/icono";
import { hrefDeDireccion } from "@/lib/enlaces";

type Propiedades = {
  direccion: string | null;
  nombre: string;
  // Ancho máximo del texto en tablas; en la ficha se muestra completo
  truncar?: boolean;
};

// URL o host de la credencial: texto, botón para abrirla en otra pestaña (si es abrible) y botón para copiarla
export function DireccionCredencial({ direccion, nombre, truncar = false }: Propiedades) {
  if (!direccion) return <span className="text-tenue">—</span>;
  const href = hrefDeDireccion(direccion);

  return (
    <div className="flex items-center gap-1">
      <span
        className={`font-mono text-sm ${truncar ? "block max-w-40 truncate" : "break-all"}`}
        title={direccion}
      >
        {direccion}
      </span>
      {href ? (
        <EnlaceExterno
          href={href}
          comoBoton
          variante="fantasma"
          tamano="pequeno"
          className="btn-square shrink-0"
          aria-label={`Abrir la URL de ${nombre} (se abre en una pestaña nueva)`}
          title={`Abrir ${href}`}
        >
          <Icono nombre="enlace-externo" tamano={16} />
        </EnlaceExterno>
      ) : null}
      <Clipboard compacto texto={direccion} etiqueta={`Copiar la URL de ${nombre}`} />
    </div>
  );
}
