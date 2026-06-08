# Regras de Integrações Externas

## Vindi (Pagamentos)
- Ambiente: **produção** (`app.vindi.com.br`) — nunca trocar para sandbox sem aviso
- Autenticação: Basic Auth com `VINDI_API_KEY` (sem senha)
- Códigos de método de pagamento: `pix_unyco` e `cartao_unyco` — não alterar
- Produto fixo: ID `1980987` ("PROJETO UNYCO"), fallback: `HOSP_UNYCO`
- Extração do QR Code: verificar os três códigos (`pix`, `pix_unyco`, `pix_bank_slip`)
- Polling de status PIX: a cada 5 segundos, timeout máximo configurado em `POLL_MAX_MS`

## Coobmais
- Base URL: `https://apiprod.coobmais.com.br/unico/api`
- Autenticação: AccessKey + password → JWT gerado pelo backend (`ensureCoobToken()`)
- Token cacheado com refresh automático 5 minutos antes do `exp`
- Nunca hardcodar o token JWT — sempre usar o fluxo de auto-login
- Configs editáveis via Central de APIs, persistidas em `server/api-config.json`

## TOTVS
- Autenticação via `TOTVS_API_TOKEN` (header)
- Erros com tratamento especial: `EXISTCLI` (já existe), `CGC` (CPF inválido), `Loja Invalido`
- Erros permanentes (CPF inválido) não são retentados
- Erros genéricos são retentados após 1 hora
- Campo `A1_NOME`: enviar nome completo do usuário
- Sincronização: rastreia `syncedUsers`, `existingUsers`, `errorUsers`

## ViaCEP
- Usado apenas para autopreenchimento de endereço
- Endpoint público, sem autenticação

## WESCCTECH (WhatsApp)
- URL e token configuráveis via Central de APIs ou UI de Automações
- Persistido em `system_config` (chave: `whatsapp_config`)
- Eventos que disparam fluxo: `booking_confirmed`, `booking_cancelled`, `registration_completed`

## Central de APIs
- Tokens e URLs de todas as APIs são editáveis via `/crm/CentralAPIs` sem restart
- Configs persistidas em `server/api-config.json` (TOTVS, Coobmais, Vindi)
- Validação HTTPS obrigatória para URLs externas
- Tokens/credenciais sempre mascarados no response da API
