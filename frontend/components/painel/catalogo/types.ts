export type CatalogoProduct = {
  id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: string;
  image_url: string | null;
  active: boolean;
  catalog_spotlight: string | null;
  catalog_sale_mode: string;
  /** IP-14 — omissão tratada como true (produtos antigos) */
  track_inventory?: boolean;
};

export type CatalogoCategory = { id: string; name: string; slug: string };
