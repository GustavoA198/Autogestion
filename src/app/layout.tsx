import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { SCRIPT_TEMA_INICIAL } from "@/lib/tema";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

const monoespaciada = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono-app",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Autogestión",
  description:
    "Tu trabajo, en orden: proyectos, credenciales, contactos, calendario y tareas en un solo lugar.",
  applicationName: "Autogestión",
};

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f6fa" },
    { media: "(prefers-color-scheme: dark)", color: "#131418" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // Sin data-theme inicial manda el sistema; el script del head aplica la elección guardada antes de pintar
    <html
      lang="es"
      className={`${jakarta.variable} ${monoespaciada.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA_INICIAL }} />
      </head>
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
