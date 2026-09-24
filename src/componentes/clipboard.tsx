"use client";

import { useState } from "react";
import { Boton } from "./boton";

export function Clipboard({ texto }: { texto: string }) {
  const [copiado, setCopiado] = useState(false);

  async function alCopiar() {
    await navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <Boton
      type="button"
      variante="fantasma"
      tamano="pequeno"
      onClick={alCopiar}
      aria-label="Copiar al portapapeles"
    >
      {copiado ? "Copiado" : "Copiar"}
    </Boton>
  );
}
