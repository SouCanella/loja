import { cache } from "react";

import { fetchStorePublic } from "@/lib/vitrine/server-fetch";

/** Uma leitura por pedido quando layout + página pedem a mesma loja. */
export const getStorePublicCached = cache((slug: string) => fetchStorePublic(slug));
