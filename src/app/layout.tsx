import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Autogestión",
  description: "Centro de mando personal para gestionar frentes de trabajo",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={inter.variable} data-theme="autogestion-dark-lime">
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
