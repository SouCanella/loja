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
    <ConfigFormSection
      title="Aparência da vitrine"
      defaultOpen
      summaryTip="Aspecto da loja online: logótipo, textos, imagem de fundo e cores. Campos directos, sem editor visual complexo."
    >
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-slate-700" htmlFor="logo">
            <FieldTipBeside tip="URL https do logótipo (PNG ou SVG). Se estiver vazio, mostra-se o símbolo de reserva da loja.">
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
            <FieldTipBeside tip="Frase curta por baixo do nome (opcional), visível na vitrine.">
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
            <FieldTipBeside tip="Imagem de fundo em ecrã completo (URL https, JPG ou PNG). Vazio: fundo só com cor, sem imagem.">
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
            <FieldTipBeside tip="Intensidade do véu sobre a foto de fundo: mais alto = fundo mais suave e texto mais legível; mais baixo = imagem mais evidente. Só se aplica quando há imagem de fundo.">
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
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="pc">
              <FieldTipBeside tip="Cor principal da identidade (código hexadecimal). Pode usar o selector ou escrever o valor.">
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
              <FieldTipBeside tip="Cor de destaque para botões e realces (hexadecimal).">
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
