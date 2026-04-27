# UNYCO CRM

## Overview
O UNYCO CRM é um sistema de gerenciamento de relacionamento com o cliente projetado para otimizar as operações de negócios, melhorar a interação com o cliente e fornecer uma plataforma centralizada para gerenciamento de dados. Ele gerencia registros de usuários, planos de assinatura e sincroniza com o sistema TOTVS, garantindo a consistência dos dados. O projeto busca ser uma solução robusta para o gerenciamento de assinaturas e clientes.

## User Preferences
Eu prefiro um estilo de comunicação direta e concisa. Gosto de desenvolvimento iterativo e que a solução seja simples e eficiente. Por favor, sempre me informe antes de fazer qualquer mudança estrutural ou importante no código.

## System Architecture

### Frontend
- **Tecnologias:** React 18 (Vite), Tailwind CSS, Radix UI, React Router DOM, TanStack React Query, React Hook Form + Zod, Recharts, Sonner.
- **UI/UX:** Componentes modulares (inspirados em shadcn/ui), layout responsivo com Header e Sidebar.
- **Páginas Principais:** Login, Dashboard, Cadastros, Planos, Pagamentos, Reservas & Receita, Sincronização, Pesquisa TOTVS, Usuários, Automações WhatsApp, Central de APIs.
- **Funcionalidades Comuns:** Exportação de dados (CSV, Excel, PDF), paginação, busca e filtragem, filtro de período personalizado com calendário.
- **Dashboards:** Incluem mapas interativos do Brasil com dados de assinantes e receita por estado, gráficos de pizza e barra, e filtros avançados.
- **Mapa de Reservas:** Dashboard Reservas & Receita inclui mapa interativo com bolhas por estado, tooltip inteligente e modal detalhado.
- **Automação WhatsApp:** Gerenciamento de fluxos com construtor visual (VisualFlowBuilder) tipo chatbot, nodes visuais (Trigger → Delay → Message), teste de envio com progresso em tempo real, e logs. `triggerWhatsAppFlow` é chamado automaticamente nos eventos: `booking_confirmed` (ao salvar reserva), `booking_cancelled` (ao cancelar reserva), `registration_completed` (ao finalizar cadastro LP). Token e URL da API WESCCTECH configuráveis via UI (botão "Configurar API" na página de Automações), persistidos em `system_config` (key: `whatsapp_config`).

### Backend
- **Tecnologias:** Node.js/Express.
- **Banco de Dados:** PostgreSQL (local via Neon-backed Replit) com `pg Pool`.
- **API:** Endpoints RESTful para Planos, Usuários, Assinaturas e dados de sincronização.
- **Autenticação:** Sistema de login com gerenciamento de perfis (Administrador, Gerente, Operador, Visualizador), credenciais armazenadas em `localStorage`.
- **Serviço de Sincronização:** Serviço Node.js independente para sincronização com TOTVS, com cronômetro, intervalos configuráveis e persistência de logs em `server/sync-data.json`. Inclui tradução de erros TOTVS para mensagens amigáveis e health check.
- **Landing Pages:** Três landing pages estáticas (index, checkout, home) convertidas de PHP, com lógica de autenticação e integração com APIs externas (Coobmais).

### Estrutura do Projeto
- `src/`: Contém contextos, serviços, hooks, componentes, páginas e utilitários do frontend.
- `server/`: Contém o servidor Express, camada de acesso ao DB e dados de sincronização do backend.

### Estrutura de Rotas
- **`/`** → Landing Page (LPHome.jsx — busca de hotéis, reservas)
- **`/home`** → Alias para LP Home
- **`/lp/index.html`** → Página estática de login/cadastro LP
- **`/lp/checkout.html`** → Página estática de checkout LP
- **`/crm/login`** → Login do CRM
- **`/crm`** → Dashboard CRM (requer autenticação)
- **`/crm/Cadastros`**, **`/crm/Planos`**, **`/crm/Sync`**, etc. → Páginas CRM
- **`createPageUrl()`** em `src/utils/index.ts` gera links com prefixo `/crm/`
- **SPA fallback (produção):** Todas as rotas GET exceto `/api/*` e `/lp/*` servem `dist/index.html`

### Integração
- **Desenvolvimento:** Proxy Vite para rotear `/api/*` para o servidor Node.js local.
- **Produção:** Servidor Node.js serve frontend e API.
- **TOTVS & Coobmais:** Servidores proxy Node.js gerenciam autenticação, requisições e serviços de sincronização.
- **Sincronização TOTVS:** Rastreia 3 estados por usuário: syncedUsers, existingUsers, errorUsers. Erros TOTVS traduzidos (EXISTCLI, CGC). Quando planos desativados, sincroniza todos os usuários com CPF (sem filtro de assinatura). Página Sync.jsx adapta UI conforme plansEnabled. Erros permanentes (CPF inválido) não são retentados; erros genéricos são retentados após 1 hora.

### Central de APIs
- **Página:** `src/pages/CentralAPIs.jsx` para monitoramento completo de APIs externas (TOTVS, Coobmais, Vindi, WhatsApp, ViaCEP).
- **Funcionalidades:** Cards de status por API (online, offline, latência), lista de endpoints, teste individual, auto-refresh, edição de tokens/URLs.
- **Configs Dinâmicas:** Tokens e URLs de todas as APIs são configuráveis via Central de APIs e aplicados em tempo real (sem restart). Persistidos em `server/api-config.json` (TOTVS, Coobmais, Vindi) e `system_config` DB (WhatsApp). Health check usa configs dinâmicas. Validação HTTPS obrigatória, allowlist de APIs, tokens/credenciais mascarados no response. **Coobmais:** UI gerencia AccessKey + password + URL de auth; token JWT exibido em box read-only com botão "Regenerar" e contagem de expiração.

### Módulo Landing Pages (LP)
- **Componentes React LP:** `LPHome`, `LPHeader`, `LPFooter`, `SearchForm`, `HotelCard`, `HotelDetailModal`, `BookingFlow`, `PaymentFlow`, `MyBookings`.
- **Fluxo de Reserva:** 4 etapas (Apartamento, Revisão, Confirmação, Pagamento) integrando com Coobmais e Vindi.
- **Minhas Reservas:** Gerenciamento de reservas com listagem, filtros e cancelamento via API Coobmais.
- **Integração Vindi:** Ambiente **produção** (`app.vindi.com.br`), criação de customer, payment_profile e bill, normalização de status de pagamento. Produto fixo via `VINDI_PRODUCT_ID` (default `1980987` — "PROJETO UNYCO"), com fallback para `HOSP_UNYCO`.
- **PIX no PaymentFlow LP:** PaymentFlow inicia em step `choose` (escolha entre Pix e Cartão). Pix dispara `create-bill` direto e exibe QR Code (imagem + Pix Copia e Cola), com polling automático a cada 5s em `/api/vindi/bill/:id` para detectar pagamento confirmado. Backend retorna `pix.qrcode_path` (imagem) e `pix.qrcode_original_path` (EMV) extraídos de `charge.last_transaction.gateway_response_fields`.

### Inicialização do Banco de Dados
- **Auto-init:** O servidor executa `initializeDatabase()` antes de aceitar tráfego, garantindo que as tabelas `system_config`, `season_config` e `category_rates` existam com valores padrão. Usa `ON CONFLICT DO NOTHING` para idempotência.
- **plans_enabled:** Valor padrão `true`. Quando `false`, esconde menu Planos, colunas de plano em Cadastros (grid e lista), e redireciona LP register para `/` em vez de checkout. Dashboard exibe visão alternativa focada em cadastros: stats (Total, Novos Mês, Estados Ativos, Crescimento), gráfico Novos x Acumulado por mês, Cadastros por Estado (pizza), Top Cidades (ranking), Mapa de Cadastros por Estado. Quando planos ativo, exibe visão de receita/assinantes.
- **Tarifas por Categoria:** O endpoint `/api/lp/hotels` busca a categoria de cada hotel via InfoHotels (com cache de 30min), aplica a tarifa configurada (alta/baixa temporada) e retorna os preços já ajustados nos cards. A API Coobmais retorna categoria como string ("Silver", "Gold", "Diamante"), o lookup usa `category_name` para match. **Diamante** tem valor único (sem distinção de temporada) — armazenado como mesmo valor em `low_season_rate` e `high_season_rate`, aplicado independente da época.
- **Rota Planos:** Protegida com `requirePlans` no `ProtectedRoute` — fail-closed (mostra loader durante carregamento da config).

### Tratamento de Erros
Sistema de tradução automática de erros técnicos para mensagens amigáveis em português. Erros TOTVS com "Erro Integracao/ExecAutoTabela" são processados primeiro (EXISTCLI/Loja Invalido → já existe, campos em branco → dados incompletos, CGC → CPF inválido). Códigos HTTP (401/403/502/503/504) usam word boundary (`\b`) para evitar falsos positivos. `syncUserToTotvs` envia `A1_NOME` com nome completo.

## External Dependencies

- **PostgreSQL:** Banco de dados relacional.
- **TOTVS API:** Sistema ERP para sincronização de dados de clientes.
- **ViaCEP API:** Para autopreenchimento de endereços.
- **Coobmais API:** Para busca de hotéis, reservas, pagamentos e dados de associados. Auto-login via `AccessKey + password` no endpoint `https://apiprod.coobmais.com.br/auth/api/Users/Authenticate` — JWT gerado/cacheado pelo backend (`ensureCoobToken()` em `server/index.js`) com refresh automático 5min antes do `exp`. Configs (`COOBMAIS_AUTH_URL`, `COOBMAIS_ACCESS_KEY`, `COOBMAIS_PASSWORD`) editáveis via Central de APIs ou env. Endpoints de gerenciamento: `GET /api/central/coobmais/token` (preview+exp), `POST /api/central/coobmais/refresh-token` (força regeneração).
- **Vindi API:** Para processamento de pagamentos (cartão de crédito e boleto).
- **WESCCTECH API:** Para automação e envio de mensagens WhatsApp.
- **Bibliotecas Frontend:** `xlsx` (SheetJS), `jspdf`, `html2canvas` para exportação de dados. Bootstrap 5.3.6, FontAwesome 5.12, Flatpickr para as Landing Pages.

## Deploy / Produção

### Docker
- **Dockerfile:** Build multi-stage Node.js 20 Alpine — `npm ci`, `npm run build`, serve via `node server/index.js`.
- **docker-compose.yml:** Segue padrão do servidor (`ghcr.io/devs-wescctech/app-unycoprod:latest`), porta externa `5100:5000`, healthcheck via `/api/health`.
- **CI/CD:** GitHub Actions em `.github/workflows/deploy.yml` — builda e publica imagem Docker no GHCR a cada push na `main`.

### Infraestrutura de Produção
- **Servidor:** `appunyco.wescctech.com.br` — container Docker em `/var/www/html/app-unycoprod`.
- **Banco:** PostgreSQL no host (fora do container), acessível via `172.17.0.1:5432`, database `unycoprod`.
- **Esquema DB:** `scripts/db-schema.sql` contém DDL completo. Servidor auto-inicializa tabelas via `initializeDatabase()`.
- **Guia completo:** `scripts/deploy-guide.md`.

### Variáveis de Ambiente (Produção)
- `NODE_ENV=production`, `PORT=5000` — definidos inline no `docker-compose.yml`.
- Demais secrets ficam em `/var/www/html/app-unycoprod/.env` (NÃO commitado, `chmod 600`), carregado via `env_file:` no compose. Veja `.env.example` para a lista completa: `DATABASE_URL`, `DB_SSL`, `TOTVS_API_TOKEN`, `VINDI_API_KEY`, `WHATSAPP_API_URL`, `WHATSAPP_API_TOKEN`, `COOBMAIS_BASE_URL`, `COOBMAIS_AUTH_URL`, `COOBMAIS_ACCESS_KEY`, `COOBMAIS_PASSWORD`.

### Endpoints Health
- `GET /api/health` — retorna `{ status: "ok", timestamp }` ou 503 se DB offline.

### Assets LP
- Caminhos de imagens/CSS nas Landing Pages usam paths absolutos (`/lp/assets/img/...`, `/lp/assets/css/...`) para funcionar tanto servidos na raiz `/` quanto em `/lp/`.