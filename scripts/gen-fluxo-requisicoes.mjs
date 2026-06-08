import { jsPDF } from 'jspdf';
import fs from 'node:fs';
import path from 'node:path';

const COR_AZUL_ESCURO = '#2E6299';
const COR_AZUL_CLARO = '#4DA3FF';
const COR_TEXTO = '#1F2937';
const COR_CINZA = '#6B7280';
const COR_CINZA_CLARO = '#E5E7EB';
const COR_FUNDO_SUAVE = '#F3F6FB';
const COR_FUNDO_FRONT = '#EEF6FF';
const COR_FUNDO_BACK = '#FFF7ED';
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
let cursorY = 28;
let activeTitle = '';

function rgb(hex) { const v = hex.replace('#',''); return [parseInt(v.slice(0,2),16),parseInt(v.slice(2,4),16),parseInt(v.slice(4,6),16)]; }
function setFill(h){const[r,g,b]=rgb(h);doc.setFillColor(r,g,b);}
function setText(h){const[r,g,b]=rgb(h);doc.setTextColor(r,g,b);}
function setDraw(h){const[r,g,b]=rgb(h);doc.setDrawColor(r,g,b);}

function rodape() {
  if (pagina === 0) return;
  setDraw(COR_CINZA_CLARO); doc.setLineWidth(0.2);
  doc.line(MARGEM, PAGE_H - 14, PAGE_W - MARGEM, PAGE_H - 14);
  setText(COR_CINZA); doc.setFont('helvetica','normal'); doc.setFontSize(8);
  doc.text('UNYCO CRM · Fluxo de Requisições', MARGEM, PAGE_H - 9);
  doc.text(`${pagina}`, PAGE_W - MARGEM, PAGE_H - 9, { align: 'right' });
  doc.text('unycoclub.com.br', PAGE_W/2, PAGE_H - 9, { align: 'center' });
}
function novaPagina(){doc.addPage();pagina++;rodape();}
function header(t){
  setFill(COR_AZUL_ESCURO); doc.rect(0,0,PAGE_W,14,'F');
  setText(COR_BRANCO); doc.setFont('helvetica','bold'); doc.setFontSize(9);
  doc.text('UNYCO', MARGEM, 9);
  doc.setFont('helvetica','normal'); doc.text(t, PAGE_W - MARGEM, 9, {align:'right'});
  setText(COR_TEXTO);
}
function check(n){ if (cursorY + n > PAGE_H - 18) { novaPagina(); header(activeTitle); cursorY = 28; } }

function tituloSecao(t){
  novaPagina(); activeTitle = t; header(t);
  cursorY = 28;
  setFill(COR_AZUL_CLARO); doc.rect(MARGEM, cursorY-4, 4, 9, 'F');
  setText(COR_AZUL_ESCURO); doc.setFont('helvetica','bold'); doc.setFontSize(20);
  doc.text(t, MARGEM + 8, cursorY + 3);
  setText(COR_TEXTO); cursorY += 14;
}

function paragrafo(texto, opts={}){
  doc.setFont('helvetica', opts.bold?'bold':'normal');
  doc.setFontSize(opts.size||10);
  setText(opts.color||COR_TEXTO);
  const linhas = doc.splitTextToSize(texto, opts.largura||LARGURA);
  for (const l of linhas){ check(6); doc.text(l, MARGEM, cursorY); cursorY += (opts.size||10)*0.45 + 1.5; }
  cursorY += 1.5;
}

function bullet(texto){
  doc.setFont('helvetica','normal'); doc.setFontSize(10); setText(COR_TEXTO);
  const linhas = doc.splitTextToSize(texto, LARGURA - 6);
  check(linhas.length*5 + 2);
  setFill(COR_AZUL_CLARO); doc.circle(MARGEM+1.5, cursorY-1.5, 1, 'F');
  for (const l of linhas){ check(5); doc.text(l, MARGEM+6, cursorY); cursorY += 5; }
}

function metodoCor(m){
  return ({GET:COR_GET,POST:COR_POST,PUT:COR_PUT,PATCH:COR_PATCH,DELETE:COR_DELETE})[m]||COR_CINZA;
}

function reqBox({lado, method, url, headers=[], body, descricao}) {
  const fundo = lado === 'front' ? COR_FUNDO_FRONT : COR_FUNDO_BACK;
  const labelLado = lado === 'front' ? 'FRONTEND → BACKEND' : 'BACKEND → API EXTERNA';

  const headerLines = headers.map(h => `${h.k}: ${h.v}`);
  const bodyLines = body ? doc.splitTextToSize(body, LARGURA - 8) : [];
  const urlLines = doc.splitTextToSize(url, LARGURA - 30);
  const descLines = descricao ? doc.splitTextToSize(descricao, LARGURA - 8) : [];

  let altura = 8 + 6 + urlLines.length * 4.2;
  if (headerLines.length) altura += 4 + headerLines.length * 4;
  if (bodyLines.length) altura += 4 + bodyLines.length * 3.8;
  if (descLines.length) altura += 4 + descLines.length * 4.2;
  altura += 4;

  check(altura + 3);
  setFill(fundo);
  doc.roundedRect(MARGEM, cursorY, LARGURA, altura, 2, 2, 'F');

  // tag lado
  setText(lado === 'front' ? COR_POST : '#B45309');
  doc.setFont('helvetica','bold'); doc.setFontSize(7);
  doc.text(labelLado, MARGEM + 4, cursorY + 5);

  // método + URL
  let y = cursorY + 11;
  setFill(metodoCor(method));
  doc.roundedRect(MARGEM + 4, y - 3.5, 14, 4.8, 0.8, 0.8, 'F');
  setText(COR_BRANCO); doc.setFont('helvetica','bold'); doc.setFontSize(7);
  doc.text(method, MARGEM + 11, y - 0.4, {align:'center'});

  setText(COR_AZUL_ESCURO); doc.setFont('courier','bold'); doc.setFontSize(8.5);
  for (let i = 0; i < urlLines.length; i++){
    doc.text(urlLines[i], MARGEM + 22, y);
    y += 4.2;
  }
  y += 1;

  if (headerLines.length){
    setText(COR_CINZA); doc.setFont('helvetica','bold'); doc.setFontSize(7);
    doc.text('HEADERS', MARGEM + 4, y);
    y += 3.5;
    setText(COR_TEXTO); doc.setFont('courier','normal'); doc.setFontSize(7.5);
    for (const h of headerLines){
      doc.text(h, MARGEM + 4, y);
      y += 4;
    }
  }

  if (bodyLines.length){
    setText(COR_CINZA); doc.setFont('helvetica','bold'); doc.setFontSize(7);
    doc.text('BODY', MARGEM + 4, y + 1);
    y += 4.5;
    setText(COR_TEXTO); doc.setFont('courier','normal'); doc.setFontSize(7.5);
    for (const l of bodyLines){
      doc.text(l, MARGEM + 4, y);
      y += 3.8;
    }
  }

  if (descLines.length){
    setText(COR_CINZA); doc.setFont('helvetica','bold'); doc.setFontSize(7);
    doc.text('O QUE FAZ', MARGEM + 4, y + 1);
    y += 4.5;
    setText(COR_TEXTO); doc.setFont('helvetica','normal'); doc.setFontSize(8.5);
    for (const l of descLines){
      doc.text(l, MARGEM + 4, y);
      y += 4.2;
    }
  }

  cursorY += altura + 3;
}

function etapaTitulo(numero, titulo, subtitulo){
  check(20);
  setFill(COR_AZUL_ESCURO);
  doc.roundedRect(MARGEM, cursorY, LARGURA, 13, 2, 2, 'F');
  setText(COR_BRANCO); doc.setFont('helvetica','bold'); doc.setFontSize(9);
  doc.text(`ETAPA ${numero}`, MARGEM + 4, cursorY + 5);
  doc.setFontSize(13);
  doc.text(titulo, MARGEM + 4, cursorY + 10);
  if (subtitulo){
    doc.setFont('helvetica','normal'); doc.setFontSize(8.5);
    doc.text(subtitulo, PAGE_W - MARGEM - 4, cursorY + 8, {align:'right'});
  }
  setText(COR_TEXTO);
  cursorY += 16;
}

// ===================== CAPA =====================
setFill(COR_AZUL_ESCURO); doc.rect(0,0,PAGE_W,PAGE_H,'F');
setFill(COR_AZUL_CLARO); doc.rect(0, PAGE_H-60, PAGE_W, 60, 'F');
setText(COR_BRANCO);
doc.setFont('helvetica','bold'); doc.setFontSize(80); doc.text('UNYCO', MARGEM, 90);
doc.setFontSize(11); doc.setFont('helvetica','normal');
doc.text('CRM · Plataforma de Reservas', MARGEM, 102);
doc.setFont('helvetica','bold'); doc.setFontSize(28);
doc.text('Fluxo de Requisições', MARGEM, 150);
doc.setFont('helvetica','normal'); doc.setFontSize(11);
doc.text('Do acesso do cliente até o pagamento confirmado', MARGEM, 162);
doc.setFontSize(10);
doc.text('Cobre todas as chamadas HTTP do frontend e do backend,', MARGEM, 178);
doc.text('em ordem cronológica, com método, URL, headers e body.', MARGEM, 184);

doc.setFont('helvetica','bold'); doc.setFontSize(10);
doc.text('PROJETO', MARGEM, PAGE_H-42); doc.setFont('helvetica','normal'); doc.text('UNYCO CRM', MARGEM, PAGE_H-36);
doc.setFont('helvetica','bold'); doc.text('AMBIENTE', MARGEM+60, PAGE_H-42); doc.setFont('helvetica','normal'); doc.text('Produção (unycoclub.com.br)', MARGEM+60, PAGE_H-36);
doc.setFont('helvetica','bold'); doc.text('DATA', MARGEM+130, PAGE_H-42); doc.setFont('helvetica','normal');
const hoje = new Date().toLocaleDateString('pt-BR',{day:'2-digit',month:'long',year:'numeric'});
doc.text(hoje, MARGEM+130, PAGE_H-36);

// ===================== INTRO =====================
tituloSecao('Visão Geral do Fluxo');
paragrafo('Este documento mostra todas as requisições HTTP feitas durante a jornada completa de um cliente, ' +
  'desde o momento em que ele acessa a Landing Page até o pagamento confirmado da reserva.');

bullet('Caixas AZUIS = chamadas que o FRONTEND faz para o nosso backend (rotas /api/*).');
bullet('Caixas LARANJAS = chamadas que o BACKEND faz para APIs EXTERNAS (Coobmais e Vindi).');
bullet('Em cada chamada do backend, o frontend NÃO precisa saber o que acontece dentro — ele só recebe a resposta consolidada.');
bullet('Toda autenticação com APIs externas é feita pelo backend. O frontend só envia o cookie de sessão (lp_token).');

cursorY += 2;
paragrafo('Resumo das etapas:', {bold:true, size:11});
bullet('1. Acesso e cadastro/login do cliente');
bullet('2. Busca de hotéis (cidade, datas, hóspedes)');
bullet('3. Detalhes do hotel e seleção do apartamento');
bullet('4. Verificação de disponibilidade na Coobmais');
bullet('5. Confirmação da reserva (gera o localizador)');
bullet('6. Persistência da reserva no banco local');
bullet('7. Geração da fatura na Vindi (PIX ou Cartão)');
bullet('8. Acompanhamento do pagamento (polling para PIX)');
bullet('9. Vinculação final pagamento ↔ reserva');

// ===================== ETAPA 1: CADASTRO/LOGIN =====================
tituloSecao('Etapa 1 — Acesso, Cadastro e Login');

etapaTitulo('1A', 'Cadastro de novo cliente', 'Quando o cliente preenche o formulário de cadastro');
reqBox({
  lado:'front', method:'POST',
  url:'/api/lp/register',
  headers:[{k:'Content-Type',v:'application/json'}],
  body:'{\n  "name": "Joao da Silva",\n  "cpf": "12345678900",\n  "email": "joao@email.com",\n  "password": "senha123",\n  "phone": "11999998888",\n  "cep": "01000000",\n  "address": "Rua X",\n  "number": "100",\n  "bairro": "Centro",\n  "cidade": "Sao Paulo",\n  "estado": "SP",\n  "birth_date": "1990-01-01"\n}',
  descricao:'Frontend envia os dados do formulário. Backend valida CPF, checa duplicatas, cria registro na tabela users e retorna cookie lp_token (sessão de 24h).'
});

etapaTitulo('1B', 'Login de cliente já cadastrado', 'Alternativa ao 1A');
reqBox({
  lado:'front', method:'POST',
  url:'/api/lp/login',
  headers:[{k:'Content-Type',v:'application/json'}],
  body:'{\n  "email": "joao@email.com",\n  "password": "senha123"\n}',
  descricao:'Backend valida e-mail/senha, cria cookie lp_token e devolve redirect para a página inicial.'
});

etapaTitulo('1C', 'Validação de sessão (em todas as páginas)', 'Disparada automaticamente pelo frontend');
reqBox({
  lado:'front', method:'GET',
  url:'/api/lp/session',
  headers:[{k:'Cookie',v:'lp_token=...'}],
  descricao:'Verifica se o cookie é válido e retorna dados do usuário (id, nome, CPF, telefone, e-mail) e da assinatura atual.'
});

// ===================== ETAPA 2: BUSCA =====================
tituloSecao('Etapa 2 — Busca de Hotéis');

etapaTitulo('2A', 'Autocomplete de cidades', 'Disparado a cada digitação no campo cidade');
reqBox({
  lado:'front', method:'POST',
  url:'/api/lp/cities',
  headers:[{k:'Content-Type',v:'application/json'}],
  body:'{ "cidade": "Sao Pa", "uf": "SP" }',
  descricao:'Frontend pede sugestões de cidades. Backend faz cache de 30min e proxia para a Coobmais.'
});
reqBox({
  lado:'back', method:'POST',
  url:'https://apiprod.coobmais.com.br/unico/api/Book/GetCities',
  headers:[{k:'Authorization',v:'Bearer <JWT Coobmais>'},{k:'Content-Type',v:'application/json'}],
  body:'{ "cidade": "Sao Pa", "uf": "SP" }',
  descricao:'Backend chama a Coobmais com o JWT que ele mesmo mantém renovado.'
});

etapaTitulo('2B', 'Busca de hotéis disponíveis', 'Quando o cliente clica em "Buscar"');
reqBox({
  lado:'front', method:'POST',
  url:'/api/lp/hotels',
  headers:[{k:'Content-Type',v:'application/json'}],
  body:'{\n  "google_place_id": "ChIJ...",\n  "checkIn": "2026-10-20",\n  "checkOut": "2026-10-25",\n  "adults": 2,\n  "children": 0,\n  "rooms": 1\n}',
  descricao:'Frontend envia parâmetros de busca. Backend traz a lista de hotéis e ainda APLICA as tarifas configuradas por categoria (Silver/Gold/Diamante) sobre os preços recebidos.'
});
reqBox({
  lado:'back', method:'POST',
  url:'https://apiprod.coobmais.com.br/unico/api/Book/GetHotels',
  headers:[{k:'Authorization',v:'Bearer <JWT Coobmais>'}],
  body:'{\n  "google_place_id": "ChIJ...",\n  "start_date": "2026-10-20",\n  "end_date": "2026-10-25",\n  "adults": 2,\n  "children": 0,\n  "rooms": 1\n}',
  descricao:'Backend pede a lista de acomodações disponíveis para o período.'
});
reqBox({
  lado:'back', method:'GET',
  url:'https://apiprod.coobmais.com.br/unico/api/Book/InfoHotels?hotel_id={id}',
  headers:[{k:'Authorization',v:'Bearer <JWT Coobmais>'}],
  descricao:'Para cada hotel retornado, backend descobre a CATEGORIA (Silver/Gold/Diamante) — necessário para aplicar a tarifa correta. Com cache de 30min para reduzir chamadas.'
});

// ===================== ETAPA 3: DETALHE HOTEL E APTO =====================
tituloSecao('Etapa 3 — Detalhes do Hotel e Apartamento');

etapaTitulo('3A', 'Cliente clica em um hotel', 'Para ver fotos, comodidades e descrição');
reqBox({
  lado:'front', method:'GET',
  url:'/api/lp/hotel-info?hotel_id=9662',
  descricao:'Pede ao backend os detalhes completos do hotel selecionado.'
});
reqBox({
  lado:'back', method:'GET',
  url:'https://apiprod.coobmais.com.br/unico/api/Book/InfoHotels?hotel_id=9662',
  headers:[{k:'Authorization',v:'Bearer <JWT Coobmais>'}],
  descricao:'Backend busca: nome, endereço, fotos, comodidades, latitude/longitude, categoria, etc.'
});

etapaTitulo('3B', 'Listar apartamentos disponíveis', 'Quando cliente abre o detalhe do hotel');
reqBox({
  lado:'front', method:'POST',
  url:'/api/lp/info-apartment',
  headers:[{k:'Content-Type',v:'application/json'},{k:'Cookie',v:'lp_token=...'}],
  body:'{\n  "hotel_id": 9662,\n  "start_date": "2026-10-20",\n  "end_date": "2026-10-25",\n  "adults": 2,\n  "children": 0,\n  "children_age": 0\n}',
  descricao:'Frontend pede a lista de apartamentos disponíveis com preços e descrição.'
});
reqBox({
  lado:'back', method:'POST',
  url:'https://apiprod.coobmais.com.br/unico/api/Book/InfoApartment',
  headers:[{k:'Authorization',v:'Bearer <JWT Coobmais>'},{k:'Content-Type',v:'application/json'}],
  body:'{ "hotel_id": 9662, "start_date": "2026-10-20", "end_date": "2026-10-25",\n  "adults": 2, "children": 0, "children_age": 0 }',
  descricao:'Coobmais devolve cada apartamento com seu booking_code (token temporário usado nas próximas etapas).'
});

// ===================== ETAPA 4: DISPONIBILIDADE =====================
tituloSecao('Etapa 4 — Verificação de Disponibilidade');

etapaTitulo('4A', 'Cliente escolhe um apartamento', 'Sistema valida com a Coobmais antes de cobrar');
reqBox({
  lado:'front', method:'POST',
  url:'/api/lp/availability-book',
  headers:[{k:'Content-Type',v:'application/json'},{k:'Cookie',v:'lp_token=...'}],
  body:'{\n  "booking_code": "37D099A8-A919-48D1-A574-0AFEA5388A73",\n  "hotel_id": 9662\n}',
  descricao:'Frontend manda só o booking_code do apartamento escolhido e o hotel_id. Backend cuida do resto.'
});

reqBox({
  lado:'back', method:'GET',
  url:'https://apiprod.coobmais.com.br/unico/api/Associate/GetAssociate?cpfCnpj=1573933000130&empCode=38',
  headers:[{k:'Authorization',v:'Bearer <JWT Coobmais>'}],
  descricao:'Backend descobre o AssNic (vfb_identifier) do CNPJ institucional ÚNICO usado para todas as reservas.'
});

reqBox({
  lado:'back', method:'POST',
  url:'https://apiprod.coobmais.com.br/unico/api/Book/AvailabilityBook',
  headers:[{k:'Authorization',v:'Bearer <JWT Coobmais>'},{k:'Content-Type',v:'application/json'}],
  body:'{\n  "token": "37D099A8-A919-48D1-A574-0AFEA5388A73",\n  "cpf": "1573933000130",\n  "hotel_id": 9662,\n  "vfb_points": 0,\n  "vfb_identifier": "<AssNic do CNPJ>"\n}',
  descricao:'Backend valida disponibilidade. Note: cpf é SEMPRE o CNPJ institucional, nunca o do cliente final.'
});

// ===================== ETAPA 5: CONFIRMAÇÃO =====================
tituloSecao('Etapa 5 — Confirmação da Reserva');

etapaTitulo('5A', 'Cliente confirma reserva', 'Coobmais gera o localizador oficial');
reqBox({
  lado:'front', method:'POST',
  url:'/api/lp/booking-confirmation',
  headers:[{k:'Content-Type',v:'application/json'},{k:'Cookie',v:'lp_token=...'}],
  body:'{\n  "booking_code": "37D099A8-A919-48D1-A574-0AFEA5388A73",\n  "hotel_id": 9662\n}',
  descricao:'Mesmo body da disponibilidade. Resposta volta com o localizador (código oficial da reserva).'
});

reqBox({
  lado:'back', method:'POST',
  url:'https://apiprod.coobmais.com.br/unico/api/Book/BookingConfirmation',
  headers:[{k:'Authorization',v:'Bearer <JWT Coobmais>'},{k:'Content-Type',v:'application/json'}],
  body:'{\n  "token": "37D099A8-A919-48D1-A574-0AFEA5388A73",\n  "cpf": "1573933000130",\n  "hotel_id": 9662,\n  "vfb_points": 0,\n  "vfb_identifier": "<AssNic do CNPJ>"\n}',
  descricao:'EXATAMENTE o mesmo body do AvailabilityBook. Diferença é só a URL. A Coobmais responde { localizador: "ABC123", ... }.'
});

// ===================== ETAPA 6: PERSISTÊNCIA =====================
tituloSecao('Etapa 6 — Persistência da Reserva no Banco Local');

etapaTitulo('6A', 'Salvar reserva no banco', 'Frontend manda os dados completos para histórico');
reqBox({
  lado:'front', method:'POST',
  url:'/api/lp/bookings',
  headers:[{k:'Content-Type',v:'application/json'},{k:'Cookie',v:'lp_token=...'}],
  body:'{\n  "hotel_id": 9662,\n  "hotel_name": "Hotel Exemplo",\n  "hotel_city": "Sao Paulo",\n  "hotel_state": "SP",\n  "hotel_image": "https://...",\n  "apartment_type": "Standard",\n  "apartment_description": "Cama de casal, ar-cond.",\n  "booking_code": "37D099A8-...",\n  "localizador": "ABC123",\n  "check_in": "2026-10-20",\n  "check_out": "2026-10-25",\n  "adults": 2,\n  "children": 0,\n  "total_price": 850.00\n}',
  descricao:'Backend grava na tabela bookings, vincula ao usuário logado e dispara WhatsApp booking_confirmed automaticamente.'
});

// ===================== ETAPA 7: PAGAMENTO =====================
tituloSecao('Etapa 7 — Geração da Cobrança (Vindi)');

paragrafo('Aqui o frontend faz UMA chamada ao backend, mas o backend faz INTERNAMENTE até 4 chamadas na Vindi.', {bold:true});

etapaTitulo('7A', 'Frontend solicita criação da cobrança', 'PIX ou Cartão de Crédito');
reqBox({
  lado:'front', method:'POST',
  url:'/api/vindi/create-bill',
  headers:[{k:'Content-Type',v:'application/json'},{k:'Cookie',v:'lp_token=...'}],
  body:'{\n  "payment_method_code": "pix",\n  "customer_name": "Joao da Silva",\n  "customer_email": "joao@email.com",\n  "customer_cpf": "12345678900",\n  "customer_phone": "11999998888",\n  "amount": 850.00,\n  "installments": 1,\n  "booking_locator": "ABC123",\n  "hotel_name": "Hotel Exemplo"\n  /* Se for cartao, adicionar: */\n  /* "card_number", "card_expiration", "card_cvv", */\n  /* "card_holder_name", "card_company_code" */\n}',
  descricao:'Esta é a única chamada que o frontend faz para gerar a cobrança. Tudo abaixo é o que o BACKEND faz internamente.'
});

etapaTitulo('7B', 'Backend garante o produto Vindi', 'Validação 1 de 4');
reqBox({
  lado:'back', method:'GET',
  url:'https://app.vindi.com.br/api/v1/products/1980987',
  headers:[{k:'Authorization',v:'Basic <base64(API_KEY:)>'}],
  descricao:'Confirma se o produto fixo "PROJETO UNYCO" (id 1980987) existe e está ativo. Se falhar, faz fallback procurando code:HOSP_UNYCO.'
});

etapaTitulo('7C', 'Backend garante o customer Vindi', 'Validação 2 de 4');
reqBox({
  lado:'back', method:'GET',
  url:'https://app.vindi.com.br/api/v1/customers?query=registry_code:12345678900',
  headers:[{k:'Authorization',v:'Basic <base64(API_KEY:)>'}],
  descricao:'Procura cliente Vindi pelo CPF. Se já existir ATIVO, reusa. Se inativo, reativa. Se não existir, cria (próxima caixa).'
});
reqBox({
  lado:'back', method:'POST',
  url:'https://app.vindi.com.br/api/v1/customers',
  headers:[{k:'Authorization',v:'Basic <base64(API_KEY:)>'},{k:'Content-Type',v:'application/json'}],
  body:'{\n  "name": "Joao da Silva",\n  "email": "joao@email.com",\n  "registry_code": "12345678900",\n  "metadata": { "source": "unyco_lp" },\n  "phones": [{ "phone_type": "mobile", "number": "5511999998888" }]\n}',
  descricao:'Só executa se o cliente NÃO existir na Vindi. Retorna customer.id que vai na fatura.'
});

etapaTitulo('7D', 'Backend tokeniza o cartão (somente cartão)', 'Validação 3 de 4 — pulada para PIX');
reqBox({
  lado:'back', method:'POST',
  url:'https://app.vindi.com.br/api/v1/payment_profiles',
  headers:[{k:'Authorization',v:'Basic <base64(API_KEY:)>'},{k:'Content-Type',v:'application/json'}],
  body:'{\n  "holder_name": "JOAO DA SILVA",\n  "registry_code": "12345678900",\n  "card_number": "4111111111111111",\n  "card_expiration": "12/2028",\n  "card_cvv": "123",\n  "customer_id": 12345,\n  "payment_method_code": "credit_card",\n  "payment_company_code": "visa"\n}',
  descricao:'Tokeniza o cartão (a Vindi nunca aceita dados crus em /bills). Retorna payment_profile.id que vai na fatura. Para PIX esta etapa não acontece.'
});

etapaTitulo('7E', 'Backend cria a fatura', 'Validação 4 de 4 — núcleo da cobrança');
reqBox({
  lado:'back', method:'POST',
  url:'https://app.vindi.com.br/api/v1/bills',
  headers:[{k:'Authorization',v:'Basic <base64(API_KEY:)>'},{k:'Content-Type',v:'application/json'}],
  body:'{\n  "customer_id": 12345,\n  "payment_method_code": "pix",\n  "bill_items": [\n    { "product_id": 1980987, "amount": 850.00 }\n  ],\n  "installments": 1,\n  "metadata": {\n    "booking_locator": "ABC123",\n    "hotel_name": "Hotel Exemplo"\n  }\n  /* Cartao adiciona: */\n  /* "payment_profile": { "id": 67890 } */\n}',
  descricao:'Cria a fatura com TUDO resolvido nas etapas anteriores. Resposta inclui o status, o QR Code (se PIX) e o print_url.'
});

etapaTitulo('7F', 'Backend persiste no banco e responde', 'Resposta consolidada');
paragrafo('Após todas as chamadas Vindi, o backend faz UM INSERT na tabela payments com vindi_bill_id, vindi_charge_id, vindi_customer_id, status normalizado (paid/pending/canceled) e metadata. Aí responde ao frontend:', {size:9.5});
reqBox({
  lado:'front', method:'POST',
  url:'/api/vindi/create-bill — RESPOSTA',
  body:'{\n  "ok": true,\n  "data": {\n    "bill_id": 9876543,\n    "charge_id": 123456,\n    "charge_status": "pending",\n    "amount": "850.00",\n    "status": "pending",\n    "payment_method": "pix",\n    "pix": {\n      "qrcode_path": "https://...png",\n      "qrcode_original_path": "00020126...6304ABCD",\n      "max_days_to_keep_waiting_payment": 1\n    }\n  }\n}',
  descricao:'Frontend recebe tudo pronto: o bill_id (para polling), o QR Code (imagem + Pix Copia e Cola para PIX), e o status inicial.'
});

// ===================== ETAPA 8: POLLING =====================
tituloSecao('Etapa 8 — Acompanhamento do Pagamento');

paragrafo('CARTÃO: a resposta de /api/vindi/create-bill já volta com status = paid (ou erro). Não tem polling.', {bold:true});
paragrafo('PIX: a resposta inicial volta com status = pending. O frontend então faz polling a cada 5 segundos até detectar paid.', {bold:true});

etapaTitulo('8A', 'Polling do PIX (a cada 5 segundos)', 'Frontend pergunta "já pagou?"');
reqBox({
  lado:'front', method:'GET',
  url:'/api/vindi/bill/9876543',
  headers:[{k:'Cookie',v:'lp_token=...'}],
  descricao:'Frontend pergunta o status atual da fatura. Quando vier "paid", para o polling, atualiza UI e libera tela de sucesso.'
});

reqBox({
  lado:'back', method:'GET',
  url:'https://app.vindi.com.br/api/v1/bills/9876543',
  headers:[{k:'Authorization',v:'Basic <base64(API_KEY:)>'}],
  descricao:'Backend consulta a Vindi e retorna o estado atualizado da fatura. Status normalizado para paid/pending/canceled.'
});

// ===================== ETAPA 9: VINCULAÇÃO =====================
tituloSecao('Etapa 9 — Vinculação Final Pagamento ↔ Reserva');

etapaTitulo('9A', 'Amarrar pagamento à reserva', 'Para que listagem mostre status correto');
reqBox({
  lado:'front', method:'PATCH',
  url:'/api/lp/bookings/ABC123/link-payment',
  headers:[{k:'Content-Type',v:'application/json'},{k:'Cookie',v:'lp_token=...'}],
  body:'{ "bill_id": 9876543 }',
  descricao:'Atualiza payments.booking_locator e bookings.payment_id para que a listagem "Minhas Reservas" mostre o status do pagamento ao lado de cada reserva.'
});

// ===================== RESUMO =====================
tituloSecao('Resumo Visual');

paragrafo('Sequência simplificada de TODAS as chamadas (na ordem):', {bold:true});
cursorY += 2;

const seq = [
  ['F→B','POST /api/lp/register OU /api/lp/login','Cadastro ou login'],
  ['F→B','GET /api/lp/session','Validação de sessão'],
  ['F→B','POST /api/lp/cities','Autocomplete de cidades'],
  ['B→C','POST /Book/GetCities','Coobmais'],
  ['F→B','POST /api/lp/hotels','Busca de hotéis'],
  ['B→C','POST /Book/GetHotels + GET /Book/InfoHotels','Coobmais'],
  ['F→B','GET /api/lp/hotel-info','Detalhes do hotel'],
  ['B→C','GET /Book/InfoHotels','Coobmais'],
  ['F→B','POST /api/lp/info-apartment','Lista apartamentos'],
  ['B→C','POST /Book/InfoApartment','Coobmais'],
  ['F→B','POST /api/lp/availability-book','Verifica disponibilidade'],
  ['B→C','GET /Associate/GetAssociate + POST /Book/AvailabilityBook','Coobmais'],
  ['F→B','POST /api/lp/booking-confirmation','Confirma reserva'],
  ['B→C','GET /Associate/GetAssociate + POST /Book/BookingConfirmation','Coobmais'],
  ['F→B','POST /api/lp/bookings','Persiste reserva no banco'],
  ['F→B','POST /api/vindi/create-bill','Cria cobrança'],
  ['B→V','GET /products/:id','Vindi - garante produto'],
  ['B→V','GET /customers?query=registry_code: + POST /customers','Vindi - garante cliente'],
  ['B→V','POST /payment_profiles','Vindi - tokeniza cartão (só cartão)'],
  ['B→V','POST /bills','Vindi - cria fatura'],
  ['F→B','GET /api/vindi/bill/:id (loop 5s)','Polling PIX'],
  ['B→V','GET /bills/:id','Vindi - status da fatura'],
  ['F→B','PATCH /api/lp/bookings/:loc/link-payment','Vincula pagamento à reserva'],
];

doc.setFontSize(8.5);
for (const [tipo, url, desc] of seq){
  check(7);
  const corTipo = tipo === 'F→B' ? COR_POST : (tipo === 'B→V' ? '#B45309' : COR_GET);
  setFill(corTipo); doc.roundedRect(MARGEM, cursorY-3.5, 12, 5, 0.6, 0.6, 'F');
  setText(COR_BRANCO); doc.setFont('helvetica','bold'); doc.setFontSize(7);
  doc.text(tipo, MARGEM+6, cursorY-0.3, {align:'center'});

  setText(COR_AZUL_ESCURO); doc.setFont('courier','normal'); doc.setFontSize(8);
  const urlClipped = doc.splitTextToSize(url, 110)[0];
  doc.text(urlClipped, MARGEM+15, cursorY);

  setText(COR_CINZA); doc.setFont('helvetica','italic'); doc.setFontSize(8);
  doc.text(desc, PAGE_W-MARGEM-2, cursorY, {align:'right'});

  cursorY += 6.5;
}

cursorY += 4;
paragrafo('Legenda:', {bold:true, size:9});
paragrafo('F→B = Frontend chama Backend  |  B→C = Backend chama Coobmais  |  B→V = Backend chama Vindi', {size:9, color:COR_CINZA});

const out = path.resolve('entrega/UNYCO-CRM-Fluxo-Requisicoes.pdf');
fs.mkdirSync(path.dirname(out), { recursive: true });
doc.save(out);
console.log('PDF gerado:', out, '·', fs.statSync(out).size, 'bytes');
