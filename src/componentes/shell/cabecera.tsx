// Cabecera con buscador global, notificaciones, tema y datos de la sesión.
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BotonCerrarSesion } from "@/app/boton-cerrar-sesion";
import { Icono } from "@/componentes/icono";
import { GRUPOS_NAVEGACION } from "@/componentes/shell/barra-lateral";
import { InterruptorTema } from "@/componentes/shell/interruptor-tema";
import { Monograma } from "@/componentes/shell/marca";
import { MenuMovil } from "@/componentes/shell/menu-movil";
import { AvisosReuniones } from "./avisos-navegador";
import { IndicadorNotificaciones } from "./indicador-notificaciones";
import { SincronizacionAutomatica } from "./sincronizacion-automatica";

export function Cabecera({ usuario }: { usuario: string }) {
  const router = useRouter();
  const entradaRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [busquedaMovil, setBusquedaMovil] = useState(false);
  const inicial = usuario.trim().charAt(0).toUpperCase() || "U";

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setBusquedaMovil(true);
        entradaRef.current?.focus();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // En móvil el campo aparece al abrir la búsqueda y necesita recibir el foco ya visible
  useEffect(() => {
    if (busquedaMovil) entradaRef.current?.focus();
  }, [busquedaMovil]);

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
    <header className="border-linea-tarjeta bg-base-200 sticky top-0 z-30 border-b">
      <div className="relative flex h-16 items-center gap-1 px-2 sm:gap-2 sm:px-4 lg:px-6">
        <MenuMovil grupos={GRUPOS_NAVEGACION} />
        <Link
          href="/dashboard"
          aria-label="Autogestión, ir al panel"
          className="grid size-11 shrink-0 place-items-center rounded-full md:hidden"
        >
          <Monograma tamano={32} />
        </Link>

        <form
          role="search"
          onSubmit={handleSubmit}
          className={`items-center gap-1 md:relative md:inset-auto md:z-auto md:flex md:max-w-md md:min-w-0 md:flex-1 md:bg-transparent md:px-0 ${
            busquedaMovil ? "bg-base-200 absolute inset-0 z-10 flex px-2 sm:px-4" : "hidden"
          }`}
        >
          <div className="relative flex-1">
            <input
              ref={entradaRef}
              type="search"
              name="q"
              onChange={handleChange}
              onKeyDown={(e) => {
                if (e.key === "Escape") setBusquedaMovil(false);
              }}
              placeholder="Buscar…"
              autoComplete="off"
              className="input bg-base-100 h-11 w-full rounded-full pr-3 pl-11 lg:pr-20 [&::-webkit-search-cancel-button]:appearance-none"
              aria-label="Buscar en toda la aplicación"
            />
            <Icono
              nombre="busqueda"
              tamano={18}
              className="text-tenue pointer-events-none absolute top-1/2 left-4 -translate-y-1/2"
            />
            <kbd className="border-linea-tarjeta bg-hundida text-suave pointer-events-none absolute top-1/2 right-3 hidden -translate-y-1/2 rounded-full border px-2 py-0.5 font-mono text-[0.6875rem] font-medium lg:inline-flex">
              Ctrl K
            </kbd>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-square size-11 md:hidden"
            aria-label="Cerrar búsqueda"
            onClick={() => setBusquedaMovil(false)}
          >
            <Icono nombre="cerrar" tamano={20} />
          </button>
        </form>

        <div className="ml-auto flex items-center gap-0.5 sm:gap-1">
          <button
            type="button"
            className="btn btn-ghost btn-square size-11 md:hidden"
            aria-label="Abrir búsqueda"
            onClick={() => setBusquedaMovil(true)}
          >
            <Icono nombre="busqueda" tamano={20} />
          </button>
          <AvisosReuniones />
          <SincronizacionAutomatica />
          <IndicadorNotificaciones />
          <InterruptorTema />
          <span className="bg-base-300 mx-1 hidden h-6 w-px lg:block" aria-hidden="true" />
          <span
            className="bg-primary text-primary-content hidden size-9 shrink-0 place-items-center rounded-full border border-[var(--borde-primario)] text-sm font-extrabold lg:grid"
            title={usuario}
          >
            <span aria-hidden="true">{inicial}</span>
            <span className="sr-only">Sesión de {usuario}</span>
          </span>
          <BotonCerrarSesion />
        </div>
      </div>
    </header>
  );
}
