import { EnlaceExterno } from "@/componentes/enlace";
import { Icono } from "@/componentes/icono";

// Enlace externo: pestaña nueva y sin exponer la ventana de origen
export function EnlaceDocumentacion({ url }: { url: string }) {
  return (
    <EnlaceExterno href={url} className="inline-flex items-center gap-1.5 break-all">
      Abrir documentación
      <Icono nombre="enlace-externo" tamano={14} />
    </EnlaceExterno>
  );
}
