import type { DefaultSession } from "next-auth";

// Con estrategia JWT el id del usuario no viaja a la sesión salvo que se declare aquí
declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & { id: string };
  }
}
