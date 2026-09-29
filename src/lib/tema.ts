export type PreferenciaTema = "claro" | "oscuro" | "sistema";

export const CLAVE_TEMA = "autogestion-tema";
export const EVENTO_TEMA = "autogestion:tema";
export const PREFERENCIAS_TEMA: readonly PreferenciaTema[] = ["claro", "oscuro", "sistema"];

// Sin atributo data-theme manda el sistema; con él se fuerza el tema elegido
const TEMAS_FIJOS = { claro: "autogestion-claro", oscuro: "autogestion-oscuro" } as const;

// Se ejecuta antes del primer pintado para evitar el parpadeo del tema; el localStorage puede fallar
export const SCRIPT_TEMA_INICIAL = `(function(){try{var t=localStorage.getItem("${CLAVE_TEMA}");if(t==="claro"||t==="oscuro"){document.documentElement.setAttribute("data-theme","autogestion-"+t)}}catch(e){}})();`;

export function leerPreferenciaTema(): PreferenciaTema {
  try {
    const valor = localStorage.getItem(CLAVE_TEMA);
    return valor === "claro" || valor === "oscuro" ? valor : "sistema";
  } catch {
    return "sistema";
  }
}

export function aplicarTema(preferencia: PreferenciaTema): void {
  const raiz = document.documentElement;
  if (preferencia === "sistema") raiz.removeAttribute("data-theme");
  else raiz.setAttribute("data-theme", TEMAS_FIJOS[preferencia]);
}

export function guardarPreferenciaTema(preferencia: PreferenciaTema): void {
  try {
    if (preferencia === "sistema") localStorage.removeItem(CLAVE_TEMA);
    else localStorage.setItem(CLAVE_TEMA, preferencia);
  } catch {
    // Sin almacenamiento el tema sigue aplicándose en esta visita
  }
  aplicarTema(preferencia);
  window.dispatchEvent(new Event(EVENTO_TEMA));
}

export function suscribirseAlTema(alCambiar: () => void): () => void {
  window.addEventListener(EVENTO_TEMA, alCambiar);
  window.addEventListener("storage", alCambiar);
  return () => {
    window.removeEventListener(EVENTO_TEMA, alCambiar);
    window.removeEventListener("storage", alCambiar);
  };
}
