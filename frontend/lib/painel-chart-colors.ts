/**
 * Paleta dos gráficos do painel — alinhada à marca (primário #8A05BE, secundário #FFDE21).
 * Tons suaves, sem saturação excessiva em áreas grandes.
 */
export const PAINEL_CHART = {
  primary: "#8A05BE",
  primaryDeep: "#6D28D9",
  primarySoft: "#B565D8",
  /** Média móvel / linhas de referência — roxo acinzentado, legível sobre fundo claro */
  line: "#6B5575",
  /** Secundário brand — uso pontual (ex.: estado final positivo) */
  secondary: "#FFDE21",
  /** Variação mais suave para barras/áreas grandes */
  secondarySoft: "#D4BC3A",
  grid: "#e7e5e4",
} as const;

/** Sequência para gráficos de sectores / múltiplas séries (roxo + toques de ouro-acastanhado) */
export const PAINEL_CHART_SEQUENCE = [
  "#8A05BE",
  "#9333EA",
  "#A855D7",
  "#C084FC",
  "#B8950C",
  "#D4BC3A",
  "#6D28D9",
] as const;

/** Estados de pedido — progressão em roxos coerentes; extremos neutros */
export const PAINEL_ORDER_STATUS_COLORS: Record<string, string> = {
  aguardando_confirmacao: "#D8B4E8",
  confirmado: "#C084FC",
  em_producao: "#A855D7",
  pronto: "#9333EA",
  saiu_entrega: "#8A05BE",
  /** Concluído — acento da cor secundária (mais contida que o amarelo puro em barra larga) */
  entregue: "#D4BC3A",
  cancelado: "#A8A29E",
  rascunho: "#D6D3D1",
};
