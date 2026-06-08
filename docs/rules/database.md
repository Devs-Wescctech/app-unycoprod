# Regras de Banco de Dados

## Regra geral
- Nunca executar DROP TABLE, DROP COLUMN ou DELETE sem aprovação explícita
- Nunca truncar tabelas em produção
- Alterações destrutivas exigem confirmação antes de qualquer código ser escrito

## Tabelas existentes — não alterar estrutura sem aprovação
- `system_config` — configurações do sistema (plans_enabled, whatsapp_config, etc.)
- `season_config` — períodos de alta temporada
- `category_rates` — tarifas por categoria de hotel (Silver, Gold, Diamante)
- `payments` — registros de pagamentos Vindi
- `users` / `plans` / `subscriptions` — dados de CRM

## Migrations
- Toda migration deve usar `IF NOT EXISTS` ou `ON CONFLICT DO NOTHING` para ser idempotente
- O servidor executa `initializeDatabase()` no boot — qualquer nova tabela deve ser adicionada lá
- Schema completo de referência: `scripts/db-schema.sql`

## system_config
- Chave `plans_enabled`: booleano, padrão `true`
- Chave `whatsapp_config`: JSON com `api_url` e `api_token`
- Novas chaves devem seguir o padrão snake_case

## Conexão
- Banco acessado via `import { query } from './db.js'`
- Usar sempre queries parametrizadas ($1, $2...) — nunca concatenar strings SQL
- Em produção: PostgreSQL externo via `DATABASE_URL`

## Colunas críticas na tabela payments
- `payment_method`: armazena o código do método (`pix_unyco`, `cartao_unyco`)
- `vindi_bill_id`, `vindi_charge_id`: IDs da Vindi — não renomear
- `status`: valores válidos: `paid`, `pending`, `canceled`
