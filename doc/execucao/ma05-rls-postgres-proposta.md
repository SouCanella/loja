# Proposta: Row Level Security (RLS) no Postgres (MA-05)

**Estado:** desenho / avaliação — **não aplicado** no repositório.

## Objectivo

Reforço opcional de isolamento **por `store_id`** mesmo em caso de bug na camada de aplicação (query sem filtro de loja).

## Custos operacionais

- Políticas por tabela multi-tenant; manutenção em cada migração que toque em esquema.
- Sessão DB deve definir `app.current_store_id` (ou equivalente) por pedido — exige integração no middleware de base de dados / dependency injection.
- Testes de integração com Postgres real (RLS não replica bem em SQLite se algum dia se usar).

## Esboço de política (conceito)

```sql
-- Exemplo ilustrativo — não executar sem revisão e testes.
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY store_isolation_orders ON orders
  USING (store_id = current_setting('app.current_store_id', true)::uuid);
```

Todas as tabelas com `store_id` candidatas: `orders`, `products`, `inventory_items`, etc.

## Próximos passos se for aprovado

1. Prova de conceito numa única tabela em ambiente de desenvolvimento.
2. Benchmark de overhead em listagens pesadas.
3. Alinhar com [test_ma01_store_isolation.py](../../backend/tests/test_ma01_store_isolation.py) — os testes devem continuar a passar com RLS activo e `SET` correcto.
