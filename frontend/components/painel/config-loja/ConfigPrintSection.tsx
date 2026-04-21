"use client";

import { ConfigFormSection } from "@/components/painel/ConfigFormSection";

type Props = {
  printChannel: "off" | "usb" | "bluetooth";
  onPrintChannelChange: (v: "off" | "usb" | "bluetooth") => void;
  paperWidthMm: 58 | 80;
  onPaperWidthMmChange: (v: 58 | 80) => void;
  shippingLabelSize: "a4" | "a6";
  onShippingLabelSizeChange: (v: "a4" | "a6") => void;
};

export function ConfigPrintSection({
  printChannel,
  onPrintChannelChange,
  paperWidthMm,
  onPaperWidthMmChange,
  shippingLabelSize,
  onShippingLabelSizeChange,
}: Props) {
  return (
    <ConfigFormSection title="Impressão de pedidos" defaultOpen={false}>
      <p className="text-xs text-slate-500">
        Configuração para recibos no painel e tentativa de envio USB (Chrome/Edge, HTTPS ou localhost). Bluetooth Web
        API é ainda mais limitada — use impressão do sistema quando possível.
      </p>
      <div className="mt-3 space-y-3">
        <div>
          <label className="block text-sm font-medium text-slate-700" htmlFor="pch">
            Canal térmico
          </label>
          <select
            id="pch"
            className="mt-1 max-w-md rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={printChannel}
            onChange={(e) => {
              const v = e.target.value;
              if (v === "usb" || v === "bluetooth" || v === "off") onPrintChannelChange(v);
            }}
          >
            <option value="off">Desligado (só HTML / impressão do sistema)</option>
            <option value="usb">USB (experimental — Web USB)</option>
            <option value="bluetooth">Bluetooth (experimental)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700" htmlFor="pwm">
            Largura do papel térmico (mm)
          </label>
          <select
            id="pwm"
            className="mt-1 max-w-xs rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={paperWidthMm}
            onChange={(e) => onPaperWidthMmChange(e.target.value === "58" ? 58 : 80)}
          >
            <option value="80">80 mm</option>
            <option value="58">58 mm</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700" htmlFor="sls">
            Tamanho da etiqueta de envio (referência)
          </label>
          <select
            id="sls"
            className="mt-1 max-w-xs rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={shippingLabelSize}
            onChange={(e) => onShippingLabelSizeChange(e.target.value === "a6" ? "a6" : "a4")}
          >
            <option value="a4">A4</option>
            <option value="a6">A6</option>
          </select>
        </div>
      </div>
    </ConfigFormSection>
  );
}
