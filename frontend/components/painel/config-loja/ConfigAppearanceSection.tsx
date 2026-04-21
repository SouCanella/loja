"use client";

import { ConfigFormSection } from "@/components/painel/ConfigFormSection";
import { FieldTipBeside } from "@/components/painel/FieldTip";
import { HexColorInput } from "@/components/painel/HexColorInput";
import { ImageUploadButton } from "@/components/painel/ImageUploadButton";

type Props = {
  logoImageUrl: string;
  onLogoImageUrlChange: (v: string) => void;
  tagline: string;
  onTaglineChange: (v: string) => void;
  backgroundImageUrl: string;
  onBackgroundImageUrlChange: (v: string) => void;
  bgOverlayPercent: number;
  onBgOverlayPercentChange: (v: number) => void;
  primaryColor: string;
  onPrimaryColorChange: (v: string) => void;
  accentColor: string;
  onAccentColorChange: (v: string) => void;
};

export function ConfigAppearanceSection({
  logoImageUrl,
  onLogoImageUrlChange,
  tagline,
  onTaglineChange,
  backgroundImageUrl,
  onBackgroundImageUrlChange,
  bgOverlayPercent,
  onBgOverlayPercentChange,
  primaryColor,
  onPrimaryColorChange,
  accentColor,
  onAccentColorChange,
}: Props) {
  return (
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
              onChange={(e) => onLogoImageUrlChange(e.target.value)}
              placeholder="https://exemplo.com/logo.png"
            />
            <ImageUploadButton purpose="vitrine_logo" onUploaded={(url) => onLogoImageUrlChange(url)} label="Enviar ficheiro" />
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
            onChange={(e) => onTaglineChange(e.target.value)}
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
              onChange={(e) => onBackgroundImageUrlChange(e.target.value)}
              placeholder="https://exemplo.com/fundo.jpg"
            />
            <ImageUploadButton purpose="vitrine_hero" onUploaded={(url) => onBackgroundImageUrlChange(url)} label="Enviar ficheiro" />
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
              onChange={(e) => onBgOverlayPercentChange(Number(e.target.value))}
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
              onChange={onPrimaryColorChange}
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
              onChange={onAccentColorChange}
              placeholder="#f59e0b"
              aria-label="Cor de destaque (selector e hexadecimal)"
            />
          </div>
        </div>
      </div>
    </ConfigFormSection>
  );
}
