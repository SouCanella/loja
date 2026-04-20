export type DeliveryOptionPublic = {
  id: string;
  title: string;
  hint: string;
};

export type PaymentMethodPublic = {
  id: string;
  label: string;
};

export type StorePublic = {
  name: string;
  slug: string;
  tagline: string | null;
  logo_emoji: string;
  whatsapp: string | null;
  social_networks: { label: string; url: string; icon: string }[];
  /** Hex (#rrggbb) — base da identidade (secções suaves). */
  primary_color?: string | null;
  /** Hex (#rrggbb) — realces, links, selecções (ex-cor de destaque). */
  accent_color?: string | null;
  /** Imagem de fundo (https) — textura ou foto suave atrás do conteúdo. */
  hero_image_url?: string | null;
  /** Logótipo na área do hero (https). Se vazio, usa `logo_emoji`. */
  logo_image_url?: string | null;
  /** 15–97: opacidade do véu sobre o fundo (maior = mais suave / legível). */
  background_overlay_percent?: number;
  catalog_layout_default?: string;
  order_greeting?: string | null;
  hide_unavailable_products?: boolean;
  delivery_options?: DeliveryOptionPublic[];
  payment_methods?: PaymentMethodPublic[];
};

export type CategoryPublic = {
  id: string;
  name: string;
  slug: string;
};

export type ProductPublic = {
  id: string;
  name: string;
  description: string | null;
  image_url?: string | null;
  price: string;
  category_id: string | null;
  category_slug: string | null;
  category_name: string | null;
  catalog_spotlight?: string | null;
  catalog_sale_mode?: string;
};
