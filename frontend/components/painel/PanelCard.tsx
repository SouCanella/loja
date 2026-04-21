"use client";

import type { ReactNode } from "react";

import { painelCardClass } from "@/lib/painel-surface-classes";

type Props = {
  children: ReactNode;
  className?: string;
  /** Padding Tailwind, padrão p-4 */
  paddingClass?: string;
};

/**
 * Cartão de conteúdo reutilizável — mesma base visual que blocos `rounded-xl border …` no painel.
 */
export function PanelCard({ children, className = "", paddingClass = "p-4" }: Props) {
  return <div className={`${painelCardClass} ${paddingClass} ${className}`.trim()}>{children}</div>;
}
