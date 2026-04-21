"use client";

import { useEffect, useState } from "react";

import { ConfigFormSection } from "@/components/painel/ConfigFormSection";
import { FieldTipBeside } from "@/components/painel/FieldTip";
import { PainelFormSaveBar } from "@/components/painel/PainelFormSaveBar";
import { PainelStickyHeading } from "@/components/painel/PainelStickyHeading";
import { HexColorInput } from "@/components/painel/HexColorInput";
import { ImageUploadButton } from "@/components/painel/ImageUploadButton";
import { VitrinePreviewCard } from "@/components/painel/VitrinePreviewCard";
import { apiPainelJson, PainelApiError } from "@/lib/painel-api";
import { painelBtnDangerClass, painelBtnLinkClass } from "@/lib/painel-button-classes";

type Me = {
  store_name: string;
  store_slug: string;
  vitrine_whatsapp?: string | null;
  vitrine_theme?: Record<string, unknown> | null;
  store_target_margin_percent: string | number;
  store_labor_rate_per_hour?: string | number;
  print_config?: {
    channel?: string;
    paper_width_mm?: number;
    shipping_label_size?: string;
  };
};

function strFromTheme(v: Record<string, unknown> | null | undefined, key: string): string {
  if (!v) return "";
  const x = v[key];
  return typeof x === "string" ? x : "";
}

function overlayPercentFromTheme(v: Record<string, unknown> | null | undefined): number {
  if (!v) return 88;
  const x = v["background_overlay_percent"];
  let n = 88;
  if (typeof x === "number" && Number.isFinite(x)) n = Math.round(x);
  else if (typeof x === "string") {
    const p = Number.parseFloat(x.replace(",", "."));
    if (!Number.isNaN(p)) n = Math.round(p);
  }
  return Math.max(15, Math.min(97, n));
}

const DELIVERY_CHOICES: { id: string; title: string }[] = [
  { id: "retirada", title: "Retirar na loja" },
  { id: "loja_entrega", title: "Entrega pela loja" },
  { id: "uber", title: "Uber Entregas" },
  { id: "nove", title: "99 Entregas" },
];

const PAYMENT_DEFAULTS: { id: string; label: string }[] = [
  { id: "pix", label: "PIX (chave ou QR enviados após confirmação)" },
  { id: "entrega_dinheiro", label: "Dinheiro na entrega ou na retirada" },
  { id: "entrega_cartao", label: "Cartão de crédito/débito na entrega" },
  { id: "entrega_pix", label: "PIX na entrega (na hora)" },
];

/** Valores alinhados a `catalog-hero` (`socialIconLabel` usa `icon.includes(...)`). */
const SOCIAL_ICON_PRESETS: { value: string; label: string }[] = [
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "tiktok", label: "TikTok" },
  { value: "youtube", label: "YouTube" },
  { value: "link", label: "Outro / site" },
];

type SocialLinkRow = { label: string; url: string; icon: string };

function normalizeSocialIcon(icon: string): string {
  const i = icon.toLowerCase();
  if (i.includes("instagram")) return "instagram";
  if (i.includes("facebook")) return "facebook";
  if (i.includes("tiktok")) return "tiktok";
  if (i.includes("youtube")) return "youtube";
  return "link";
}

function socialNetworksFromTheme(v: Record<string, unknown> | null | undefined): SocialLinkRow[] {
  if (!v) return [];
  const raw = v["social_networks"];
  if (!Array.isArray(raw)) return [];
  const out: SocialLinkRow[] = [];
  for (const item of raw) {
    if (typeof item !== "object" || item === null) continue;
    const o = item as Record<string, unknown>;
    const url = typeof o.url === "string" ? o.url.trim() : "";
    if (!url) continue;
    const label = typeof o.label === "string" ? o.label : "";
    const iconRaw = typeof o.icon === "string" ? o.icon : "link";
    out.push({
      url,
      label,
      icon: normalizeSocialIcon(iconRaw),
    });
  }
  return out;
}

export default function ConfiguracaoLojaPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [name, setName] = useState("");
  const [wa, setWa] = useState("");
  const [tz, setTz] = useState("America/Sao_Paulo");
  const [margin, setMargin] = useState("30");
  const [laborRate, setLaborRate] = useState("");
  const [tagline, setTagline] = useState("");
  const [logoImageUrl, setLogoImageUrl] = useState("");
  const [backgroundImageUrl, setBackgroundImageUrl] = useState("");
  const [bgOverlayPercent, setBgOverlayPercent] = useState(88);
  const [primaryColor, setPrimaryColor] = useState("");
  const [accentColor, setAccentColor] = useState("");
  const [catalogLayout, setCatalogLayout] = useState<"grid" | "list">("grid");
  const [orderGreeting, setOrderGreeting] = useState("");
  const [hideUnavailable, setHideUnavailable] = useState(false);
  const [deliveryIds, setDeliveryIds] = useState<string[]>(() => DELIVERY_CHOICES.map((d) => d.id));
  const [paymentEnabled, setPaymentEnabled] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(PAYMENT_DEFAULTS.map((p) => [p.id, true])),
  );
  const [socialLinks, setSocialLinks] = useState<SocialLinkRow[]>([]);
  const [printChannel, setPrintChannel] = useState<"off" | "usb" | "bluetooth">("off");
  const [paperWidthMm, setPaperWidthMm] = useState<58 | 80>(80);
  const [shippingLabelSize, setShippingLabelSize] = useState<"a4" | "a6">("a4");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    void apiPainelJson<Me>("/api/v2/me")
      .then((m) => {
        setMe(m);
        setName(m.store_name);
        setWa(m.vitrine_whatsapp ?? "");
        const vt = m.vitrine_theme;
        setTagline(strFromTheme(vt, "tagline"));
        setLogoImageUrl(strFromTheme(vt, "logo_image_url"));
        setBackgroundImageUrl(strFromTheme(vt, "hero_image_url"));
        setBgOverlayPercent(overlayPercentFromTheme(vt));
        setPrimaryColor(strFromTheme(vt, "primary_color"));
        setAccentColor(strFromTheme(vt, "accent_color"));
        setCatalogLayout(vt?.catalog_layout_default === "list" ? "list" : "grid");
        setOrderGreeting(strFromTheme(vt, "order_greeting"));
        setHideUnavailable(vt?.hide_unavailable_products === true);
        const dIds = vt?.delivery_option_ids;
        if (Array.isArray(dIds) && dIds.length > 0) {
          setDeliveryIds(dIds.filter((x): x is string => typeof x === "string"));
        } else {
          setDeliveryIds(DELIVERY_CHOICES.map((d) => d.id));
        }
        const pm = vt?.payment_methods;
        if (Array.isArray(pm) && pm.length > 0) {
          const next: Record<string, boolean> = Object.fromEntries(
            PAYMENT_DEFAULTS.map((p) => [p.id, true]),
          );
          for (const item of pm) {
            if (typeof item === "object" && item !== null && "id" in item) {
              const id = String((item as { id: string }).id);
              const en = (item as { enabled?: boolean }).enabled;
              if (id in next) next[id] = en !== false;
            }
          }
          setPaymentEnabled(next);
        } else {
          setPaymentEnabled(Object.fromEntries(PAYMENT_DEFAULTS.map((p) => [p.id, true])));
        }
        setSocialLinks(socialNetworksFromTheme(vt ?? undefined));
        const sm = m.store_target_margin_percent;
        setMargin(typeof sm === "number" ? String(sm) : String(sm ?? "30"));
        const lr = m.store_labor_rate_per_hour;
        if (lr != null) {
          const n = typeof lr === "number" ? lr : Number.parseFloat(String(lr));
          setLaborRate(!Number.isNaN(n) && n > 0 ? String(lr) : "");
        } else {
          setLaborRate("");
        }
        const pc = m.print_config;
        if (pc && typeof pc === "object") {
          const ch = pc.channel;
          if (ch === "usb" || ch === "bluetooth" || ch === "off") setPrintChannel(ch);
          const w = pc.paper_width_mm;
          if (w === 58 || w === 80) setPaperWidthMm(w);
          const sz = pc.shipping_label_size;
          if (sz === "a4" || sz === "a6") setShippingLabelSize(sz);
        }
      })
      .catch(() => setErr("Não foi possível carregar os dados da loja."));
  }, []);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setErr(null);
    try {
      await apiPainelJson("/api/v2/me/store-settings", {
        method: "PATCH",
        body: JSON.stringify({
          store_name: name.trim(),
          theme: {
            vitrine: {
              whatsapp: wa.trim() || undefined,
              tagline: tagline.trim() || undefined,
              logo_image_url: logoImageUrl.trim() ? logoImageUrl.trim() : null,
              hero_image_url: backgroundImageUrl.trim() ? backgroundImageUrl.trim() : null,
              background_overlay_percent: bgOverlayPercent,
              primary_color: primaryColor.trim() || undefined,
              accent_color: accentColor.trim() || undefined,
              catalog_layout_default: catalogLayout,
              order_greeting: orderGreeting.trim() || undefined,
              hide_unavailable_products: hideUnavailable,
              delivery_option_ids:
                deliveryIds.length > 0 ? deliveryIds : DELIVERY_CHOICES.map((d) => d.id),
              payment_methods: PAYMENT_DEFAULTS.map((p) => ({
                id: p.id,
                label: p.label,
                enabled: paymentEnabled[p.id] !== false,
              })),
              social_networks: socialLinks
                .filter((s) => s.url.trim())
                .map((s) => {
                  const preset = SOCIAL_ICON_PRESETS.find((x) => x.value === s.icon);
                  const label =
                    s.label.trim() ||
                    (preset ? preset.label : "Rede social");
                  return {
                    label,
                    url: s.url.trim(),
                    icon: s.icon,
                  };
                }),
            },
          },
          config: {
            general: { timezone: tz.trim() },
            print: {
              channel: printChannel,
              paper_width_mm: paperWidthMm,
              shipping_label_size: shippingLabelSize,
            },
          },
        }),
      });
      const m = Number.parseFloat(margin.replace(",", "."));
      const lrRaw = laborRate.trim().replace(",", ".");
      const lrParsed = lrRaw === "" ? 0 : Number.parseFloat(lrRaw);
      if (!Number.isNaN(m)) {
        await apiPainelJson("/api/v2/me/store-pricing", {
          method: "PATCH",
          body: JSON.stringify({
            target_margin_percent: m,
            labor_rate_per_hour: Number.isNaN(lrParsed) || lrParsed < 0 ? 0 : lrParsed,
          }),
        });
      }
      const updated = await apiPainelJson<Me>("/api/v2/me");
      setMe(updated);
      const pc2 = updated.print_config;
      if (pc2 && typeof pc2 === "object") {
        const ch = pc2.channel;
        if (ch === "usb" || ch === "bluetooth" || ch === "off") setPrintChannel(ch);
        const w = pc2.paper_width_mm;
        if (w === 58 || w === 80) setPaperWidthMm(w);
        const sz = pc2.shipping_label_size;
        if (sz === "a4" || sz === "a6") setShippingLabelSize(sz);
      }
      const vt2 = updated.vitrine_theme;
      setTagline(strFromTheme(vt2, "tagline"));
      setLogoImageUrl(strFromTheme(vt2, "logo_image_url"));
      setBackgroundImageUrl(strFromTheme(vt2, "hero_image_url"));
      setBgOverlayPercent(overlayPercentFromTheme(vt2));
      setPrimaryColor(strFromTheme(vt2, "primary_color"));
      setAccentColor(strFromTheme(vt2, "accent_color"));
      setCatalogLayout(vt2?.catalog_layout_default === "list" ? "list" : "grid");
      setOrderGreeting(strFromTheme(vt2, "order_greeting"));
      setHideUnavailable(vt2?.hide_unavailable_products === true);
      setSocialLinks(socialNetworksFromTheme(vt2 ?? undefined));
      const sm2 = updated.store_target_margin_percent;
      setMargin(typeof sm2 === "number" ? String(sm2) : String(sm2 ?? "30"));
      const lrUp = updated.store_labor_rate_per_hour;
      if (lrUp != null) {
        const n = typeof lrUp === "number" ? lrUp : Number.parseFloat(String(lrUp));
        setLaborRate(!Number.isNaN(n) && n > 0 ? String(lrUp) : "");
      } else {
        setLaborRate("");
      }
      setMsg(
        "Alterações guardadas. Se já tinha a vitrine aberta, actualize o separador da pré-visualização para ver o resultado.",
      );
    } catch (e: unknown) {
      setErr(e instanceof PainelApiError ? e.message : "Erro ao guardar.");
    }
  }

  return (
    <>
      <PainelStickyHeading
        title="Configuração da loja"
        description="Identidade da loja, redes sociais, aparência da vitrine (textos, imagem, cores), WhatsApp, margem e mão de obra."
      />

      {err ? <p className="mt-4 text-sm text-amber-800">{err}</p> : null}
      {msg ? <p className="mt-4 text-sm text-emerald-800">{msg}</p> : null}

      {me ? (
        <>
          <div className="mt-6 max-w-xl">
            <div className="mb-2 text-xs font-medium text-slate-600">
              <FieldTipBeside tip="Abre a loja pública num novo separador. Guarde as alterações na página para reflectir tema e textos na vitrine. Copiar coloca o URL completo na área de transferência; Partilhar usa a folha nativa do sistema ou copia o link.">
                Pré-visualização da vitrine
              </FieldTipBeside>
            </div>
            <VitrinePreviewCard storeSlug={me.store_slug} storeName={name} />
          </div>
          <form
            id="config-loja-form"
            onSubmit={saveProfile}
            className="mt-6 max-w-xl space-y-4 pb-28 md:pb-32"
          >
          <ConfigFormSection title="Identidade da loja" defaultOpen>
          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="sn">
              <FieldTipBeside tip="Nome apresentado na vitrine e em comunicações com o cliente.">
                Nome da loja
              </FieldTipBeside>
            </label>
            <input
              id="sn"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          </ConfigFormSection>
          <ConfigFormSection title="Redes sociais" defaultOpen>
            <p className="text-xs text-slate-500">
              Aparecem na vitrine pública (secção «Redes sociais» no catálogo). Cada link abre num novo separador.
            </p>
            <div className="mt-3 space-y-3">
              {socialLinks.map((row, idx) => (
                <div
                  key={idx}
                  className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3 lg:flex-row lg:flex-wrap lg:items-end"
                >
                  <div className="w-full shrink-0 lg:w-40">
                    <label className="block text-xs font-medium text-slate-600" htmlFor={`soc-icon-${idx}`}>
                      Tipo / ícone
                    </label>
                    <select
                      id={`soc-icon-${idx}`}
                      className="mt-1 w-full rounded-md border border-slate-300 px-2 py-2 text-sm"
                      value={row.icon}
                      onChange={(e) =>
                        setSocialLinks((prev) =>
                          prev.map((r, i) => (i === idx ? { ...r, icon: e.target.value } : r)),
                        )
                      }
                    >
                      {SOCIAL_ICON_PRESETS.map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="min-w-0 flex-1 lg:min-w-[220px]">
                    <label className="block text-xs font-medium text-slate-600" htmlFor={`soc-url-${idx}`}>
                      URL (https)
                    </label>
                    <input
                      id={`soc-url-${idx}`}
                      type="url"
                      className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                      value={row.url}
                      onChange={(e) =>
                        setSocialLinks((prev) =>
                          prev.map((r, i) => (i === idx ? { ...r, url: e.target.value } : r)),
                        )
                      }
                      placeholder="https://instagram.com/sua_loja"
                    />
                  </div>
                  <div className="min-w-0 flex-1 lg:min-w-[200px]">
                    <label className="block text-xs font-medium text-slate-600" htmlFor={`soc-lbl-${idx}`}>
                      Rótulo (opcional)
                    </label>
                    <input
                      id={`soc-lbl-${idx}`}
                      className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                      value={row.label}
                      onChange={(e) =>
                        setSocialLinks((prev) =>
                          prev.map((r, i) => (i === idx ? { ...r, label: e.target.value } : r)),
                        )
                      }
                      placeholder="Segue-nos no Instagram"
                    />
                  </div>
                  <div className="flex justify-end lg:shrink-0">
                    <button
                      type="button"
                      className={painelBtnDangerClass}
                      onClick={() => setSocialLinks((prev) => prev.filter((_, i) => i !== idx))}
                    >
                      Remover
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                className={painelBtnLinkClass}
                onClick={() =>
                  setSocialLinks((prev) => [
                    ...prev,
                    { label: "", url: "", icon: "instagram" },
                  ])
                }
              >
                + Adicionar rede
              </button>
            </div>
          </ConfigFormSection>
          <ConfigFormSection title="Aparência da vitrine" defaultOpen>
            <p className="text-xs text-slate-500">
              O cliente vê estas opções na loja pública (URL da loja definida no registo). São poucos campos a propósito —
              sem um editor complexo.
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700" htmlFor="logo">
                  <FieldTipBeside tip="Imagem quadrada ou horizontal do logótipo no topo da vitrine (PNG ou SVG com URL https). Se ficar vazio, usa-se o emoji de reserva (definido nos dados da loja).">
                    Logótipo da loja (URL https)
                  </FieldTipBeside>
                </label>
                <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-end">
                  <input
                    id="logo"
                    type="url"
                    className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
                    value={logoImageUrl}
                    onChange={(e) => setLogoImageUrl(e.target.value)}
                    placeholder="https://exemplo.com/logo.png"
                  />
                  <ImageUploadButton
                    purpose="vitrine_logo"
                    onUploaded={(url) => setLogoImageUrl(url)}
                    label="Enviar ficheiro"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700" htmlFor="tg">
                  <FieldTipBeside tip="Texto curto abaixo do nome (ex.: doces artesanais entregues em Lisboa).">
                    Frase / slogan
                  </FieldTipBeside>
                </label>
                <input
                  id="tg"
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="Opcional"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700" htmlFor="hi">
                  <FieldTipBeside tip="Textura ou fotografia suave em ecrã inteiro por detrás do conteúdo. Link direto .jpg / .png; apenas https. Deixe vazio para fundo sólido.">
                    Imagem de fundo (URL https)
                  </FieldTipBeside>
                </label>
                <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-end">
                  <input
                    id="hi"
                    type="url"
                    className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
                    value={backgroundImageUrl}
                    onChange={(e) => setBackgroundImageUrl(e.target.value)}
                    placeholder="https://exemplo.com/fundo.jpg"
                  />
                  <ImageUploadButton
                    purpose="vitrine_hero"
                    onUploaded={(url) => setBackgroundImageUrl(url)}
                    label="Enviar ficheiro"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700" htmlFor="bgsoft">
                  <FieldTipBeside tip="Controla o véu claro sobre a foto: valores mais altos deixam o site mais sóbrio e o texto mais legível; valores mais baixos mostram mais a imagem. Só altera o aspecto quando há imagem de fundo.">
                    Suavização do fundo
                  </FieldTipBeside>
                </label>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <input
                    id="bgsoft"
                    type="range"
                    min={15}
                    max={97}
                    step={1}
                    value={bgOverlayPercent}
                    onChange={(e) => setBgOverlayPercent(Number(e.target.value))}
                    className="h-2 w-full max-w-xs cursor-pointer accent-painel-primary"
                  />
                  <span className="text-sm tabular-nums text-slate-600">{bgOverlayPercent}%</span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Mais alto = fundo mais discreto (aspecto mais profissional). Mais baixo = foto mais visível.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700" htmlFor="pc">
                    <FieldTipBeside tip="Cor base da identidade na vitrine (hex). Use a barra ou escreva o código.">
                      Cor principal
                    </FieldTipBeside>
                  </label>
                  <HexColorInput
                    id="pc"
                    value={primaryColor}
                    onChange={setPrimaryColor}
                    placeholder="#0f766e"
                    aria-label="Cor principal (selector e hexadecimal)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700" htmlFor="ac">
                    <FieldTipBeside tip="Botões e realces (hex). Use a barra ou escreva o código.">
                      Cor de destaque
                    </FieldTipBeside>
                  </label>
                  <HexColorInput
                    id="ac"
                    value={accentColor}
                    onChange={setAccentColor}
                    placeholder="#f59e0b"
                    aria-label="Cor de destaque (selector e hexadecimal)"
                  />
                </div>
              </div>
            </div>
          </ConfigFormSection>
          <ConfigFormSection title="Vitrine e checkout" defaultOpen={false}>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700" htmlFor="clay">
                  <FieldTipBeside tip="Grade ou lista — o cliente ainda pode alternar na vitrine.">
                    Layout padrão do catálogo
                  </FieldTipBeside>
                </label>
                <select
                  id="clay"
                  className="mt-1 max-w-xs rounded-md border border-slate-300 px-3 py-2 text-sm"
                  value={catalogLayout}
                  onChange={(e) => setCatalogLayout(e.target.value === "list" ? "list" : "grid")}
                >
                  <option value="grid">Grade (cards)</option>
                  <option value="list">Lista em linhas</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700" htmlFor="og">
                  <FieldTipBeside tip="Texto no início da mensagem do pedido.">
                    Saudação no WhatsApp (opcional)
                  </FieldTipBeside>
                </label>
                <textarea
                  id="og"
                  rows={2}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  value={orderGreeting}
                  onChange={(e) => setOrderGreeting(e.target.value)}
                  placeholder="Olá! Segue o meu pedido pela loja online."
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-800">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300"
                  checked={hideUnavailable}
                  onChange={(e) => setHideUnavailable(e.target.checked)}
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
                            setDeliveryIds((prev) => (prev.includes(d.id) ? prev : [...prev, d.id]));
                          else setDeliveryIds((prev) => prev.filter((x) => x !== d.id));
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
                          setPaymentEnabled((prev) => ({ ...prev, [p.id]: e.target.checked }))
                        }
                      />
                      <span>{p.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </ConfigFormSection>
          <ConfigFormSection title="Contacto, horário e margem" defaultOpen={false}>
          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="wa">
              <FieldTipBeside tip="Número usado no botão ou link wa.me na vitrine.">WhatsApp (vitrine)</FieldTipBeside>
            </label>
            <input
              id="wa"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              placeholder="+55…"
              value={wa}
              onChange={(e) => setWa(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="tz">
              Fuso horário (referência)
            </label>
            <input
              id="tz"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={tz}
              onChange={(e) => setTz(e.target.value)}
            />
            <p className="mt-1 text-xs text-slate-500">
              Usado em configuração; agregações actuais do dashboard continuam em UTC.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="mg">
              <FieldTipBeside tip="Percentual usado em sugestões de preço e na margem efectiva quando a receita não define margem própria.">
                Margem alvo da loja (%)
              </FieldTipBeside>
            </label>
            <input
              id="mg"
              type="text"
              inputMode="decimal"
              className="mt-1 w-full max-w-[200px] rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={margin}
              onChange={(e) => setMargin(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="labor">
              <FieldTipBeside tip="Usado com o tempo (minutos) de cada receita para repartir o custo de mão de obra por unidade produzida e incluir na sugestão de preço (junto à margem %). Deixe vazio para não contabilizar MO.">
                Mão de obra (R$ / hora)
              </FieldTipBeside>
            </label>
            <input
              id="labor"
              type="text"
              inputMode="decimal"
              className="mt-1 w-full max-w-[200px] rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={laborRate}
              onChange={(e) => setLaborRate(e.target.value)}
              placeholder="ex.: 100"
            />
            <p className="mt-1 text-xs text-slate-500">
              Custo MO por unidade = (taxa × minutos da receita ÷ 60) ÷ rendimento.
            </p>
          </div>
          </ConfigFormSection>
          <ConfigFormSection title="Impressão de pedidos" defaultOpen={false}>
            <p className="text-xs text-slate-500">
              Configuração para recibos no painel e tentativa de envio USB (Chrome/Edge, HTTPS ou localhost). Bluetooth
              Web API é ainda mais limitada — use impressão do sistema quando possível.
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
                    if (v === "usb" || v === "bluetooth" || v === "off") setPrintChannel(v);
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
                  onChange={(e) => setPaperWidthMm(e.target.value === "58" ? 58 : 80)}
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
                  onChange={(e) => setShippingLabelSize(e.target.value === "a6" ? "a6" : "a4")}
                >
                  <option value="a4">A4</option>
                  <option value="a6">A6</option>
                </select>
              </div>
            </div>
          </ConfigFormSection>
        </form>
          <PainelFormSaveBar formId="config-loja-form" submitLabel="Guardar" />
        </>
      ) : !err ? (
        <p className="mt-8 text-sm text-slate-500">A carregar…</p>
      ) : null}
    </>
  );
}
