"use client";

import { signOut } from "next-auth/react";

export function BotonCerrarSesion() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="rounded border border-zinc-400 px-3 py-1.5 text-sm"
    >
      Cerrar sesión
    </button>
  );
}
