# O que Nunca Alterar sem Aprovação Explícita

## Arquivos críticos de sistema
- `server/db.js` — conexão com banco de dados
- `server/index.js` linhas 1–100 — setup do servidor, imports, middlewares
- `server/index.js` função `initializeDatabase()` — sem aprovação para alterar tabelas
- `vite.config.js` — configuração de build e proxy
- `package.json` — dependências (instalar nova lib requer aviso prévio)

## Autenticação e sessão
- Sistema de login do CRM (`/crm/login`) — lógica de autenticação em localStorage
- Sistema de sessão da LP (`lp_token`, `lpSessions`, `parseLpToken`)
- Perfis de acesso: Administrador, Gerente, Operador, Visualizador

## Fluxo de pagamento
- Códigos de método Vindi: `pix_unyco` e `cartao_unyco` — só alterar com aprovação
- ID do produto Vindi: `1980987`
- Lógica de polling PIX

## Infraestrutura de produção
- `Dockerfile` e `docker-compose.yml`
- `.github/workflows/deploy.yml` (CI/CD)
- `scripts/db-schema.sql`
- `.env.example`

## Integrações externas
- URLs base das APIs (Coobmais, TOTVS, Vindi) — nunca alterar hardcoded
- Lógica de `ensureCoobToken()` — auto-login Coobmais
- Tratamento de erros TOTVS (EXISTCLI, CGC, Loja Invalido)

## Configurações do sistema
- Valor padrão de `plans_enabled`
- Lógica do `ProtectedRoute` com `requirePlans`

## Rotas da aplicação
- Estrutura de rotas em `App.jsx` — não reorganizar sem solicitação
- Prefixo `/crm/` para rotas do CRM
- Função `createPageUrl()` em `src/utils/index.ts`

## Landing Pages estáticas
- Arquivos em `public/lp/` (index.html, checkout.html, home.html)
- Paths de assets LP: `/lp/assets/img/` e `/lp/assets/css/`
