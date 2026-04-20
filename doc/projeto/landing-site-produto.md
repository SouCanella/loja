# Site institucional e página inicial — especificação completa (copy + implementação)

**Produto:** plataforma SaaS de gestão de lojas caseiras (vitrine pública + painel).  
**Referência de mercado analisada:** [Stoqui](https://www.stoqui.com.br/) — estrutura de landing (hero, passos, funcionalidades, prova social, planos, FAQ); **não** copiar textos nem prometer integrações que o código ainda não suporta.

**Fase:** [Fase 3.2](../fases/fase-03-2-impressao-termica.md) — sub-fases **3.2-d / 3.2-e** (ver §8 desse ficheiro).

**Estado da implementação (repo):** a rota `frontend/app/page.tsx` é ainda um **stub** (“Loja — frontend” + links). Este documento é a **fonte para substituir** esse conteúdo.

---

## 1. Objetivos da página inicial

| Objetivo | Métrica sugerida |
|----------|------------------|
| Explicar o valor em &lt; 10 s | Bounce, tempo na primeira dobra |
| Converter para registo / demo | CTR “Criar loja” / “Experimentar” |
| Gerar confiança (sem overpromise) | Depoimentos só com autorização; números só reais |
| SEO para “loja online caseiros / catálogo WhatsApp” (ajustar keywords ao mercado-alvo) | Impressões orgânicas |

---

## 2. Princípios de copy (alinhamento ao produto real)

1. **Verdade técnica:** só mencionar **PDV nativo**, **IA 24h**, **gateway de pagamento X**, **app iOS/Android** quando estiverem no repositório ou documentados como lançados.
2. **Forças actuais** (ver [documento enterprise](../documento_enterprise.md), [fase-03-1](../fases/fase-03-1-paridade-mockup.md)): vitrine por slug, tema configurável, pedidos com máquina de estados **DEC-14**, painel com catálogo, receitas, produção, precificação, relatórios, **MA-03** media upload.
3. **Tom:** português claro (PT-PT ou PT-BR conforme mercado escolhido — placeholders abaixo em **PT genérico**).
4. **PRO / planos:** alinhar a [relatorios-definicoes-negocio.md](relatorios-definicoes-negocio.md) §5 e **BE-06** (monetização futura); na landing, “Em breve” ou omitir até haver billing.

---

## 3. Mapa do site (MVP marketing)

| Rota sugerida (Next.js App Router) | Conteúdo |
|-------------------------------------|----------|
| `/` | Landing principal (este documento) |
| `/login` | Já existe |
| `/registo` | Já existe |
| `/loja/[slug]` | Vitrine lojista (existente) |
| `/precos` ou âncora `#planos` | Opcional página dedicada ou secção na mesma página |
| `/termos`, `/privacidade` | Páginas legais (conteúdo jurídico externo ao âmbito técnico) |

---

## 4. Estrutura da página — secções e copy base

### 4.1 Barra de navegação (sticky opcional)

- Logo / nome do produto (definir marca: “Loja”, nome comercial final).
- Links: Funcionalidades (âncora), Como funciona, Preços (âncora), FAQ, **Entrar**, **Criar loja** (CTA primário).

---

### 4.2 Hero (primeira dobra)

**Título (H1):**

> Gestão e vitrine para a tua loja caseira — sem folhas de cálculo à mistura.

**Subtítulo:**

> Catálogo online, pedidos organizados, stock e receitas num só painel. Os teus clientes encomendam pela vitrine; tu geres tudo num só sítio.

**CTAs:**

- Primário: **Criar loja grátis** → `/registo`
- Secundário: **Ver demo** → `/loja/demo` ou slug de demonstração acordado
- Opcional: **Entrar** → `/login`

**Prova social (só se factual):**

> Já confiado por **X** lojas — *substituir X quando houver métrica real; senão omitir o bloco.*

**Micro-confiança (linha abaixo dos CTAs):**

> Sem cartão para experimentar · Configuração guiada · Dados por loja isolados (multi-tenant)

---

### 4.3 Faixa de números (opcional — *omitir se não houver dados auditáveis*)

Três a quatro métricas: lojas activas, pedidos processados, produtos, etc.  
*Alternativa honesta:* “Em desenvolvimento activo · Roadmap público em doc” com link para `doc/fases/`.

---

### 4.4 Como funciona — 3 passos

**Secção H2:** *Três passos para pôr a loja online*

1. **Cria a tua conta e a loja** — Nome, slug para o link público (`/loja/o-teu-slug`), e dados de acesso seguros.
2. **Configura produtos e aparência** — Preços, categorias, imagens e tema da vitrine (cores, logótipo, mensagem ao cliente).
3. **Partilha o link e gere pedidos** — Os pedidos entram no painel; acompanhas estados, produção e stock.

*Nota:* não prometer “IA gera descrição em 1 foto” sem feature equivalente.

---

### 4.5 Funcionalidades — grelha de cartões (6 cartões sugeridos)

| Título | Texto (copy) | Ligação ao produto |
|--------|----------------|---------------------|
| **Vitrine pública** | Loja mobile-first por slug; tema alinhado à tua marca. | `loja/[slug]` |
| **Pedidos com fluxo claro** | Estados do pedido (confirmar, produzir, entregar) adaptados ao teu ritmo. | DEC-14 |
| **Catálogo e categorias** | Produtos, imagens, destaques e disponibilidade. | RF-CA |
| **Stock e receitas** | Insumos, receitas, produção e sugestão de preço. | Fase 2–3 |
| **Relatórios** | Visão financeira e de margem; evolução prevista (painel tipo dashboard). | Relatórios + DEC-22 |
| **Conta e segurança** | Perfil, palavra-passe, sessão. | `/painel/conta` |

Evitar cartões “IA 24/7” ou “PDV com leitor” até existirem no produto.

---

### 4.6 Para quem é (segmentos)

**H2:** *Feito para quem produz e vende em pequena escala*

- Bolos, doces e salgados artesanais  
- Take-away e catering local  
- Artesanato e peças únicas  
- Pequenos produtores que usam WhatsApp mas precisam de **histórico e números**

---

### 4.7 Prova social — lojas exemplo / depoimentos

- **Grelha de lojas:** só com autorização; captura + nome + slug.  
- **Citações:** nome, função, 2–3 linhas; evitar claims médicos ou financeiros não verificáveis.

---

### 4.8 Planos e preços (quando existir billing)

Tabela inspirada em modelos de mercado, **adaptada**:

| Nível | Preço | Inclui (exemplo editorial) |
|-------|-------|----------------------------|
| **Grátis / Avaliação** | 0 € ou R$ 0 | Uma loja, funcionalidades núcleo; limites a definir em **BE-06** |
| **Pro** | A definir | Relatórios avançados, cupons — alinhado **DEC-22** e roadmap |

*Enquanto não houver API de billing:* secção “Preços em breve” ou lista de funcionalidades sem preço.

---

### 4.9 FAQ (8 perguntas sugeridas)

1. **Preciso de empresa (CNPJ) para começar?** — Resposta conforme mercado (muitos MVPs permitem PF no início).  
2. **Há aplicativo móvel?** — Resposta honesta: painel web responsivo; app nativo em roadmap (**BE-03**) se aplicável.  
3. **Como recebo pagamentos dos clientes?** — Descrever fluxo actual (ex.: WhatsApp, referência manual); integrações de gateway em roadmap se não existirem.  
4. **Os meus dados estão isolados de outras lojas?** — Sim, multi-tenant por `store_id` — ver **DEC-01**.  
5. **Posso usar o meu domínio?** — **DEC-19** — subdomínio/path primeiro; domínio próprio backlog/Fase 4.  
6. **Como cancelo?** — Política a definir com produto.  
7. **Onde vejo relatórios de vendas?** — Link para funcionalidade existente do painel.  
8. **Está conforme RGPD/LGPD?** — Encaminhar para política de privacidade e medidas descritas em docs de conformidade.

---

### 4.10 CTA final (rodapé da dobra)

**H2:** *Pronto para organizar a tua loja?*

- Botão **Criar loja grátis**  
- Texto auxiliar: *Sem compromisso inicial · Suporte [canal]*

---

### 4.11 Rodapé global

- Links: Termos, Privacidade, Contacto, Documentação (`doc/` ou site de docs se publicado).  
- Redes sociais (opcional).  
- Copyright © ano, entidade jurídica.

---

## 5. SEO e partilha social

| Campo | Conteúdo sugerido |
|-------|-------------------|
| `<title>` | «NomeMarca — Vitrine e gestão para lojas caseiras» |
| `meta name="description"` | 150–160 caracteres com benefício + palavra-chave. |
| `og:image` | 1200×630, marca + slogan (asset em `frontend/public/`). |
| `canonical` | URL definitiva do domínio de marketing |

---

## 6. Acessibilidade e performance

- Contraste WCAG AA nos textos sobre fundo.  
- Navegação por teclado nos CTAs.  
- `prefers-reduced-motion` para animações.  
- Imagens `next/image` com `alt` descritivo; **LCP** &lt; 2,5 s como alvo.

---

## 7. Implementação técnica (Next.js 14 App Router)

1. Substituir `frontend/app/page.tsx` por secções componentizadas: `components/marketing/Hero.tsx`, `FeaturesGrid.tsx`, `Steps.tsx`, `Faq.tsx`, etc.  
2. Manter **Server Component** onde não houver estado; animações leves em Client Components.  
3. Estilos: Tailwind; tokens alinhados ao resto do front (ou tema marketing separado para não colidir com `painel-*`).  
4. Variáveis de ambiente: `NEXT_PUBLIC_SITE_URL` para links absolutos e OG.

---

## 8. Checklist antes de publicar

- [ ] Revisão jurídica de Termos/Privacidade.  
- [ ] Números e depoimentos verificáveis.  
- [ ] Teste em mobile e desktop.  
- [ ] Lighthouse: performance, a11y, SEO ≥ limiar acordado.  
- [ ] Sem links quebrados para rotas inexistentes.

---

## 9. Ligações normativas

| Documento | Uso |
|-----------|-----|
| [fase-03-2-impressao-termica.md](../fases/fase-03-2-impressao-termica.md) | Marco 3.2 — impressão + esta landing |
| [indice-documentacao-e-gaps.md](indice-documentacao-e-gaps.md) | Estado global da documentação |
| [decisoes-e-pendencias.md](decisoes-e-pendencias.md) | DEC-14, 19, 22, billing |
| [relatorios-definicoes-negocio.md](relatorios-definicoes-negocio.md) | Definição PRO / relatórios |

---

*Última revisão: 2026-04-20 — especificação completa para implementação na Fase 3.2.*
