import type { HTMLAttributes } from "react";

type Tono =
  | "primary"
  | "secondary"
  | "accent"
  | "info"
  | "success"
  | "warning"
  | "error"
  | "neutral"
  | "ghost";

const CLASES: Record<Tono, string> = {
  primary: "badge-primary",
  secondary: "badge-secondary",
  accent: "badge-accent",
  info: "badge-info",
  success: "badge-success",
  warning: "badge-warning",
  error: "badge-error",
  neutral: "badge-neutral",
  ghost: "badge-ghost",
};

type Propiedades = HTMLAttributes<HTMLSpanElement> & {
  tono?: Tono;
  contorno?: boolean;
};

export function Insignia({
  tono = "neutral",
  contorno = false,
  className,
  children,
  ...resto
}: Propiedades) {
  const clases = ["badge", CLASES[tono], contorno ? "badge-outline" : "", className]
    .filter(Boolean)
    .join(" ");
  return (
    <span className={clases} {...resto}>
      {children}
    </span>
  );
}
