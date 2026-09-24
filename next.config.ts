import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Genera una salida mínima para la imagen de Docker
  output: "standalone",
  poweredByHeader: false,
};

export default nextConfig;
