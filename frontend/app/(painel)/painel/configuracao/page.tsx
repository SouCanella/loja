"use client";

import { useEffect, useState } from "react";

import { ConfigAppearanceSection } from "@/components/painel/config-loja/ConfigAppearanceSection";
import { ConfigContactMarginSection } from "@/components/painel/config-loja/ConfigContactMarginSection";
import { ConfigIdentitySection } from "@/components/painel/config-loja/ConfigIdentitySection";
import { ConfigPrintSection } from "@/components/painel/config-loja/ConfigPrintSection";
import { ConfigSocialSection } from "@/components/painel/config-loja/ConfigSocialSection";
import { ConfigVitrineCheckoutSection } from "@/components/painel/config-loja/ConfigVitrineCheckoutSection";
import { DELIVERY_CHOICES, PAYMENT_DEFAULTS, SOCIAL_ICON_PRESETS } from "@/components/painel/config-loja/constants";
import {
  type Me,
  type SocialLinkRow,
  overlayPercentFromTheme,
  socialNetworksFromTheme,
  strFromTheme,
} from "@/components/painel/config-loja/types";
import { PainelTitleHelp } from "@/components/painel/FieldTip";
import { PainelFormSaveBar } from "@/components/painel/PainelFormSaveBar";
import { PainelStickyHeading } from "@/components/painel/PainelStickyHeading";
import { VitrinePreviewCard } from "@/components/painel/VitrinePreviewCard";
import { apiPainelJson, PainelApiError } from "@/lib/painel-api";
import { painelBtnPrimaryClass } from "@/lib/painel-button-classes";
import { painelPageContentWidthClass } from "@/lib/painel-layout-classes";

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
                  const label = s.label.trim() || (preset ? preset.label : "Rede social");
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
      <PainelStickyHeading>
        <PainelTitleHelp tip="Dados da loja: nome e redes sociais; aspecto da vitrine (textos, imagens, cores); contacto WhatsApp; referências de margem e mão de obra; impressão de recibos.">
          <h1 className="text-2xl font-semibold text-slate-900">Configuração da loja</h1>
        </PainelTitleHelp>
      </PainelStickyHeading>

      {err ? <p className="mt-4 text-sm text-amber-800">{err}</p> : null}
      {msg ? <p className="mt-4 text-sm text-emerald-800">{msg}</p> : null}

      {me ? (
        <>
          <div className={`mt-6 ${painelPageContentWidthClass}`}>
            <VitrinePreviewCard storeSlug={me.store_slug} storeName={name} />
          </div>
          <form
            id="config-loja-form"
            onSubmit={saveProfile}
            className={`mt-6 ${painelPageContentWidthClass} space-y-4 pb-28 md:pb-32`}
          >
            <ConfigIdentitySection name={name} onNameChange={setName} />
            <ConfigSocialSection socialLinks={socialLinks} onSocialLinksChange={setSocialLinks} />
            <ConfigAppearanceSection
              logoImageUrl={logoImageUrl}
              onLogoImageUrlChange={setLogoImageUrl}
              tagline={tagline}
              onTaglineChange={setTagline}
              backgroundImageUrl={backgroundImageUrl}
              onBackgroundImageUrlChange={setBackgroundImageUrl}
              bgOverlayPercent={bgOverlayPercent}
              onBgOverlayPercentChange={setBgOverlayPercent}
              primaryColor={primaryColor}
              onPrimaryColorChange={setPrimaryColor}
              accentColor={accentColor}
              onAccentColorChange={setAccentColor}
            />
            <ConfigVitrineCheckoutSection
              catalogLayout={catalogLayout}
              onCatalogLayoutChange={setCatalogLayout}
              orderGreeting={orderGreeting}
              onOrderGreetingChange={setOrderGreeting}
              hideUnavailable={hideUnavailable}
              onHideUnavailableChange={setHideUnavailable}
              deliveryIds={deliveryIds}
              onDeliveryIdsChange={setDeliveryIds}
              paymentEnabled={paymentEnabled}
              onPaymentEnabledChange={setPaymentEnabled}
            />
            <ConfigContactMarginSection
              wa={wa}
              onWaChange={setWa}
              tz={tz}
              onTzChange={setTz}
              margin={margin}
              onMarginChange={setMargin}
              laborRate={laborRate}
              onLaborRateChange={setLaborRate}
            />
            <ConfigPrintSection
              printChannel={printChannel}
              onPrintChannelChange={setPrintChannel}
              paperWidthMm={paperWidthMm}
              onPaperWidthMmChange={setPaperWidthMm}
              shippingLabelSize={shippingLabelSize}
              onShippingLabelSizeChange={setShippingLabelSize}
            />
            <div className="flex flex-col gap-2 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-xl text-xs text-slate-500 print:hidden">
                O botão «Guardar» no fundo do ecrã repete a mesma acção e mantém-se visível ao percorrer o
                formulário.
              </p>
              <button type="submit" className={`min-h-[44px] shrink-0 self-end sm:self-auto ${painelBtnPrimaryClass}`}>
                Guardar alterações
              </button>
            </div>
          </form>
          <PainelFormSaveBar formId="config-loja-form" submitLabel="Guardar" />
        </>
      ) : !err ? (
        <p className="mt-8 text-sm text-slate-500">A carregar…</p>
      ) : null}
    </>
  );
}
