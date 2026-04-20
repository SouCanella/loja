# Ideias de produto — partilha da loja, cardápio para redes, estoque por produto

**Estado:** especificação para **promoção** a requisitos / migrações; ainda **não implementado** no código.  
**Relação:** entradas **IP-12 … IP-14** em [backlog.md](backlog.md); índice em [indice-documentacao-e-gaps.md](indice-documentacao-e-gaps.md).

---

## 1. Partilhar a loja (admin — e opcionalmente vitrine)

### 1.1 Objetivo

Permitir ao lojista **partilhar o link público da loja** com um gesto explícito, sem copiar manualmente o URL da barra de endereços.

### 1.2 Onde aparece

| Local | Acções sugeridas |
|-------|------------------|
| **Painel** (ex.: cabeçalho, configuração, dashboard) | «Partilhar loja» abre menu: **Copiar link**, **WhatsApp** (abre `wa.me` com texto + URL), **Partilhar…** (`navigator.share` quando existir). |
| **Vitrine** (opcional) | Botão discreto «Partilhar esta loja» no rodapé ou hero — mesmo padrão. |

### 1.3 Dados

- URL canónica: `{origin}/loja/{slug}` (alinhado a **DEC-19**).
- Texto pré-definido (editável futuro em tema): *«Vê o meu catálogo: …»*.

### 1.4 Técnico

- **Copiar:** `navigator.clipboard.writeText` com fallback.
- **WhatsApp Web/app:** `https://wa.me/?text=${encodeURIComponent(msg)}`.
- **Web Share API:** mobile; feature-detect.
- **QR Code:** opcional fase posterior (imagem PNG do link) para cartazes.

### 1.5 Privacidade

- Só o **link público**; sem dados de clientes.

---

## 2. Gerar cardápio para WhatsApp ou Instagram

### 2.1 Objetivo

Produzir um **cardápio derivado do catálogo** (nome, preços, secções por categoria, opcionalmente imagens) em formatos adequados a:

- **WhatsApp:** texto formatado simples ou imagem única longa (screenshot de HTML).
- **Instagram:** story/reel estático (proporção 9:16 ou 1:1), post quadrado — **imagem** gerada ou **PDF** para o utilizador fazer upload manual.

### 2.2 Onde dispara

| Origem | Comportamento |
|--------|----------------|
| **Painel** | Botão «Gerar cardápio» — escolher formato (WA texto / imagem IG story / PDF). |
| **Vitrine** (opcional) | Só leitura pública: «Partilhar cardápio» para o **visitante** promover a loja (menos comum; prioridade baixa). |

### 2.3 Conteúdo mínimo

- Nome da loja (tema), slug ou link curto.
- Lista de produtos **activos** com preço; agrupar por **categoria** se existir.
- Rodapé: «Encomendar: [link vitrine]» ou WhatsApp da loja (`vitrine_whatsapp`).

### 2.4 Implementação (candidatas)

1. **Texto WhatsApp:** template em servidor ou cliente (UTF-8, emojis opcionais por categoria).
2. **Imagem:** HTML oculto + `html-to-image` / Puppeteer no servidor se necessário alta fidelidade.
3. **PDF:** biblioteca no backend (ReportLab/weasyprint) ou `window.print` a partir de página dedicada `/loja/{slug}/cardapio` (print CSS).

### 2.5 Limitações e roadmap

- Instagram **não** permite API de publicação automática sem Meta Business para todos; o entregável é **ficheiro** para o lojista publicar manualmente.
- Branding (cores/logo) alinhado a [vitrine-configuracao-aparencia.md](vitrine-configuracao-aparencia.md).

---

## 3. Controlo de estoque por produto (CRUD)

### 3.1 Objetivo

No **CRUD de produtos**, o lojista indica se aquele produto deve **participar do controlo de stock** (baixas em pedido, alertas, relatórios de stock) ou **não** (ex.: serviços, encomendas feitas à medida sem stock físico, produtos apenas sob encomenda externa).

### 3.2 Comportamento desejado

| `track_inventory` (nome sugerido) | Comportamento |
|-------------------------------------|---------------|
| **Sim** (omissão) | Como hoje: ligado a `inventory_item`, movimentos, regras RN de pedido. |
| **Não** | Pedidos **não** disparam baixa de lote para esse item; UI de catálogo pode mostrar «Sob consulta» / sem quantidade; relatórios de stock **excluem** ou marcam «N/A». |

### 3.3 Modelo de dados actual (restrição)

Em `products`, **`inventory_item_id` é obrigatório** (FK para `inventory_items`). Para «sem controlo de stock» há alternativas:

| Abordagem | Prós | Contras |
|-----------|------|--------|
| **A)** Campo `track_inventory: bool` + mantém `inventory_item_id` mas ignora baixas | Migração pequena | Item de inventário «fantasma» pouco elegante |
| **B)** `inventory_item_id` **nullable** quando `track_inventory = false` | Modelo limpo | Migração maior; rever **todos** os fluxos que assumem FK obrigatória |
| **C)** Item sintético «sem stock» por loja | Poucas mudanças em FK | Conceito estranho para relatórios |

**Recomendação de produto:** **B** com validação: se `track_inventory`, então `inventory_item_id` obrigatório; senão, nulo. Documentar em **RN** e testes de integração em pedidos.

### 3.4 Decisão normativa

**DEC-23** registada em [decisoes-e-pendencias.md](decisoes-e-pendencias.md) — *«Produto pode existir sem movimentação de stock quando `track_inventory = false` e `inventory_item_id` nulo.»* Concretizar regras em código na PR que implementar **IP-14**.

### 3.5 Superfícies a alterar (quando implementar)

- Migração Alembic + `Product` schema + API PATCH/POST produto.
- Vitrine: checkout / disponibilidade — alinhar a `catalog_sale_mode` se já existir «sob encomenda».
- Serviços de pedido: `order_line_items`, alocação de stock — ignorar produtos sem track.
- Relatórios de stock: excluir ou etiquetar.

---

## 4. Priorização sugerida

1. **Partilhar loja** — baixo esforço, alto valor UX.  
2. **Cardápio WA/IG** — médio esforço; começar por **texto + PDF simples**.  
3. **`track_inventory`** — maior impacto em domínio; exige **DEC-23** + testes em pedidos.

---

## 5. Ligações

| Documento | Nota |
|-----------|------|
| [backlog.md](backlog.md) | IP-12, IP-13, IP-14 |
| [fase-03-1-paridade-mockup.md](../fases/fase-03-1-paridade-mockup.md) | Catálogo / painel |
| [regras-negocio.md](../normativos/regras-negocio.md) | Actualizar RN stock quando DEC-23 existir |

---

*Última revisão: 2026-04-20 — registo das três ideias.*
