"use client";

import { useCallback, useState } from "react";

import { apiPainelJson, PainelApiError } from "@/lib/painel-api";
import { painelBtnPrimaryCompactClass, painelBtnSecondaryClass } from "@/lib/painel-button-classes";
import { buildEscPosFromOrderPrint, hasWebUsb } from "@/lib/escpos";

export type OrderPrintData = {
  store_name: string;
  store_slug: string;
  order_id: string;
  status: string;
  created_at: string;
  customer_note?: string | null;
  contact_name?: string | null;
  contact_phone?: string | null;
  delivery_address?: string | null;
  delivery_option_id?: string | null;
  payment_method_id?: string | null;
  lines: {
    product_name: string;
    quantity: string;
    unit_price: string;
    line_total: string;
  }[];
  total: string;
  print_config: {
    channel?: string;
    paper_width_mm?: number;
    shipping_label_size?: string;
  };
};

type Props = {
  orderId: string;
};

export function OrderPrintPanel({ orderId }: Props) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<OrderPrintData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usbMsg, setUsbMsg] = useState<string | null>(null);

  const loadPrint = useCallback(async () => {
    setLoading(true);
    setError(null);
    setUsbMsg(null);
    try {
      const d = await apiPainelJson<OrderPrintData>(`/api/v2/orders/${orderId}/print`);
      setData(d);
      setOpen(true);
    } catch (e: unknown) {
      setError(e instanceof PainelApiError ? e.message : "Não foi possível carregar dados de impressão.");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  const handlePrintDialog = useCallback(() => {
    if (!data) return;
    const html = buildReceiptHtml(data);
    const w = window.open("", "_blank", "width=420,height=720");
    if (!w) {
      setUsbMsg("Permita pop-ups para imprimir nesta janela, ou use Ctrl+P na pré-visualização.");
      return;
    }
    w.document.open();
    w.document.write(
      `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"/><title>Recibo</title>
      <style>
        body{font-family:ui-monospace,monospace;padding:16px;font-size:12px;color:#111}
        h1{font-size:14px;margin:0 0 8px;text-align:center}
        .muted{color:#444;font-size:11px;text-align:center}
        hr{border:none;border-top:1px solid #ccc;margin:8px 0}
        .row{display:flex;justify-content:space-between;font-size:11px}
        ul{list-style:none;padding:0;margin:0}
        li{margin-bottom:6px}
        .total{font-weight:bold;margin-top:8px;display:flex;justify-content:space-between}
      </style></head><body>${html}</body></html>`,
    );
    w.document.close();
    w.focus();
    w.print();
    w.close();
  }, [data]);

  const handleUsb = useCallback(async () => {
    if (!data) return;
    if (!hasWebUsb()) {
      setUsbMsg("Este navegador não expõe Web USB. Use Chrome/Edge ou imprima via sistema (pré-visualização → Imprimir).");
      return;
    }
    const usb = navigator.usb;
    if (!usb) {
      setUsbMsg("Web USB não está disponível neste navegador.");
      return;
    }
    try {
      const device = await usb.requestDevice({
        filters: [
          { vendorId: 0x04b8 },
          { vendorId: 0x0519 },
          { vendorId: 0x0fe6 },
          { vendorId: 0x28e9 },
        ],
      });
      await device.open();
      if (device.configuration === null) {
        await device.selectConfiguration(1);
      }
      await device.claimInterface(0);
      const payload = buildEscPosFromOrderPrint({
        store_name: data.store_name,
        order_id: data.order_id,
        status: data.status,
        created_at: data.created_at,
        customer_note: data.customer_note,
        contact_name: data.contact_name,
        contact_phone: data.contact_phone,
        delivery_address: data.delivery_address,
        delivery_option_id: data.delivery_option_id,
        payment_method_id: data.payment_method_id,
        lines: data.lines,
        total: data.total,
      });
      await device.transferOut(1, payload);
      await device.close();
      setUsbMsg("Dados enviados à impressora (experimental). Se não imprimir, confirme o perfil USB da impressora.");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setUsbMsg(`USB: ${msg}`);
    }
  }, [data]);

  const widthClass = data?.print_config?.paper_width_mm === 58 ? "max-w-[58mm]" : "max-w-[80mm]";

  return (
    <div className="mt-4 border-t border-slate-100 pt-4">
      <h3 className="text-sm font-semibold text-slate-900">Impressão</h3>
      <p className="mt-1 text-xs text-slate-500">
        Pré-visualização para papel térmico ou A4; envio USB directo é experimental e depende da impressora.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={loading}
          onClick={() => void loadPrint()}
          className={`${painelBtnSecondaryClass} disabled:opacity-50`}
        >
          {loading ? "A carregar…" : "Pré-visualizar / imprimir"}
        </button>
      </div>
      {error ? <p className="mt-2 text-xs text-amber-800">{error}</p> : null}
      {usbMsg ? <p className="mt-2 text-xs text-slate-600">{usbMsg}</p> : null}

      {open && data ? (
        <>
          <div
            className="print:hidden fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="print-preview-title"
          >
            <div className="mt-8 w-full max-w-lg rounded-xl bg-white p-4 shadow-xl">
              <div className="flex items-start justify-between gap-2">
                <h4 id="print-preview-title" className="text-sm font-semibold text-slate-900">
                  Pré-visualização
                </h4>
                <button
                  type="button"
                  className="text-sm text-slate-500 hover:text-slate-800"
                  onClick={() => setOpen(false)}
                >
                  Fechar
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handlePrintDialog}
                  className={painelBtnPrimaryCompactClass}
                >
                  Imprimir (sistema)
                </button>
                {data.print_config?.channel === "usb" ? (
                  <button
                    type="button"
                    onClick={() => void handleUsb()}
                    className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900"
                  >
                    USB térmica (experimental)
                  </button>
                ) : null}
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Para USB, active o canal &quot;USB&quot; em Configuração → Impressão. Largura:{" "}
                {data.print_config?.paper_width_mm ?? 80} mm.
              </p>

              <div className={`${widthClass} mx-auto mt-4 rounded border border-slate-200 bg-white p-4 text-slate-900`}>
                <ReceiptBody data={data} />
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

function buildReceiptHtml(data: OrderPrintData): string {
  const dt = new Date(data.created_at);
  const when = Number.isNaN(dt.getTime())
    ? data.created_at
    : dt.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const lines = data.lines
    .map(
      (ln) =>
        `<li><div><strong>${esc(ln.product_name)}</strong></div><div class="row"><span>${esc(ln.quantity)} × ${esc(
          ln.unit_price,
        )}</span><span>${esc(ln.line_total)}</span></div></li>`,
    )
    .join("");
  const contact =
    data.contact_name || data.contact_phone
      ? `<p>${data.contact_name ? `Cliente: ${esc(data.contact_name)}<br/>` : ""}${data.contact_phone ? `Tel: ${esc(data.contact_phone)}` : ""}</p>`
      : "";
  const note = data.customer_note ? `<p><strong>Nota:</strong> ${esc(data.customer_note)}</p>` : "";
  return `
    <h1>${esc(data.store_name)}</h1>
    <p class="muted">Pedido ${esc(data.order_id)}</p>
    <p><strong>Estado:</strong> ${esc(data.status)}</p>
    <p>${esc(String(when))}</p>
    <hr/>
    ${contact}
    ${data.delivery_option_id ? `<p>Recebimento: ${esc(data.delivery_option_id)}</p>` : ""}
    ${data.payment_method_id ? `<p>Pagamento: ${esc(data.payment_method_id)}</p>` : ""}
    ${data.delivery_address ? `<p>Endereço: ${esc(data.delivery_address)}</p>` : ""}
    ${note}
    <hr/><ul>${lines}</ul><hr/>
    <div class="total"><span>Total</span><span>${esc(data.total)}</span></div>
  `;
}

function ReceiptBody({ data }: { data: OrderPrintData }) {
  const dt = new Date(data.created_at);
  const when = Number.isNaN(dt.getTime())
    ? data.created_at
    : dt.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

  return (
    <div className="font-mono text-[12px] leading-relaxed">
      <p className="text-center font-bold">{data.store_name}</p>
      <p className="text-center text-[11px] text-slate-600">Pedido {data.order_id}</p>
      <p className="mt-2 text-[11px]">
        <span className="font-semibold">Estado:</span> {data.status}
      </p>
      <p className="text-[11px]">{when}</p>
      <hr className="my-2 border-slate-300" />
      {data.contact_name || data.contact_phone ? (
        <div className="text-[11px]">
          {data.contact_name ? <p>Cliente: {data.contact_name}</p> : null}
          {data.contact_phone ? <p>Tel: {data.contact_phone}</p> : null}
          {data.delivery_option_id ? <p>Recebimento: {data.delivery_option_id}</p> : null}
          {data.payment_method_id ? <p>Pagamento: {data.payment_method_id}</p> : null}
          {data.delivery_address ? <p>Endereço: {data.delivery_address}</p> : null}
        </div>
      ) : null}
      {data.customer_note ? (
        <p className="mt-1 text-[11px]">
          <span className="font-semibold">Nota:</span> {data.customer_note}
        </p>
      ) : null}
      <hr className="my-2 border-slate-300" />
      <ul className="space-y-1">
        {data.lines.map((ln, i) => (
          <li key={i}>
            <div className="font-medium">{ln.product_name}</div>
            <div className="flex justify-between text-[11px] text-slate-700">
              <span>
                {ln.quantity} × {ln.unit_price}
              </span>
              <span>{ln.line_total}</span>
            </div>
          </li>
        ))}
      </ul>
      <hr className="my-2 border-slate-300" />
      <p className="flex justify-between font-bold">
        <span>Total</span>
        <span>{data.total}</span>
      </p>
    </div>
  );
}
