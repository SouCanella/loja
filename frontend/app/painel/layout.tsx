import type { ReactNode } from "react";

import { PainelShell } from "@/components/painel/PainelShell";

export default function PainelLayout({ children }: { children: ReactNode }) {
  return <PainelShell>{children}</PainelShell>;
}
