/**
 * Rotas principais do menu lateral (PainelShell) — headings esperados no `<h1>` ou título sticky.
 * Manter alinhado a `frontend/components/painel/PainelShell.tsx` (exclui entradas `disabled`).
 */
export const PAINEL_SMOKE_ROUTES: { path: string; heading: RegExp }[] = [
  { path: "/painel", heading: /^Dashboard$/ },
  { path: "/painel/configuracao", heading: /^Configuração da loja$/ },
  { path: "/painel/catalogo", heading: /^Produtos & catálogo$/ },
  { path: "/painel/categorias", heading: /^Categorias$/ },
  { path: "/painel/pedidos", heading: /^Pedidos$/ },
  { path: "/painel/notificacoes", heading: /^Notificações$/ },
  { path: "/painel/clientes", heading: /^Clientes$/ },
  { path: "/painel/insumos", heading: /^Insumos$/ },
  { path: "/painel/receitas", heading: /^Receitas$/ },
  { path: "/painel/producao", heading: /^Produção$/ },
  { path: "/painel/precificacao", heading: /^Precificação$/ },
  { path: "/painel/financeiro", heading: /^Financeiro$/ },
  { path: "/painel/relatorio", heading: /^Relatório financeiro/ },
  { path: "/painel/relatorio-estoque", heading: /^Relatório de stock \(insumos\)$/ },
  { path: "/painel/analytics-vitrine", heading: /^Analytics da vitrine$/ },
  { path: "/painel/conta", heading: /^Perfil e segurança$/ },
];
