# Regras de Arquitetura e Padrões de Código

## Estrutura do projeto
- `src/` — frontend React (Vite)
- `server/` — backend Node.js/Express
- `public/lp/` — landing pages estáticas
- `scripts/` — utilitários e schema SQL
- `docs/rules/` — regras do projeto (este diretório)

## Frontend
- React 18 com Vite — não migrar para outro bundler
- Roteamento: React Router DOM v7
- Estado servidor: TanStack React Query (não usar Redux ou Zustand)
- Formulários: React Hook Form + Zod
- Gráficos: Recharts — não adicionar outra lib de charts
- Notificações: Sonner (toasts) — não usar alert() ou outras libs

## Backend
- Node.js com ES Modules (`"type": "module"`) — usar `import/export`
- Para pacotes CommonJS: usar `createRequire` (padrão já estabelecido)
- Express v5 — atenção a mudanças de API em relação ao v4
- Queries SQL: sempre parametrizadas via `query($1, $2...)`
- Nunca retornar stack traces ou detalhes internos em respostas de erro

## Padrões de API
- Respostas sempre com `{ ok: true/false, ... }`
- Erros com `{ ok: false, error: "mensagem amigável" }`
- Rotas CRM: `/api/*.php` (legado) e `/api/[recurso]`
- Rotas LP: `/api/lp/[recurso]`
- Rotas admin: `/api/admin/[recurso]`

## Componentes
- Componentes modulares — máximo ~300 linhas por arquivo
- Separar lógica em hooks customizados (`src/hooks/`)
- Props com nomes descritivos em português ou inglês (manter consistência do arquivo)

## Exportação de dados
- CSV, Excel (SheetJS/xlsx), PDF (jsPDF + html2canvas)
- Não adicionar outras libs de exportação

## Sincronização TOTVS
- Serviço independente em `server/index.js` (syncService)
- Logs persistidos em `server/sync-data.json`
- Nunca bloquear o event loop com sincronização — sempre assíncrono

## Segurança
- Secrets sempre via variáveis de ambiente — nunca hardcodar
- Tokens e credenciais sempre mascarados em respostas de API
- Validação HTTPS obrigatória para URLs de APIs externas configuradas via UI
