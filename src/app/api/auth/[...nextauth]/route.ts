import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth/opciones";

const manejador = NextAuth(authOptions);

export { manejador as GET, manejador as POST };
