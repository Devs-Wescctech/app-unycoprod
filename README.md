# UNYCO CRM

Sistema CRM (Customer Relationship Management) para gestão de cadastros, planos e sincronização com TOTVS, com módulo de Landing Pages para reservas de hospedagem integradas a Coobmais e Vindi.

---

## Sumário

- [Visão Geral](#visão-geral)
- [Stack Técnica](#stack-técnica)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Estrutura de Rotas](#estrutura-de-rotas)
- [Módulos Principais](#módulos-principais)
- [Integrações Externas](#integrações-externas)
- [Comandos](#comandos)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Deploy](#deploy)

---

## Visão Geral

O UNYCO CRM gerencia registros de membros, planos de assinatura, pagamentos e reservas de hospedagem. Sincroniza dados com o ERP TOTVS, processa pagamentos via Vindi (cartão e PIX) e oferece automações de mensageria via WhatsApp. Inclui módulo de Landing Pages (LP) para captação e reservas pelos próprios membros.

---

## Stack Técnica

### Frontend
- **React 18** com **Vite**
- **Tailwind CSS** + **Radix UI** (componentes inspirados em shadcn/ui)
- **React Router DOM**
- **TanStack React Query** (data fetching/cache)
- **React Hook Form** + **Zod** (formulários e validação)
- **Recharts** (gráficos)
- **Sonner** (toasts)
- **xlsx**, **jspdf**, **html2canvas** (exportação CSV/Excel/PDF)
- Bootstrap 5.3.6, FontAwesome 5.12, Flatpickr (Landing Pages estáticas)

### Backend
- **Node.js** + **Express**
- **PostgreSQL** (driver `pg`, `Pool`)
- Serviço de sincronização independente com cronômetro e persistência de logs

---

## Estrutura do Projeto

```
.
├── src/                          # Frontend React
│   ├── contexts/                 # Auth, Config, etc.
│   ├── services/                 # Camada de chamadas à API
│   ├── hooks/                    # Hooks customizados (React Query)
│   ├── components/               # Componentes UI reutilizáveis
│   ├── pages/                    # Páginas do CRM
│   │   └── lp/                   # Landing Pages (LP) em React
│   └── utils/                    # Utilitários
├── server/                       # Backend Express
│   ├── index.js                  # Servidor principal + rotas API
│   ├── db.js                     # Pool PostgreSQL
│   ├── sync-data.json            # Estado/logs do serviço de sync
│   └── api-config.json           # Overrides de URL/token de APIs externas
├── public/lp/                    # Landing Pages estáticas (HTML/Bootstrap)
├── scripts/                      # SQL e guia de deploy
└── dist/                         # Build de produção (gerado)
```

---

## Estrutura de Rotas

| Rota | Descrição |
|------|-----------|
| `/` | Landing Page React (`LPHome.jsx`) — busca de hotéis e reservas |
| `/home` | Alias para LP Home |
| `/lp/index.html` | Página estática de login/cadastro LP |
| `/lp/checkout.html` | Página estática de checkout LP |
| `/crm/login` | Login do CRM |
| `/crm` | Dashboard CRM (requer autenticação) |
| `/crm/Cadastros`, `/crm/Planos`, `/crm/Sync`, etc. | Páginas internas do CRM |

- `createPageUrl()` em `src/utils/index.ts` gera links com prefixo `/crm/`.
- **SPA fallback (produção):** todas as rotas GET exceto `/api/*` e `/lp/*` servem `dist/index.html`.

---

## Módulos Principais

### CRM
- **Páginas:** Login, Dashboard, Cadastros, Planos, Pagamentos, Reservas & Receita, Sincronização, Pesquisa TOTVS, Usuários, Automações WhatsApp, Central de APIs.
- **Layout:** Header + Sidebar responsivos.
- **Funcionalidades comuns:** exportação (CSV/Excel/PDF), paginação, busca, filtros e filtro de período por calendário.
- **Dashboards:** mapas interativos do Brasil (assinantes/receita por estado), gráficos de pizza/barra, filtros avançados.
- **Mapa de Reservas:** dashboard "Reservas & Receita" com bolhas por estado, tooltip e modal detalhado.
- **Autenticação:** perfis Administrador, Gerente, Operador, Visualizador. Credenciais armazenadas em `localStorage`.

### Automação WhatsApp
- Construtor visual de fluxos (`VisualFlowBuilder`) tipo chatbot, nodes Trigger → Delay → Message.
- Teste de envio com progresso em tempo real e logs.
- `triggerWhatsAppFlow` chamado automaticamente em: `booking_confirmed`, `booking_cancelled`, `registration_completed`.
- Token e URL da API WESCCTECH configuráveis pela UI; persistidos em `system_config` (key `whatsapp_config`).

### Central de APIs
- Página `src/pages/CentralAPIs.jsx` para monitoramento de todas as APIs externas (TOTVS, Coobmais, Vindi, WhatsApp, ViaCEP).
- Cards de status (online/offline/latência), lista de endpoints, teste individual, auto-refresh, edição de tokens/URLs em runtime.
- Tokens/URLs persistidos em `server/api-config.json` (TOTVS/Coobmais/Vindi) e em `system_config` no DB (WhatsApp).
- Validação HTTPS obrigatória, allowlist de hosts e mascaramento de tokens nas respostas.

### Módulo de Landing Pages (LP)
Componentes React principais: `LPHome`, `LPHeader`, `LPFooter`, `SearchForm`, `HotelCard`, `HotelDetailModal`, `BookingFlow`, `PaymentFlow`, `MyBookings`.

- **Fluxo de reserva:** 4 etapas (Apartamento → Revisão → Pagamento → Confirmação) integrando Coobmais e Vindi.
- **Minhas Reservas:** listagem, filtros e cancelamento via API Coobmais.
- **Integração Vindi (produção `app.vindi.com.br`):** criação de customer, payment_profile e bill, normalização de status. Produto fixo via `VINDI_PRODUCT_ID` (default `1980987` — "PROJETO UNYCO").
- **PIX no PaymentFlow LP:** tela inicial `choose` (Pix vs Cartão); Pix gera bill direto, exibe QR Code (imagem) + Pix Copia e Cola, com polling automático a cada 5s em `/api/vindi/bill/:id`.

---

## Integrações Externas

| Sistema | Função |
|---------|--------|
| **PostgreSQL** | Banco relacional principal |
| **TOTVS** | ERP — sincronização de clientes |
| **ViaCEP** | Autopreenchimento de endereços |
| **Coobmais** | Hotéis, reservas, pagamentos e dados de associados. Auto-login via `AccessKey + password` (JWT cacheado pelo backend, refresh automático 5min antes do `exp`) |
| **Vindi** | Pagamentos (cartão de crédito e PIX) |
| **WESCCTECH** | Automação e envio de mensagens WhatsApp |

### Sincronização TOTVS
Rastreia 3 estados por usuário: `syncedUsers`, `existingUsers`, `errorUsers`. Erros TOTVS traduzidos para mensagens amigáveis (EXISTCLI, CGC, etc). Quando o módulo de Planos está desativado, sincroniza todos os usuários com CPF (sem filtro de assinatura). Erros permanentes (CPF inválido) não são retentados; erros genéricos são retentados após 1h.

### Tarifas por Categoria
O endpoint `/api/lp/hotels` busca a categoria de cada hotel via InfoHotels (cache de 30min), aplica a tarifa configurada (alta/baixa temporada) e devolve preços já ajustados. Categorias: **Silver**, **Gold**, **Diamante** (valor único, sem distinção de temporada).

### Tratamento de Erros
Tradução automática de erros técnicos para mensagens amigáveis em PT-BR. Erros TOTVS com `Erro Integracao/ExecAutoTabela` são processados primeiro (EXISTCLI, dados incompletos, CGC inválido). Códigos HTTP (401/403/502/503/504) usam word boundary para evitar falsos positivos.

---

## Comandos

```bash
npm install          # Instalar dependências
npm run dev          # Servidor de desenvolvimento (porta 5000)
npm run build        # Build de produção
npm run preview      # Preview do build

# Backend Node (rota raiz e APIs)
node server/index.js
```

---

## Banco de Dados

- **Auto-init:** o servidor executa `initializeDatabase()` antes de aceitar tráfego, criando tabelas `system_config`, `season_config`, `category_rates` e demais com `ON CONFLICT DO NOTHING` (idempotente).
- **Schema completo:** ver `scripts/db-schema.sql`.

### Configurações principais (tabela `system_config`)
- `plans_enabled` (default `true`) — quando `false`, esconde menu Planos, colunas de plano em Cadastros, redireciona LP register para `/`, e Dashboard exibe visão alternativa focada em cadastros.

---

## Variáveis de Ambiente

Veja `.env.example` para a lista completa. Principais:

| Variável | Descrição |
|----------|-----------|
| `DATABASE_URL` | Connection string PostgreSQL |
| `DB_SSL` | `true`/`false` para SSL no DB |
| `TOTVS_API_TOKEN` | Token da API TOTVS |
| `VINDI_API_KEY` | API Key da Vindi |
| `VINDI_PRODUCT_ID` | ID do produto Vindi (default `1980987`) |
| `COOBMAIS_BASE_URL` | URL base Coobmais |
| `COOBMAIS_AUTH_URL` | URL de autenticação Coobmais |
| `COOBMAIS_ACCESS_KEY` | Access Key Coobmais |
| `COOBMAIS_PASSWORD` | Senha Coobmais |
| `WHATSAPP_API_URL` | URL da API WESCCTECH WhatsApp |
| `WHATSAPP_API_TOKEN` | Token da API WhatsApp |

---

## Deploy

### Docker
- **Dockerfile:** build multi-stage Node.js 20 Alpine — `npm ci`, `npm run build`, executa `node server/index.js`.
- **docker-compose.yml:** imagem `ghcr.io/devs-wescctech/app-unycoprod:latest`, porta `5100:5000`, healthcheck via `/api/health`.

### CI/CD
- **GitHub Actions** em `.github/workflows/deploy.yml` — builda e publica imagem Docker no GHCR a cada push na `main`.

### Infraestrutura de Produção
- **Servidor:** `appunyco.wescctech.com.br` — container Docker em `/var/www/html/app-unycoprod`.
- **Banco:** PostgreSQL no host (fora do container), acessível em `172.17.0.1:5432`, database `unycoprod`.
- **Secrets:** ficam em `/var/www/html/app-unycoprod/.env` (não versionado, `chmod 600`), carregado via `env_file:` no compose.
- **Guia completo:** `scripts/deploy-guide.md`.

### Atualização em produção
```bash
cd /var/www/html/app-unycoprod
sudo docker compose pull && sudo docker compose up -d
```

### Endpoints de Health
- `GET /api/health` — retorna `{ status: "ok", timestamp }` ou 503 se DB offline.

---

## Licença

Proprietário — UNYCO / WESCCTECH.
