"use client";

import { ConfigFormSection } from "@/components/painel/ConfigFormSection";
import { FieldTipBeside } from "@/components/painel/FieldTip";

import { DELIVERY_CHOICES, PAYMENT_DEFAULTS } from "./constants";

type Props = {
  catalogLayout: "grid" | "list";
  onCatalogLayoutChange: (v: "grid" | "list") => void;
  orderGreeting: string;
  onOrderGreetingChange: (v: string) => void;
  hideUnavailable: boolean;
  onHideUnavailableChange: (v: boolean) => void;
  deliveryIds: string[];
  onDeliveryIdsChange: (next: string[] | ((prev: string[]) => string[])) => void;
  paymentEnabled: Record<string, boolean>;
  onPaymentEnabledChange: (next: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>)) => void;
};

export function ConfigVitrineCheckoutSection({
  catalogLayout,
  onCatalogLayoutChange,
  orderGreeting,
  onOrderGreetingChange,
  hideUnavailable,
  onHideUnavailableChange,
  deliveryIds,
  onDeliveryIdsChange,
  paymentEnabled,
  onPaymentEnabledChange,
}: Props) {
  return (
    <ConfigFormSection title="Vitrine e checkout" defaultOpen={false}>
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-slate-700" htmlFor="clay">
            <FieldTipBeside tip="Layout inicial do catálogo; o cliente pode mudar para o outro modo na vitrine.">
              Layout padrão do catálogo
            </FieldTipBeside>
          </label>
          <select
            id="clay"
            className="mt-1 max-w-xs rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={catalogLayout}
            onChange={(e) => onCatalogLayoutChange(e.target.value === "list" ? "list" : "grid")}
          >
            <option value="grid">Grade (cards)</option>
            <option value="list">Lista em linhas</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700" htmlFor="og">
            <FieldTipBeside tip="Texto opcional colocado no início da mensagem do pedido enviada por WhatsApp.">Saudação no WhatsApp (opcional)</FieldTipBeside>
          </label>
          <textarea
            id="og"
            rows={2}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={orderGreeting}
            onChange={(e) => onOrderGreetingChange(e.target.value)}
            placeholder="Olá! Segue o meu pedido pela loja online."
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-800">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300"
            checked={hideUnavailable}
            onChange={(e) => onHideUnavailableChange(e.target.checked)}
          />
          Ocultar produtos indisponíveis na listagem
        </label>
        <div>
          <span className="text-sm font-medium text-slate-700">Modos de recebimento na vitrine</span>
          <div className="mt-2 flex flex-col gap-2">
            {DELIVERY_CHOICES.map((d) => (
              <label key={d.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300"
                  checked={deliveryIds.includes(d.id)}
                  onChange={(e) => {
                    if (e.target.checked)
                      onDeliveryIdsChange((prev) => (prev.includes(d.id) ? prev : [...prev, d.id]));
                    else onDeliveryIdsChange((prev) => prev.filter((x) => x !== d.id));
                  }}
                />
                {d.title}
              </label>
            ))}
          </div>
        </div>
        <div>
          <span className="text-sm font-medium text-slate-700">Formas de pagamento oferecidas</span>
          <div className="mt-2 flex flex-col gap-2">
            {PAYMENT_DEFAULTS.map((p) => (
              <label key={p.id} className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 rounded border-slate-300"
                  checked={paymentEnabled[p.id] !== false}
                  onChange={(e) =>
                    onPaymentEnabledChange((prev) => ({ ...prev, [p.id]: e.target.checked }))
                  }
                />
                <span>{p.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </ConfigFormSection>
  );
}
