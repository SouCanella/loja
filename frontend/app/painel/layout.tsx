import type { ReactNode } from "react";

import { PainelNotificationsProvider } from "@/components/painel/PainelNotificationsContext";
import { PainelShell } from "@/components/painel/PainelShell";

export default function PainelLayout({ children }: { children: ReactNode }) {
  return (
    <PainelNotificationsProvider>
      <PainelShell>{children}</PainelShell>
    </PainelNotificationsProvider>
  );
}
