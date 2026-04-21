/** Valores alinhados a `catalog-hero` (`socialIconLabel` usa `icon.includes(...)`). */
export const SOCIAL_ICON_PRESETS: { value: string; label: string }[] = [
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "tiktok", label: "TikTok" },
  { value: "youtube", label: "YouTube" },
  { value: "link", label: "Outro / site" },
];

export const DELIVERY_CHOICES: { id: string; title: string }[] = [
  { id: "retirada", title: "Retirar na loja" },
  { id: "loja_entrega", title: "Entrega pela loja" },
  { id: "uber", title: "Uber Entregas" },
  { id: "nove", title: "99 Entregas" },
];

export const PAYMENT_DEFAULTS: { id: string; label: string }[] = [
  { id: "pix", label: "PIX (chave ou QR enviados após confirmação)" },
  { id: "entrega_dinheiro", label: "Dinheiro na entrega ou na retirada" },
  { id: "entrega_cartao", label: "Cartão de crédito/débito na entrega" },
  { id: "entrega_pix", label: "PIX na entrega (na hora)" },
];
