export type StorePublic = {
  name: string;
  slug: string;
  tagline: string | null;
  logo_emoji: string;
  whatsapp: string | null;
  social_networks: { label: string; url: string; icon: string }[];
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
};
