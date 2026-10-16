import { EnlaceExterno, Enlace } from "@/componentes/enlace";
import { Icono } from "@/componentes/icono";
import { Insignia } from "@/componentes/insignia";
import { enlaceSeguro } from "@/lib/calendario/proveedor";

type EnlaceDocumentacion = { id: string; nombre: string; url: string };

// Nombre del enlace abrible en otra pestaña; si la URL guardada no es web se muestra solo el texto
function NombreEnlace({ enlace, className }: { enlace: EnlaceDocumentacion; className: string }) {
  const href = enlaceSeguro(enlace.url);
  if (!href) {
    return (
      <span className={`${className} text-suave`} title={enlace.url}>
        <span className="truncate">{enlace.nombre}</span>
      </span>
    );
  }
  return (
    <EnlaceExterno href={href} title={enlace.url} className={className}>
      <span className="truncate">{enlace.nombre}</span>
      <Icono nombre="enlace-externo" tamano={14} className="shrink-0" />
    </EnlaceExterno>
  );
}

// Primer enlace con su nombre y, si hay más, una insignia que lleva a la ficha donde se ven todos
export function ResumenDocumentacion({
  proyectoId,
  enlaces,
}: {
  proyectoId: string;
  enlaces: EnlaceDocumentacion[];
}) {
  const [primero, ...resto] = enlaces;
  if (!primero) return <span className="text-tenue">Sin enlaces</span>;

  return (
    <div className="flex max-w-64 items-center gap-2">
      <NombreEnlace enlace={primero} className="inline-flex min-w-0 items-center gap-1.5" />
      {resto.length > 0 ? (
        <Enlace
          href={`/proyectos/${proyectoId}`}
          discreto
          title={resto.map((e) => e.nombre).join(", ")}
          aria-label={`Ver los ${resto.length} enlaces restantes: ${resto.map((e) => e.nombre).join(", ")}`}
        >
          <Insignia tono="ghost">{`+${resto.length}`}</Insignia>
        </Enlace>
      ) : null}
    </div>
  );
}

// Sitio del enlace (sin www) para reconocer el destino; solo http o https
export function sitioDeEnlace(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

// Todos los enlaces de la ficha: nombre como enlace externo y debajo el sitio
export function ListaDocumentacion({ enlaces }: { enlaces: EnlaceDocumentacion[] }) {
  return (
    <ul className="space-y-3">
      {enlaces.map((enlace) => (
        <li key={enlace.id} className="min-w-0">
          <NombreEnlace
            enlace={enlace}
            className="inline-flex max-w-full items-center gap-1.5 font-bold"
          />
          <p className="text-suave truncate text-sm">{sitioDeEnlace(enlace.url) ?? enlace.url}</p>
        </li>
      ))}
    </ul>
  );
}
