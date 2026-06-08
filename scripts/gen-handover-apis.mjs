import { jsPDF } from 'jspdf';
import fs from 'node:fs';
import path from 'node:path';

const COR_AZUL_ESCURO = '#2E6299';
const COR_AZUL_CLARO = '#4DA3FF';
const COR_TEXTO = '#1F2937';
const COR_CINZA = '#6B7280';
const COR_CINZA_CLARO = '#E5E7EB';
const COR_FUNDO_SUAVE = '#F3F6FB';
const COR_BRANCO = '#FFFFFF';
const COR_GET = '#16A34A';
const COR_POST = '#2563EB';
const COR_PUT = '#CA8A04';
const COR_PATCH = '#9333EA';
const COR_DELETE = '#DC2626';

const PAGE_W = 210;
const PAGE_H = 297;
const MARGEM = 16;
const LARGURA = PAGE_W - MARGEM * 2;

const doc = new jsPDF({ unit: 'mm', format: 'a4' });
doc.setFont('helvetica');

let pagina = 0;
const sumario = [];

function hexToRgb(hex) {
  const v = hex.replace('#', '');
  return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)];
}
function setFill(hex) { const [r, g, b] = hexToRgb(hex); doc.setFillColor(r, g, b); }
function setText(hex) { const [r, g, b] = hexToRgb(hex); doc.setTextColor(r, g, b); }
function setDraw(hex) { const [r, g, b] = hexToRgb(hex); doc.setDrawColor(r, g, b); }

function rodape() {
  if (pagina === 0) return;
  setDraw(COR_CINZA_CLARO);
  doc.setLineWidth(0.2);
  doc.line(MARGEM, PAGE_H - 14, PAGE_W - MARGEM, PAGE_H - 14);
  setText(COR_CINZA);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('UNYCO CRM · Catálogo de APIs', MARGEM, PAGE_H - 9);
  doc.text(`${pagina}`, PAGE_W - MARGEM, PAGE_H - 9, { align: 'right' });
  doc.text('unycoclub.com.br', PAGE_W / 2, PAGE_H - 9, { align: 'center' });
}

function novaPagina() { doc.addPage(); pagina++; rodape(); }

function header(titulo) {
  setFill(COR_AZUL_ESCURO);
  doc.rect(0, 0, PAGE_W, 14, 'F');
  setText(COR_BRANCO);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('UNYCO', MARGEM, 9);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(titulo, PAGE_W - MARGEM, 9, { align: 'right' });
  setText(COR_TEXTO);
}

function ensureSpace(needed, headerTitulo) {
  if (28 + needed > PAGE_H - 18) return;
  // sentinela genérica
}

let cursorY = 28;
let activeTitle = '';

function tituloSecao(texto) {
  novaPagina();
  activeTitle = texto;
  header(texto);
  let y = 28;
  setFill(COR_AZUL_CLARO);
  doc.rect(MARGEM, y - 4, 4, 9, 'F');
  setText(COR_AZUL_ESCURO);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text(texto, MARGEM + 8, y + 3);
  sumario.push({ titulo: texto, pagina });
  setText(COR_TEXTO);
  cursorY = y + 14;
  return cursorY;
}

function check(needed) {
  if (cursorY + needed > PAGE_H - 18) {
    novaPagina();
    header(activeTitle);
    cursorY = 28;
  }
}

function subtitulo(texto) {
  check(12);
  setText(COR_AZUL_ESCURO);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(texto, MARGEM, cursorY);
  setDraw(COR_AZUL_CLARO);
  doc.setLineWidth(0.4);
  doc.line(MARGEM, cursorY + 1.5, MARGEM + 28, cursorY + 1.5);
  setText(COR_TEXTO);
  cursorY += 7;
}

function paragrafo(texto, opts = {}) {
  doc.setFont('helvetica', opts.bold ? 'bold' : 'normal');
  doc.setFontSize(opts.size || 10);
  setText(opts.color || COR_TEXTO);
  const linhas = doc.splitTextToSize(texto, opts.largura || LARGURA);
  for (const linha of linhas) {
    check(6);
    doc.text(linha, MARGEM, cursorY);
    cursorY += (opts.size || 10) * 0.45 + 1.5;
  }
  cursorY += 2;
}

function bullet(texto) {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  setText(COR_TEXTO);
  const linhas = doc.splitTextToSize(texto, LARGURA - 6);
  check(linhas.length * 5 + 2);
  setFill(COR_AZUL_CLARO);
  doc.circle(MARGEM + 1.5, cursorY - 1.5, 1, 'F');
  for (const l of linhas) {
    check(5);
    doc.text(l, MARGEM + 6, cursorY);
    cursorY += 5;
  }
  cursorY += 1;
}

function caixaInfo(titulo, conteudo) {
  const linhas = doc.splitTextToSize(conteudo, LARGURA - 8);
  const altura = 10 + linhas.length * 4.5;
  check(altura + 4);
  setFill(COR_FUNDO_SUAVE);
  doc.roundedRect(MARGEM, cursorY, LARGURA, altura, 2, 2, 'F');
  setFill(COR_AZUL_ESCURO);
  doc.rect(MARGEM, cursorY, 1.5, altura, 'F');
  setText(COR_AZUL_ESCURO);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(titulo, MARGEM + 4, cursorY + 5);
  setText(COR_TEXTO);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  let yy = cursorY + 10;
  for (const l of linhas) { doc.text(l, MARGEM + 4, yy); yy += 4.5; }
  cursorY += altura + 4;
}

function metodoCor(m) {
  switch (m) {
    case 'GET': return COR_GET;
    case 'POST': return COR_POST;
    case 'PUT': return COR_PUT;
    case 'PATCH': return COR_PATCH;
    case 'DELETE': return COR_DELETE;
    default: return COR_CINZA;
  }
}

// Linha de endpoint estilizada
function endpointRow(method, pathStr, descricao) {
  const linhasDesc = doc.splitTextToSize(descricao, LARGURA - 50);
  const altura = Math.max(7.5, 4.5 + linhasDesc.length * 4.2);
  check(altura + 1);
  setFill(COR_FUNDO_SUAVE);
  doc.rect(MARGEM, cursorY, LARGURA, altura, 'F');

  // badge método
  const badgeW = 14;
  setFill(metodoCor(method));
  doc.roundedRect(MARGEM + 2, cursorY + 1.5, badgeW, 4.5, 0.8, 0.8, 'F');
  setText(COR_BRANCO);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text(method, MARGEM + 2 + badgeW / 2, cursorY + 4.7, { align: 'center' });

  // path
  setText(COR_AZUL_ESCURO);
  doc.setFont('courier', 'bold');
  doc.setFontSize(8.5);
  const pathW = LARGURA - badgeW - 8;
  const pathLines = doc.splitTextToSize(pathStr, pathW);
  doc.text(pathLines[0], MARGEM + badgeW + 6, cursorY + 4.7);

  // descrição
  setText(COR_TEXTO);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  let yd = cursorY + 4.7 + 4.2;
  for (const l of linhasDesc) {
    if (yd > cursorY + altura) break;
    doc.text(l, MARGEM + badgeW + 6, yd);
    yd += 4.2;
  }
  cursorY += altura + 0.8;
}

function blocoApiExterna({ nome, base, auth, observacoes }) {
  check(48);
  setFill(COR_AZUL_ESCURO);
  doc.rect(MARGEM, cursorY, LARGURA, 12, 'F');
  setText(COR_BRANCO);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(nome, MARGEM + 4, cursorY + 8);
  cursorY += 14;

  // grid metadata
  setFill(COR_FUNDO_SUAVE);
  doc.rect(MARGEM, cursorY, LARGURA, 22, 'F');
  setText(COR_AZUL_ESCURO);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('URL BASE', MARGEM + 3, cursorY + 4);
  doc.text('AUTENTICAÇÃO', MARGEM + 3, cursorY + 13);
  setText(COR_TEXTO);
  doc.setFont('courier', 'normal');
  doc.setFontSize(8.5);
  const baseLines = doc.splitTextToSize(base, LARGURA - 38);
  doc.text(baseLines[0], MARGEM + 32, cursorY + 4);
  if (baseLines[1]) doc.text(baseLines[1], MARGEM + 32, cursorY + 8);
  doc.setFont('helvetica', 'normal');
  const authLines = doc.splitTextToSize(auth, LARGURA - 38);
  doc.text(authLines[0], MARGEM + 32, cursorY + 13);
  if (authLines[1]) doc.text(authLines[1], MARGEM + 32, cursorY + 17);
  cursorY += 24;

  if (observacoes) {
    setText(COR_CINZA);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.5);
    const obs = doc.splitTextToSize(observacoes, LARGURA);
    for (const l of obs) {
      check(4.5);
      doc.text(l, MARGEM, cursorY);
      cursorY += 4.2;
    }
    cursorY += 2;
  }
}

// ===================== CAPA =====================
setFill(COR_AZUL_ESCURO);
doc.rect(0, 0, PAGE_W, PAGE_H, 'F');
setFill(COR_AZUL_CLARO);
doc.rect(0, PAGE_H - 60, PAGE_W, 60, 'F');
setFill(COR_AZUL_ESCURO);
doc.rect(0, PAGE_H - 60, PAGE_W, 1.2, 'F');

setText(COR_BRANCO);
doc.setFont('helvetica', 'bold');
doc.setFontSize(80);
doc.text('UNYCO', MARGEM, 90);
doc.setFontSize(11);
doc.setFont('helvetica', 'normal');
doc.text('CRM · Plataforma de Gestão e Reservas', MARGEM, 102);

doc.setFont('helvetica', 'bold');
doc.setFontSize(28);
doc.text('Catálogo de APIs', MARGEM, 150);
doc.setFont('helvetica', 'normal');
doc.setFontSize(11);
doc.text('Integrações externas e endpoints internos', MARGEM, 162);

doc.setFont('helvetica', 'bold');
doc.setFontSize(10);
doc.text('PROJETO', MARGEM, PAGE_H - 42);
doc.setFont('helvetica', 'normal');
doc.text('UNYCO CRM', MARGEM, PAGE_H - 36);
doc.setFont('helvetica', 'bold');
doc.text('AMBIENTE', MARGEM + 60, PAGE_H - 42);
doc.setFont('helvetica', 'normal');
doc.text('Produção (unycoclub.com.br)', MARGEM + 60, PAGE_H - 36);
doc.setFont('helvetica', 'bold');
doc.text('DATA', MARGEM + 130, PAGE_H - 42);
doc.setFont('helvetica', 'normal');
const hoje = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
doc.text(hoje, MARGEM + 130, PAGE_H - 36);
doc.setFont('helvetica', 'bold');
doc.text('FORNECEDOR', MARGEM, PAGE_H - 22);
doc.setFont('helvetica', 'normal');
doc.text('WESCCTECH · unycoclub.com.br', MARGEM, PAGE_H - 16);

// ===================== 1. VISÃO GERAL =====================
tituloSecao('1. Visão Geral');
paragrafo(
  'Este documento cataloga todas as APIs envolvidas no funcionamento do UNYCO CRM. ' +
  'É dividido em duas partes: APIs EXTERNAS consumidas pelo sistema (ERP, parceiros, ' +
  'gateways) e APIs INTERNAS expostas pelo próprio backend para o frontend e para ' +
  'integração de terceiros.'
);

subtitulo('Arquitetura de integração');
bullet('Toda chamada externa passa pelo backend Node.js, atuando como camada de proxy.');
bullet('Tokens e URLs das integrações são configuráveis em runtime na Central de APIs (sem redeploy).');
bullet('Persistência de configurações: server/api-config.json (TOTVS, Coobmais, Vindi) e tabela system_config (WhatsApp).');
bullet('Cache em memória aplicado a respostas Coobmais (cidades por 30min, categoria por 30min) para reduzir latência e custo.');

subtitulo('APIs externas integradas');
caixaInfo('5 integrações externas',
  '· TOTVS Protheus — ERP, sincronização de cadastros\n' +
  '· Coobmais — busca de hotéis, gestão de reservas, dados de associados\n' +
  '· Vindi — processamento de pagamentos (Cartão e PIX)\n' +
  '· WhatsApp WESCCTECH — disparo de mensagens transacionais\n' +
  '· ViaCEP — autopreenchimento de endereço por CEP'
);

subtitulo('APIs internas expostas');
caixaInfo('Mais de 70 endpoints REST agrupados em 11 áreas',
  '· Health & Configuração pública\n' +
  '· TOTVS (proxy + sync)\n' +
  '· Serviço de Sincronização\n' +
  '· Planos · Usuários · Assinaturas\n' +
  '· LP — Auth e Sessão\n' +
  '· LP — Hotéis e Reservas\n' +
  '· Vindi — Pagamentos\n' +
  '· Pagamentos (CRM)\n' +
  '· Categorias e Tarifas\n' +
  '· WhatsApp — Configuração, Fluxos, Logs\n' +
  '· Central de APIs'
);

subtitulo('Convenções deste documento');
bullet('Verbos HTTP exibidos em badges coloridos (GET verde, POST azul, PUT amarelo, PATCH roxo, DELETE vermelho).');
bullet('Caminhos em fonte monoespaçada para fácil identificação.');
bullet('Para APIs externas, cada bloco indica URL base, autenticação e principais endpoints utilizados pelo sistema.');
bullet('Todos os endpoints internos respondem em JSON. O envelope padrão usa { ok: true|false, data, error }.');

// ===================== 2. APIS EXTERNAS =====================
tituloSecao('2. APIs Externas');

// ---------- TOTVS ----------
blocoApiExterna({
  nome: 'TOTVS Protheus (ERP)',
  base: 'https://coobrasturviagens179215.protheus.cloudtotvs.com.br:1806',
  auth: 'Header Authorization: Basic <token>  (token base64 cadastrado na Central de APIs)',
  observacoes: 'Usado para buscar e cadastrar clientes (tabela SA1). Identificador de parceiro fixo: A1_IDPARC = "WESCC1". Erros TOTVS são traduzidos para mensagens em português antes de retornar ao usuário.'
});
subtitulo('Endpoints utilizados');
endpointRow('GET', '/getClient', 'Consulta um cliente no TOTVS pelo CPF (campo A1_CGC) e parceiro WESCC1.');
endpointRow('POST', '/insClient', 'Cria/atualiza um cliente no TOTVS com os campos A1_NOME, A1_NOME2, A1_END, A1_BAIRRO, A1_MUN, A1_EST, A1_CEP, A1_DDD, A1_TEL, A1_EMAIL, A1_DTNASC, A1_PFISICA, etc.');

cursorY += 4;
caixaInfo('Body de exemplo — busca',
  '{ "A1_CGC": "12345678900", "A1_IDPARC": "WESCC1" }'
);
caixaInfo('Body de exemplo — sincronização',
  '[{ "A1_CGC": "12345678900", "A1_NOME": "JOAO", "A1_NOME2": "DA SILVA", "A1_NREDUZ": "JOAO DA SILVA",\n' +
  '   "A1_END": "RUA X, 100", "A1_BAIRRO": "CENTRO", "A1_MUN": "SAO PAULO", "A1_EST": "SP",\n' +
  '   "A1_CEP": "01000000", "A1_DDD": "11", "A1_TEL": "999998888",\n' +
  '   "A1_PESSOA": "F", "A1_TIPO": "F", "A1_PFISICA": "S", "A1_PAIS": "105",\n' +
  '   "A1_EMAIL": "joao@email.com", "A1_DTNASC": "19900101", "A1_IDPARC": "WESCC1" }]'
);

// ---------- COOBMAIS ----------
blocoApiExterna({
  nome: 'Coobmais (associados, hotéis, reservas)',
  base: 'https://apiprod.coobmais.com.br/unico/api',
  auth: 'Bearer JWT (gerado e cacheado pelo backend; refresh automático 5min antes do exp)',
  observacoes: 'Login realizado em endpoint separado (auth/api/Users/Authenticate) com AccessKey + password. O backend regenera o token automaticamente sob demanda. Identificador institucional para reservas: CNPJ 1573933000130, empCode 38.'
});
subtitulo('Endpoint de autenticação');
endpointRow('POST', 'https://apiprod.coobmais.com.br/auth/api/Users/Authenticate', 'Autenticação. Body: { AccessKey, password }. Retorna { token } JWT.');
cursorY += 2;

subtitulo('Endpoints de associados');
endpointRow('GET', '/Associate/GetAssociate?cpfCnpj={doc}&empCode=38', 'Consulta dados do associado por CPF/CNPJ. Retorna AssNic usado nas reservas.');
cursorY += 2;

subtitulo('Endpoints de hotéis');
endpointRow('POST', '/Book/GetCities', 'Busca cidades para autocomplete. Body: { cidade, uf }.');
endpointRow('POST', '/Book/GetHotels', 'Lista hotéis disponíveis. Body: { google_place_id, start_date, end_date, adults, children, rooms }.');
endpointRow('GET', '/Book/InfoHotels?hotel_id={id}', 'Detalhes de um hotel: fotos, comodidades, categoria.');
endpointRow('POST', '/Book/InfoApartment', 'Apartamentos disponíveis. Body: { hotel_id, start_date, end_date, adults, children, children_age }.');
endpointRow('GET', '/Book/CategoryList', 'Lista categorias de hotéis (Silver, Gold, Diamante).');
cursorY += 2;

subtitulo('Endpoints de reservas');
endpointRow('POST', '/Book/AvailabilityBook', 'Verifica disponibilidade. Body: { token, cpf, hotel_id, vfb_points, vfb_identifier }.');
endpointRow('POST', '/Book/BookingConfirmation', 'Confirma reserva e devolve o localizador. Mesmo body do AvailabilityBook.');
endpointRow('PATCH', '/Book/CancellationBook', 'Cancela reserva. Body: { token }.');

// ---------- VINDI ----------
blocoApiExterna({
  nome: 'Vindi (gateway de pagamentos)',
  base: 'https://app.vindi.com.br/api/v1',
  auth: 'Header Authorization: Basic <base64(API_KEY:)>  (API key da Vindi)',
  observacoes: 'Ambiente de produção. Suporta cartão de crédito e PIX. Para PIX, o backend extrai qrcode_path e qrcode_original_path de charge.last_transaction.gateway_response_fields. Produto fixo via VINDI_PRODUCT_ID (default 1980987 — "PROJETO UNYCO"), com fallback para HOSP_UNYCO.'
});
subtitulo('Endpoints utilizados');
endpointRow('GET', '/payment_methods', 'Lista métodos de pagamento ativos (cartão, PIX, boleto).');
endpointRow('GET', '/customers?query=registry_code:{cpf}', 'Procura cliente Vindi por CPF.');
endpointRow('POST', '/customers', 'Cria cliente Vindi com nome, e-mail, registry_code (CPF) e telefone.');
endpointRow('PUT', '/customers/:id', 'Atualiza dados do cliente.');
endpointRow('POST', '/customers/:id/unarchive', 'Reativa cliente arquivado (status inactive).');
endpointRow('POST', '/payment_profiles', 'Cria perfil de pagamento com dados do cartão (tokenização).');
endpointRow('POST', '/bills', 'Cria a fatura (com bill_items, payment_method_code, customer_id, payment_profile, metadata).');
endpointRow('GET', '/bills/:id', 'Consulta fatura — usado no polling do PIX para detectar pagamento.');
endpointRow('DELETE', '/bills/:id', 'Cancela fatura.');
endpointRow('GET', '/products/:id', 'Consulta produto (validação do VINDI_PRODUCT_ID).');
endpointRow('POST', '/products', 'Cria produto (fallback HOSP_UNYCO se o produto fixo não existir).');

// ---------- WHATSAPP ----------
blocoApiExterna({
  nome: 'WhatsApp WESCCTECH',
  base: 'https://api.wescctech.com.br/core/v2/api',
  auth: 'Header access-token: <token>  (token cadastrado em system_config / Central de APIs)',
  observacoes: 'Disparo automático nos eventos booking_confirmed, booking_cancelled e registration_completed. Número formatado como 55DDDXXXXXXXX.'
});
subtitulo('Endpoints utilizados');
endpointRow('POST', '/chats/send-text', 'Envia mensagem de texto. Body: { forceSend: true, message, number }.');

// ---------- VIACEP ----------
blocoApiExterna({
  nome: 'ViaCEP',
  base: 'https://viacep.com.br/ws',
  auth: 'Não requer autenticação',
  observacoes: 'Usado para autopreenchimento de endereço a partir do CEP, no CRM e na LP.'
});
subtitulo('Endpoint utilizado');
endpointRow('GET', '/{cep}/json', 'Retorna logradouro, bairro, cidade e UF a partir do CEP (8 dígitos).');

// ===================== 3. APIS INTERNAS =====================
tituloSecao('3. APIs Internas (expostas pelo backend)');
paragrafo('Todas as rotas a seguir são servidas em https://unycoclub.com.br pelo mesmo processo Node.js. ' +
  'Respostas em JSON, envelope padrão { ok: true|false, data, error }. Algumas rotas exigem cookie ' +
  'lp_token (sessão da Landing Page) ou autenticação interna do CRM.');

subtitulo('3.1 Health e Configuração pública');
endpointRow('GET', '/api/health', 'Health check do servidor e da conexão com o PostgreSQL.');
endpointRow('GET', '/api/config/public', 'Configurações públicas (ex.: plans_enabled) usadas pelo frontend.');
endpointRow('GET', '/api/config', 'Lista todas as configurações de sistema (CRM).');
endpointRow('PUT', '/api/config/:key', 'Atualiza uma configuração de sistema (CRM admin).');

subtitulo('3.2 TOTVS (proxy)');
endpointRow('POST', '/api/totvs/search', 'Busca cliente no TOTVS por CPF.');
endpointRow('POST', '/api/totvs/sync', 'Sincroniza um usuário do CRM para o TOTVS.');
endpointRow('POST', '/api/totvs/check-exists', 'Verifica se CPF já existe no TOTVS.');
endpointRow('GET', '/api/totvs/health', 'Status da integração TOTVS (token configurado, latência).');

subtitulo('3.3 Serviço de Sincronização');
endpointRow('GET', '/api/sync.php', 'Sumário da última execução da sincronização.');
endpointRow('GET', '/api/sync-service/status', 'Status atual do cronômetro e próximo run.');
endpointRow('GET', '/api/sync-service/logs', 'Logs persistidos das execuções.');
endpointRow('POST', '/api/sync-service/config', 'Atualiza intervalo e parâmetros do serviço.');
endpointRow('POST', '/api/sync-service/run-now', 'Dispara execução imediata da sincronização.');
endpointRow('POST', '/api/sync-service/clear', 'Limpa logs e contadores.');
endpointRow('GET', '/api/sync-service/synced-users', 'Lista usuários sincronizados, existentes e com erro.');

subtitulo('3.4 Planos, Usuários e Assinaturas');
endpointRow('GET', '/api/plans.php', 'Lista planos cadastrados.');
endpointRow('POST', '/api/plans.php', 'Cria/edita plano (CRM).');
endpointRow('GET', '/api/users.php', 'Lista usuários (com paginação, busca e filtros).');
endpointRow('POST', '/api/users.php', 'Cria/atualiza usuário (CRM).');
endpointRow('GET', '/api/subscriptions.php', 'Lista assinaturas com filtros por status.');
endpointRow('POST', '/api/subscriptions.php', 'Cria assinatura ou ajusta status (ativar/pendenciar).');

subtitulo('3.5 Landing Page — Autenticação e Sessão');
endpointRow('POST', '/api/lp/register', 'Cadastra associado pela LP. Cria sessão (cookie lp_token).');
endpointRow('POST', '/api/lp/login', 'Login do associado por e-mail e senha.');
endpointRow('POST', '/api/lp/logout', 'Encerra a sessão LP.');
endpointRow('GET', '/api/lp/session', 'Dados do usuário logado e da assinatura atual.');
endpointRow('GET', '/api/lp/plans', 'Lista de planos visíveis para o associado.');
endpointRow('POST', '/api/lp/checkout', 'Conclui dados de endereço e cria assinatura pendente.');

subtitulo('3.6 Landing Page — Hotéis e Reservas');
endpointRow('POST', '/api/lp/cities', 'Autocomplete de cidades (proxy Coobmais com cache).');
endpointRow('POST', '/api/lp/hotels', 'Lista hotéis disponíveis com tarifa por categoria já aplicada.');
endpointRow('GET', '/api/lp/hotel-info', 'Detalhes do hotel (fotos, comodidades, tarifa).');
endpointRow('POST', '/api/lp/info-apartment', 'Apartamentos disponíveis para um hotel/data.');
endpointRow('POST', '/api/lp/availability-book', 'Verifica disponibilidade do código de reserva.');
endpointRow('POST', '/api/lp/booking-confirmation', 'Confirma reserva na Coobmais e gera localizador.');
endpointRow('POST', '/api/lp/bookings', 'Persiste a reserva no banco e dispara WhatsApp booking_confirmed.');
endpointRow('GET', '/api/lp/bookings', 'Lista reservas do usuário logado.');
endpointRow('PATCH', '/api/lp/bookings/:id/cancel', 'Cancela reserva (Coobmais + Vindi) e dispara booking_cancelled.');
endpointRow('PATCH', '/api/lp/bookings/:id/payment', 'Vincula um payment_id a uma reserva.');
endpointRow('PATCH', '/api/lp/bookings/:localizador/link-payment', 'Vincula uma fatura Vindi pelo localizador.');
endpointRow('GET', '/api/admin/bookings', 'Lista todas as reservas (visão administrativa).');

subtitulo('3.7 Vindi — Pagamentos');
endpointRow('GET', '/api/vindi/payment-methods', 'Lista métodos de pagamento ativos na Vindi.');
endpointRow('POST', '/api/vindi/create-bill', 'Cria fatura (cartão ou PIX), persiste em payments, retorna QR Code para PIX.');
endpointRow('GET', '/api/vindi/bill/:id', 'Consulta fatura (usado pelo polling PIX a cada 5s).');
endpointRow('POST', '/api/vindi/cancel-bill', 'Cancela uma fatura específica na Vindi.');

subtitulo('3.8 Pagamentos (CRM)');
endpointRow('GET', '/api/payments', 'Lista pagamentos com filtros (status, método, busca) e estatísticas.');
endpointRow('POST', '/api/payments/:id/refresh', 'Atualiza status do pagamento consultando a Vindi.');

subtitulo('3.9 Categorias e Tarifas');
endpointRow('GET', '/api/lp/category-list', 'Lista categorias da Coobmais.');
endpointRow('GET', '/api/category-rates', 'Lista tarifas configuradas por categoria.');
endpointRow('PUT', '/api/category-rates/:categoryId', 'Atualiza tarifas (alta e baixa temporada) de uma categoria.');
endpointRow('POST', '/api/category-rates/sync', 'Sincroniza categorias da Coobmais com a tabela local.');
endpointRow('GET', '/api/lp/category-rates-public', 'Tarifas em formato público (LP).');
endpointRow('GET', '/api/season-config', 'Configuração de meses de alta temporada.');
endpointRow('PUT', '/api/season-config', 'Atualiza meses de alta temporada.');

subtitulo('3.10 WhatsApp — Configuração, Fluxos e Logs');
endpointRow('GET', '/api/whatsapp/config', 'Configuração atual (URL e token mascarado).');
endpointRow('PUT', '/api/whatsapp/config', 'Atualiza URL e token da API WhatsApp.');
endpointRow('GET', '/api/whatsapp/flows', 'Lista todos os fluxos cadastrados.');
endpointRow('GET', '/api/whatsapp/flows/:id', 'Detalhes de um fluxo.');
endpointRow('POST', '/api/whatsapp/flows', 'Cria um novo fluxo (trigger_event, mensagem, delay, condições).');
endpointRow('PUT', '/api/whatsapp/flows/:id', 'Atualiza fluxo.');
endpointRow('DELETE', '/api/whatsapp/flows/:id', 'Remove fluxo.');
endpointRow('PATCH', '/api/whatsapp/flows/:id/toggle', 'Ativa/desativa fluxo.');
endpointRow('POST', '/api/whatsapp/test', 'Dispara teste de envio (com progresso em tempo real via testId).');
endpointRow('GET', '/api/whatsapp/test/:testId', 'Status do teste em execução.');
endpointRow('GET', '/api/whatsapp/logs', 'Histórico de mensagens enviadas (paginado).');
endpointRow('GET', '/api/whatsapp/stats', 'Estatísticas (total enviado, sucesso, erros, últimas 24h).');

subtitulo('3.11 Central de APIs (monitoramento)');
endpointRow('GET', '/api/central/health', 'Health check consolidado de todas as APIs externas.');
endpointRow('GET', '/api/central/apis', 'Lista APIs monitoradas com status e latência.');
endpointRow('GET', '/api/central/config', 'Configurações atuais (URLs e tokens mascarados).');
endpointRow('PUT', '/api/central/apis/:name', 'Atualiza URL/token de uma API (TOTVS, Coobmais, Vindi).');
endpointRow('GET', '/api/central/coobmais/token', 'Preview do JWT atual e expiração.');
endpointRow('POST', '/api/central/coobmais/refresh-token', 'Força regeneração imediata do JWT Coobmais.');

// ===================== 4. EVENTOS DISPARADOS =====================
tituloSecao('4. Eventos e Gatilhos Automáticos');
paragrafo('Algumas rotas internas disparam, em segundo plano, fluxos automáticos de WhatsApp ' +
  'configurados na tabela whatsapp_flows.');

subtitulo('Eventos disparados');
caixaInfo('booking_confirmed',
  'Quando: ao salvar uma reserva confirmada em POST /api/lp/bookings.\n' +
  'Variáveis disponíveis: nome, hotel, checkin, checkout, localizador, valor.');
caixaInfo('booking_cancelled',
  'Quando: ao cancelar reserva em PATCH /api/lp/bookings/:id/cancel.\n' +
  'Variáveis disponíveis: nome, hotel, checkin, checkout, localizador, valor.');
caixaInfo('registration_completed',
  'Quando: ao finalizar cadastro pela LP (POST /api/lp/register) com planos desativados.\n' +
  'Variáveis disponíveis: nome.');

// ===================== Insere SUMÁRIO logo após a capa =====================
const paginasSecoes = sumario.reduce((acc, s) => { acc[s.titulo] = s.pagina; return acc; }, {});

doc.insertPage(2);
pagina = 1;
header('Sumário');
let yy = 30;
setFill(COR_AZUL_CLARO);
doc.rect(MARGEM, yy - 4, 4, 9, 'F');
setText(COR_AZUL_ESCURO);
doc.setFont('helvetica', 'bold');
doc.setFontSize(20);
doc.text('Sumário', MARGEM + 8, yy + 3);
yy += 14;

doc.setFont('helvetica', 'normal');
doc.setFontSize(11);
setText(COR_TEXTO);
const ordem = [
  '1. Visão Geral',
  '2. APIs Externas',
  '3. APIs Internas (expostas pelo backend)',
  '4. Eventos e Gatilhos Automáticos',
];
ordem.forEach((titulo) => {
  const pg = (paginasSecoes[titulo] || 0) + 1;
  setText(COR_AZUL_ESCURO);
  doc.setFont('helvetica', 'bold');
  doc.text(titulo.split(' ')[0], MARGEM, yy);
  setText(COR_TEXTO);
  doc.setFont('helvetica', 'normal');
  const num = titulo.split(' ')[0];
  doc.text(titulo.substring(num.length + 1), MARGEM + 12, yy);
  setDraw(COR_CINZA_CLARO);
  doc.setLineDashPattern([0.6, 1.2], 0);
  doc.line(MARGEM + 12 + doc.getTextWidth(titulo.substring(num.length + 1)) + 2, yy - 0.8, PAGE_W - MARGEM - 10, yy - 0.8);
  doc.setLineDashPattern([], 0);
  setText(COR_AZUL_ESCURO);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(String(pg), PAGE_W - MARGEM, yy, { align: 'right' });
  setText(COR_TEXTO);
  doc.setFont('helvetica', 'normal');
  yy += 9;
});

setText(COR_CINZA);
doc.setFont('helvetica', 'italic');
doc.setFontSize(9);
doc.text('Documento confidencial · uso exclusivo da UNYCO e WESCCTECH', MARGEM, PAGE_H - 20);
rodape();

// ===================== SALVAR =====================
const out = path.resolve('entrega/UNYCO-CRM-Catalogo-de-APIs.pdf');
fs.mkdirSync(path.dirname(out), { recursive: true });
doc.save(out);
console.log('PDF gerado:', out, '·', fs.statSync(out).size, 'bytes');
