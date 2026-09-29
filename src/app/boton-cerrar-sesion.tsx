"use client";

import { signOut } from "next-auth/react";
import { Boton } from "@/componentes/boton";
import { Icono } from "@/componentes/icono";

export function BotonCerrarSesion() {
  return (
    <Boton
      variante="fantasma"
      className="max-lg:btn-square h-11 max-lg:w-11 max-lg:px-0"
      onClick={() => signOut({ callbackUrl: "/login" })}
    >
      <Icono nombre="cerrar-sesion" tamano={18} />
      <span className="max-lg:sr-only">Cerrar sesión</span>
    </Boton>
  );
}
