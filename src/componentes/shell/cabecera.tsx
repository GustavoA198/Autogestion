// Cabecera con indicador de notificaciones pendientes y buscador global.
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { BotonCerrarSesion } from "@/app/boton-cerrar-sesion";
import { SECCIONES_PRINCIPALES } from "@/componentes/shell/barra-lateral";
import { MenuMovil } from "@/componentes/shell/menu-movil";
import { IndicadorNotificaciones } from "./indicador-notificaciones";

export function Cabecera() {
  const router = useRouter();
  const entradaRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        entradaRef.current?.focus();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const termino = entradaRef.current?.value.trim() ?? "";
    if (termino.length >= 2) {
      router.push(`/buscar?q=${encodeURIComponent(termino)}`);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const valor = e.target.value;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (valor.trim().length >= 2) {
      debounceRef.current = setTimeout(() => {
        router.push(`/buscar?q=${encodeURIComponent(valor.trim())}`);
      }, 300);
    }
  }

  return (
    <header className="border-base-300 bg-base-100/95 sticky top-0 z-30 border-b backdrop-blur">
      <div className="flex items-center gap-3 px-4 py-3 lg:px-6">
        <MenuMovil secciones={SECCIONES_PRINCIPALES} />
        <form
          onSubmit={handleSubmit}
          className="hidden flex-1 items-center gap-2 md:flex lg:max-w-md"
        >
          <input
            ref={entradaRef}
            type="search"
            name="q"
            onChange={handleChange}
            placeholder="Buscar (Ctrl+K)"
            className="input input-bordered input-sm w-full max-w-xs"
            aria-label="Buscar en toda la aplicación"
          />
        </form>
        <div className="ml-auto flex items-center gap-3">
          <IndicadorNotificaciones />
          <BotonCerrarSesion />
        </div>
      </div>
    </header>
  );
}
