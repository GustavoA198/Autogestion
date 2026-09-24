// Enlace externo: pestaña nueva y sin exponer la ventana de origen
export function EnlaceDocumentacion({ url }: { url: string }) {
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="link link-primary break-all">
      Abrir documentación
      <span className="sr-only"> (se abre en una pestaña nueva)</span>
    </a>
  );
}
