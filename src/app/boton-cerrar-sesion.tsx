"use client";

import { signOut } from "next-auth/react";
import { Boton } from "@/componentes/boton";
import { Icono } from "@/componentes/icono";

export function BotonCerrarSesion() {
  return (
    <Boton
      variante="secundario"
      tamano="pequeno"
      onClick={() => signOut({ callbackUrl: "/login" })}
    >
      <Icono nombre="cerrar-sesion" tamano={16} />
      Cerrar sesión
    </Boton>
  );
}
