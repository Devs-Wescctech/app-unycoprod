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

const PAGE_W = 210;
const PAGE_H = 297;
const MARGEM = 18;
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
  doc.text('UNYCO CRM · Documento Técnico de Entrega', MARGEM, PAGE_H - 9);
  doc.text(`${pagina}`, PAGE_W - MARGEM, PAGE_H - 9, { align: 'right' });
  doc.text('unycoclub.com.br', PAGE_W / 2, PAGE_H - 9, { align: 'center' });
}

function novaPagina() {
  doc.addPage();
  pagina++;
  rodape();
}

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

function tituloSecao(texto, opts = {}) {
  if (opts.novaPagina !== false) {
    novaPagina();
    header(texto);
  }
  let y = 28;
  setFill(COR_AZUL_CLARO);
  doc.rect(MARGEM, y - 4, 4, 9, 'F');
  setText(COR_AZUL_ESCURO);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text(texto, MARGEM + 8, y + 3);
  sumario.push({ titulo: texto, pagina });
  setText(COR_TEXTO);
  return y + 14;
}

function subtitulo(texto, y) {
  setText(COR_AZUL_ESCURO);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(texto, MARGEM, y);
  setDraw(COR_AZUL_CLARO);
  doc.setLineWidth(0.4);
  doc.line(MARGEM, y + 1.5, MARGEM + 30, y + 1.5);
  setText(COR_TEXTO);
  return y + 8;
}

function paragrafo(texto, y, opts = {}) {
  doc.setFont('helvetica', opts.bold ? 'bold' : 'normal');
  doc.setFontSize(opts.size || 10);
  setText(opts.color || COR_TEXTO);
  const linhas = doc.splitTextToSize(texto, opts.largura || LARGURA);
  for (const linha of linhas) {
    if (y > PAGE_H - 20) {
      novaPagina();
      header(opts.headerTitulo || '');
      y = 28;
    }
    doc.text(linha, opts.x || MARGEM, y);
    y += (opts.size || 10) * 0.45 + 1.5;
  }
  return y + 2;
}

function bullet(texto, y, headerTitulo) {
  if (y > PAGE_H - 20) { novaPagina(); header(headerTitulo); y = 28; }
  setFill(COR_AZUL_CLARO);
  doc.circle(MARGEM + 1.5, y - 1.5, 1, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  setText(COR_TEXTO);
  const linhas = doc.splitTextToSize(texto, LARGURA - 6);
  let yy = y;
  for (const l of linhas) {
    if (yy > PAGE_H - 20) { novaPagina(); header(headerTitulo); yy = 28; }
    doc.text(l, MARGEM + 6, yy);
    yy += 5;
  }
  return yy + 1;
}

function bulletLabel(label, valor, y, headerTitulo) {
  if (y > PAGE_H - 20) { novaPagina(); header(headerTitulo); y = 28; }
  setFill(COR_AZUL_CLARO);
  doc.circle(MARGEM + 1.5, y - 1.5, 1, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  setText(COR_AZUL_ESCURO);
  doc.text(label, MARGEM + 6, y);
  const labelW = doc.getTextWidth(label);
  doc.setFont('helvetica', 'normal');
  setText(COR_TEXTO);
  const linhas = doc.splitTextToSize(valor, LARGURA - 6 - labelW - 2);
  doc.text(linhas[0], MARGEM + 6 + labelW + 2, y);
  let yy = y + 5;
  for (let i = 1; i < linhas.length; i++) {
    if (yy > PAGE_H - 20) { novaPagina(); header(headerTitulo); yy = 28; }
    doc.text(linhas[i], MARGEM + 6 + labelW + 2, yy);
    yy += 5;
  }
  return yy + 1;
}

function caixaInfo(titulo, conteudo, y, headerTitulo) {
  const linhas = doc.splitTextToSize(conteudo, LARGURA - 8);
  const altura = 10 + linhas.length * 4.5;
  if (y + altura > PAGE_H - 20) { novaPagina(); header(headerTitulo); y = 28; }
  setFill(COR_FUNDO_SUAVE);
  doc.roundedRect(MARGEM, y, LARGURA, altura, 2, 2, 'F');
  setFill(COR_AZUL_ESCURO);
  doc.rect(MARGEM, y, 1.5, altura, 'F');
  setText(COR_AZUL_ESCURO);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(titulo, MARGEM + 4, y + 5);
  setText(COR_TEXTO);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  let yy = y + 10;
  for (const l of linhas) { doc.text(l, MARGEM + 4, yy); yy += 4.5; }
  return y + altura + 4;
}

function tabela(cabecalho, rows, y, headerTitulo, larguras) {
  const totalW = larguras.reduce((a, b) => a + b, 0);
  const ratio = LARGURA / totalW;
  const cols = larguras.map(w => w * ratio);
  if (y > PAGE_H - 30) { novaPagina(); header(headerTitulo); y = 28; }
  setFill(COR_AZUL_ESCURO);
  doc.rect(MARGEM, y, LARGURA, 7, 'F');
  setText(COR_BRANCO);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  let x = MARGEM;
  for (let i = 0; i < cabecalho.length; i++) {
    doc.text(cabecalho[i], x + 2, y + 4.8);
    x += cols[i];
  }
  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  setText(COR_TEXTO);
  let alt = 0;
  rows.forEach((row, idx) => {
    const linhasPorCol = row.map((c, i) => doc.splitTextToSize(String(c), cols[i] - 4));
    alt = Math.max(...linhasPorCol.map(l => l.length)) * 4.2 + 2;
    if (y + alt > PAGE_H - 20) {
      novaPagina(); header(headerTitulo); y = 28;
      setFill(COR_AZUL_ESCURO);
      doc.rect(MARGEM, y, LARGURA, 7, 'F');
      setText(COR_BRANCO);
      doc.setFont('helvetica', 'bold');
      let xx = MARGEM;
      for (let i = 0; i < cabecalho.length; i++) { doc.text(cabecalho[i], xx + 2, y + 4.8); xx += cols[i]; }
      y += 7;
      doc.setFont('helvetica', 'normal');
      setText(COR_TEXTO);
    }
    if (idx % 2 === 1) { setFill(COR_FUNDO_SUAVE); doc.rect(MARGEM, y, LARGURA, alt, 'F'); setText(COR_TEXTO); }
    let xx = MARGEM;
    for (let i = 0; i < row.length; i++) {
      let yy = y + 4;
      for (const l of linhasPorCol[i]) { doc.text(l, xx + 2, yy); yy += 4.2; }
      xx += cols[i];
    }
    y += alt;
  });
  setDraw(COR_CINZA_CLARO);
  doc.setLineWidth(0.2);
  doc.rect(MARGEM, y - rows.length * (alt || 0) - 7 + 7, LARGURA, 0);
  return y + 4;
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

setText(COR_BRANCO);
doc.setFont('helvetica', 'bold');
doc.setFontSize(28);
doc.text('Documento Técnico', MARGEM, 150);
doc.text('de Entrega', MARGEM, 162);

doc.setFont('helvetica', 'normal');
doc.setFontSize(11);
doc.text('Arquitetura, Stack, Integrações e Infraestrutura', MARGEM, 178);

setText(COR_BRANCO);
doc.setFont('helvetica', 'bold');
doc.setFontSize(10);
doc.text('PROJETO', MARGEM, PAGE_H - 42);
doc.setFont('helvetica', 'normal');
doc.text('UNYCO CRM', MARGEM, PAGE_H - 36);

doc.setFont('helvetica', 'bold');
doc.text('CLIENTE', MARGEM + 60, PAGE_H - 42);
doc.setFont('helvetica', 'normal');
doc.text('UNYCO', MARGEM + 60, PAGE_H - 36);

doc.setFont('helvetica', 'bold');
doc.text('ENTREGA', MARGEM + 110, PAGE_H - 42);
doc.setFont('helvetica', 'normal');
const hoje = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
doc.text(hoje, MARGEM + 110, PAGE_H - 36);

doc.setFont('helvetica', 'bold');
doc.text('FORNECEDOR', MARGEM, PAGE_H - 22);
doc.setFont('helvetica', 'normal');
doc.text('WESCCTECH · unycoclub.com.br', MARGEM, PAGE_H - 16);

// ===================== SUMÁRIO (placeholder, recriado no fim) =====================
const paginasSecoes = {};

// ===================== 1. SUMÁRIO EXECUTIVO =====================
let y = tituloSecao('1. Sumário Executivo');
paginasSecoes['Sumário Executivo'] = pagina;
y = paragrafo(
  'O UNYCO CRM é uma plataforma fullstack de gestão de relacionamento com o cliente desenvolvida sob medida para a UNYCO. O sistema integra um back-office completo de gestão (CRM), uma landing page pública para reservas de hotéis e um conjunto de integrações com sistemas externos críticos do negócio.',
  y, { headerTitulo: '1. Sumário Executivo' }
);
y = paragrafo(
  'Este documento descreve em detalhes a arquitetura, a stack tecnológica, os módulos funcionais, as integrações com sistemas de terceiros, a infraestrutura de produção e o processo de deploy contínuo da aplicação.',
  y, { headerTitulo: '1. Sumário Executivo' }
);
y = subtitulo('Principais entregas', y + 2);
y = bullet('CRM completo com gestão de cadastros, planos, pagamentos, reservas, sincronização e usuários', y, '1. Sumário Executivo');
y = bullet('Landing Page integrada com busca de hotéis, fluxo de reserva e pagamento por Cartão e PIX', y, '1. Sumário Executivo');
y = bullet('Sincronização bidirecional com o sistema TOTVS (ERP) com tratamento de erros traduzidos', y, '1. Sumário Executivo');
y = bullet('Central de APIs com monitoramento, configuração dinâmica e teste de endpoints externos', y, '1. Sumário Executivo');
y = bullet('Automações WhatsApp com construtor visual de fluxos e disparo automático em eventos do sistema', y, '1. Sumário Executivo');
y = bullet('Infraestrutura conteinerizada (Docker) com pipeline CI/CD via GitHub Actions e GHCR', y, '1. Sumário Executivo');

y = subtitulo('Ambiente de produção', y + 4);
y = bulletLabel('URL: ', 'https://unycoclub.com.br', y, '1. Sumário Executivo');
y = bulletLabel('Servidor: ', 'Container Docker em /var/www/html/app-unycoprod', y, '1. Sumário Executivo');
y = bulletLabel('Banco de dados: ', 'PostgreSQL (host), database "unycoprod"', y, '1. Sumário Executivo');
y = bulletLabel('Repositório: ', 'github.com/Devs-Wescctech/app-unycoprod (branch main)', y, '1. Sumário Executivo');
y = bulletLabel('Imagem Docker: ', 'ghcr.io/devs-wescctech/app-unycoprod:latest', y, '1. Sumário Executivo');

// ===================== 2. VISÃO GERAL =====================
y = tituloSecao('2. Visão Geral do Sistema');
paginasSecoes['Visão Geral do Sistema'] = pagina;
y = paragrafo(
  'O UNYCO CRM é organizado em três grandes camadas que compartilham o mesmo backend e banco de dados, mas oferecem experiências distintas conforme o público:',
  y, { headerTitulo: '2. Visão Geral do Sistema' }
);

y = caixaInfo(
  'Landing Page (público externo)',
  'Site público acessível na raiz do domínio. Permite que associados busquem hotéis, façam reservas, paguem com Cartão ou PIX e gerenciem suas reservas. Desenvolvido em React com base nos templates HTML da identidade visual UNYCO.',
  y, '2. Visão Geral do Sistema'
);
y = caixaInfo(
  'CRM (back-office interno)',
  'Painel administrativo acessado em /crm. Permite ao time UNYCO gerenciar cadastros, planos, pagamentos, reservas, sincronização com TOTVS, automações de WhatsApp e configurações do sistema. Possui controle de acesso por perfil (Administrador, Gerente, Operador, Visualizador).',
  y, '2. Visão Geral do Sistema'
);
y = caixaInfo(
  'Backend e integrações',
  'API REST em Node.js/Express que serve frontend e LP, persiste dados em PostgreSQL e atua como camada de integração com sistemas externos: TOTVS (ERP), Coobmais (associados/reservas), Vindi (pagamentos), WESCCTECH WhatsApp e ViaCEP (endereços).',
  y, '2. Visão Geral do Sistema'
);

y = subtitulo('Fluxo principal de uma reserva', y + 2);
y = bullet('Usuário acessa a Landing Page e busca hotéis filtrando por destino e datas', y, '2. Visão Geral do Sistema');
y = bullet('Backend consulta a API Coobmais, aplica tarifas por categoria (Silver/Gold/Diamante) e devolve os hotéis com preço já ajustado', y, '2. Visão Geral do Sistema');
y = bullet('Usuário escolhe apartamento, revisa, confirma e parte para o pagamento', y, '2. Visão Geral do Sistema');
y = bullet('Pagamento via Vindi (Cartão de Crédito ou PIX com QR Code e polling automático)', y, '2. Visão Geral do Sistema');
y = bullet('Reserva confirmada dispara automaticamente o fluxo de WhatsApp configurado para o evento booking_confirmed', y, '2. Visão Geral do Sistema');
y = bullet('Sincronização periódica envia os dados de cadastro ao TOTVS com tratamento e tradução de erros', y, '2. Visão Geral do Sistema');

// ===================== 3. ARQUITETURA =====================
y = tituloSecao('3. Arquitetura');
paginasSecoes['Arquitetura'] = pagina;
y = paragrafo(
  'O sistema adota arquitetura cliente-servidor simples, com frontend SPA em React, backend monolítico em Node.js/Express e banco PostgreSQL. Tudo é empacotado em uma única imagem Docker e servido pelo mesmo processo Node.',
  y, { headerTitulo: '3. Arquitetura' }
);

y = subtitulo('Camadas', y + 2);
y = bulletLabel('Apresentação: ', 'React 18 (Vite) + Tailwind + Radix UI. Componentes modulares inspirados em shadcn/ui. Páginas LP em /lp/*; CRM em /crm/*.', y, '3. Arquitetura');
y = bulletLabel('Aplicação: ', 'Express servindo API REST em /api/*, fallback de SPA para o React, e arquivos estáticos da LP (PHP convertidos para HTML/JSX).', y, '3. Arquitetura');
y = bulletLabel('Persistência: ', 'PostgreSQL acessado via "pg" Pool. Tabelas auto-inicializadas a cada start (tabelas de configuração e tarifas).', y, '3. Arquitetura');
y = bulletLabel('Integrações: ', 'Camada de proxies dentro do mesmo backend. Tokens e URLs configuráveis em runtime via Central de APIs.', y, '3. Arquitetura');
y = bulletLabel('Cron / Sync: ', 'Serviço Node interno com cronômetro configurável e logs persistidos em arquivo (sync-data.json) e tabelas auxiliares.', y, '3. Arquitetura');

y = subtitulo('Estrutura do projeto', y + 4);
y = caixaInfo(
  'Layout do repositório',
  'src/  – Frontend React (componentes, contextos, hooks, páginas, serviços, utils)\n' +
  'server/  – Backend Express (index.js, db.js, sync-data.json, api-config.json)\n' +
  'public/  – Assets estáticos (imagens, CSS) e Landing Pages estáticas (/lp)\n' +
  'scripts/  – DDL do banco, guia de deploy e scripts utilitários\n' +
  '.github/  – Pipeline CI/CD (deploy.yml)\n' +
  'Dockerfile · docker-compose.yml · .env.example',
  y, '3. Arquitetura'
);

y = subtitulo('Rotas principais', y + 2);
y = tabela(
  ['Rota', 'Função', 'Auth'],
  [
    ['/', 'Landing Page (busca de hotéis)', 'Público / cookie LP'],
    ['/home', 'Alias para LP Home', 'Público / cookie LP'],
    ['/lp/index.html', 'Login / cadastro LP', 'Público'],
    ['/lp/checkout.html', 'Checkout LP', 'Público'],
    ['/crm/login', 'Login do CRM', 'Público'],
    ['/crm', 'Dashboard CRM', 'Sessão CRM'],
    ['/crm/Cadastros', 'Gestão de cadastros', 'Sessão CRM'],
    ['/crm/Planos', 'Gestão de planos (quando ativo)', 'Sessão CRM + flag'],
    ['/crm/Sync', 'Sincronização TOTVS', 'Sessão CRM'],
    ['/crm/CentralAPIs', 'Monitoramento de APIs externas', 'Sessão CRM'],
    ['/api/*', 'Endpoints REST (JSON)', 'Conforme endpoint'],
  ],
  y, '3. Arquitetura', [25, 60, 25]
);

// ===================== 4. STACK FRONTEND =====================
y = tituloSecao('4. Stack Frontend');
paginasSecoes['Stack Frontend'] = pagina;
y = paragrafo('A camada frontend é totalmente React 18, empacotada com Vite. O CRM é um SPA, e as Landing Pages combinam React com páginas HTML estáticas onde fazia sentido manter a estrutura legada.', y, { headerTitulo: '4. Stack Frontend' });

y = subtitulo('Bibliotecas principais', y + 2);
y = tabela(
  ['Categoria', 'Biblioteca', 'Uso'],
  [
    ['Build', 'Vite', 'Bundler e dev server'],
    ['UI', 'Tailwind CSS', 'Sistema de design utilitário'],
    ['UI', 'Radix UI / shadcn-style', 'Componentes acessíveis (Drawer, Dialog, etc.)'],
    ['Roteamento', 'React Router DOM', 'Roteamento client-side'],
    ['Dados', 'TanStack React Query', 'Cache e sincronização de dados remotos'],
    ['Formulários', 'React Hook Form + Zod', 'Validação e gestão de formulários'],
    ['Visualização', 'Recharts', 'Gráficos do Dashboard'],
    ['Mapas', 'Mapa SVG do Brasil', 'Distribuição por estado (Dashboard, Reservas)'],
    ['Notificações', 'Sonner', 'Toasts e feedbacks'],
    ['Exportação', 'xlsx, jsPDF, html2canvas', 'CSV, Excel e PDF de relatórios'],
    ['LP estáticas', 'Bootstrap 5.3, FontAwesome, Flatpickr', 'Páginas HTML legadas convertidas'],
  ],
  y, '4. Stack Frontend', [22, 32, 46]
);

y = subtitulo('Páginas do CRM', y + 2);
y = bullet('Login, Dashboard, Cadastros, Planos, Pagamentos, Reservas & Receita', y, '4. Stack Frontend');
y = bullet('Sincronização TOTVS, Pesquisa TOTVS, Usuários, Configurações', y, '4. Stack Frontend');
y = bullet('Automações WhatsApp (com construtor visual de fluxos), Central de APIs', y, '4. Stack Frontend');

y = subtitulo('Funcionalidades transversais', y + 4);
y = bullet('Exportação de qualquer listagem em CSV, Excel e PDF', y, '4. Stack Frontend');
y = bullet('Paginação, busca textual e filtros avançados em todas as listagens', y, '4. Stack Frontend');
y = bullet('Filtro de período personalizado com calendário (Flatpickr)', y, '4. Stack Frontend');
y = bullet('Mapa interativo do Brasil com bolhas por estado, tooltip e modal detalhado', y, '4. Stack Frontend');

// ===================== 5. STACK BACKEND =====================
y = tituloSecao('5. Stack Backend e Banco de Dados');
paginasSecoes['Stack Backend e Banco de Dados'] = pagina;
y = paragrafo('Backend único em Node.js/Express. Toda a lógica de negócio, integrações e sincronização ficam em server/index.js e em módulos auxiliares. O mesmo processo serve a API e os arquivos estáticos do build do frontend.', y, { headerTitulo: '5. Stack Backend e Banco de Dados' });

y = subtitulo('Stack', y + 2);
y = tabela(
  ['Componente', 'Detalhe'],
  [
    ['Runtime', 'Node.js 20 (Alpine no container)'],
    ['Framework HTTP', 'Express'],
    ['Driver DB', 'pg (Pool)'],
    ['Banco de dados', 'PostgreSQL (host, fora do container)'],
    ['Persistência auxiliar', 'JSON em disco para logs de sync e api-config'],
    ['Health check', 'GET /api/health (200 ok ou 503 se DB offline)'],
    ['Auth CRM', 'Login + perfis (Admin, Gerente, Operador, Visualizador) com credenciais em localStorage'],
    ['Auth LP', 'Cookie lp_token gerado após login do associado (Coobmais)'],
  ],
  y, '5. Stack Backend e Banco de Dados', [30, 70]
);

y = subtitulo('Tabelas principais', y + 2);
y = tabela(
  ['Tabela', 'Função'],
  [
    ['system_config', 'Configurações dinâmicas do sistema (plans_enabled, whatsapp_config, etc.)'],
    ['season_config', 'Datas de alta e baixa temporada para cálculo de tarifas'],
    ['category_rates', 'Tarifas por categoria de hotel (Silver, Gold, Diamante)'],
    ['Demais tabelas', 'Dados operacionais do CRM (criadas conforme módulos ativos)'],
  ],
  y, '5. Stack Backend e Banco de Dados', [25, 75]
);

y = paragrafo(
  'O servidor executa initializeDatabase() antes de aceitar tráfego, garantindo que as tabelas críticas existam e que valores padrão estejam presentes. A operação é idempotente (ON CONFLICT DO NOTHING).',
  y, { headerTitulo: '5. Stack Backend e Banco de Dados' }
);

y = caixaInfo(
  'Endpoint de health',
  'GET /api/health responde { status: "ok", timestamp } em 200, ou HTTP 503 se a conexão com o PostgreSQL falhar. Usado pelo healthcheck do Docker para reiniciar o container automaticamente em caso de falha.',
  y, '5. Stack Backend e Banco de Dados'
);

// ===================== 6. INTEGRAÇÕES =====================
y = tituloSecao('6. Integrações Externas');
paginasSecoes['Integrações Externas'] = pagina;
y = paragrafo(
  'Todas as integrações passam pelo backend Node como camada de proxy. Tokens e URLs são configuráveis em runtime via Central de APIs (sem necessidade de redeploy). Configurações são persistidas em server/api-config.json (TOTVS, Coobmais, Vindi) e na tabela system_config (WhatsApp).',
  y, { headerTitulo: '6. Integrações Externas' }
);

y = subtitulo('TOTVS (ERP)', y + 2);
y = bullet('Sincronização de cadastros (CPF, nome, e-mail) com retry automático para erros transitórios', y, '6. Integrações Externas');
y = bullet('Tratamento e tradução de erros TOTVS (EXISTCLI, CGC, Loja Inválida) para mensagens em português', y, '6. Integrações Externas');
y = bullet('Erros permanentes (CPF inválido) não são reentregues; erros genéricos retentados após 1 hora', y, '6. Integrações Externas');
y = bullet('Quando planos estão desativados, sincroniza todos os cadastros com CPF (sem filtro de assinatura)', y, '6. Integrações Externas');

y = subtitulo('Coobmais (associados e hotéis)', y + 2);
y = bullet('Login de associados, listagem de hotéis e gestão de reservas', y, '6. Integrações Externas');
y = bullet('Auto-login via AccessKey + password com geração e cache automático do JWT no backend', y, '6. Integrações Externas');
y = bullet('Refresh automático do token 5 minutos antes do exp', y, '6. Integrações Externas');
y = bullet('UI dedicada na Central de APIs para regenerar token sob demanda', y, '6. Integrações Externas');

y = subtitulo('Vindi (pagamentos)', y + 2);
y = bullet('Ambiente: produção (app.vindi.com.br)', y, '6. Integrações Externas');
y = bullet('Cartão de Crédito: criação de customer, payment_profile e bill', y, '6. Integrações Externas');
y = bullet('PIX: geração de QR Code (imagem + Pix Copia e Cola) e polling a cada 5s para confirmação automática', y, '6. Integrações Externas');
y = bullet('Produto fixo configurável via VINDI_PRODUCT_ID (default 1980987 — "PROJETO UNYCO")', y, '6. Integrações Externas');

y = subtitulo('WESCCTECH WhatsApp', y + 2);
y = bullet('Disparo automático em eventos: booking_confirmed, booking_cancelled, registration_completed', y, '6. Integrações Externas');
y = bullet('Construtor visual de fluxos (Trigger, Delay, Message)', y, '6. Integrações Externas');
y = bullet('Teste manual com progresso em tempo real e logs persistidos', y, '6. Integrações Externas');
y = bullet('Token e URL configuráveis na própria Central de APIs', y, '6. Integrações Externas');

y = subtitulo('ViaCEP', y + 2);
y = bullet('Autopreenchimento de endereços a partir do CEP nos formulários do CRM e da LP', y, '6. Integrações Externas');

// ===================== 7. CENTRAL DE APIs =====================
y = tituloSecao('7. Central de APIs');
paginasSecoes['Central de APIs'] = pagina;
y = paragrafo(
  'A Central de APIs é o painel de monitoramento e controle de todas as integrações externas. Permite ao time UNYCO operar o sistema sem depender da equipe técnica para alterações de configuração.',
  y, { headerTitulo: '7. Central de APIs' }
);

y = subtitulo('Recursos', y + 2);
y = bullet('Cards de status por API (online, offline, latência) com auto-refresh', y, '7. Central de APIs');
y = bullet('Listagem de endpoints monitorados com teste individual', y, '7. Central de APIs');
y = bullet('Edição de tokens e URLs aplicada em tempo real (sem restart)', y, '7. Central de APIs');
y = bullet('Validação obrigatória de HTTPS, allowlist de domínios, mascaramento de tokens nas respostas', y, '7. Central de APIs');
y = bullet('Coobmais: gestão de AccessKey + password + URL de autenticação, com box read-only do JWT, expiração e botão "Regenerar"', y, '7. Central de APIs');

// ===================== 8. AUTOMAÇÕES WHATSAPP =====================
y = tituloSecao('8. Automações WhatsApp');
paginasSecoes['Automações WhatsApp'] = pagina;
y = paragrafo(
  'O módulo de automações permite criar fluxos de mensagens WhatsApp que disparam automaticamente em eventos do sistema, sem necessidade de programação.',
  y, { headerTitulo: '8. Automações WhatsApp' }
);

y = subtitulo('Construtor visual de fluxos (VisualFlowBuilder)', y + 2);
y = bullet('Estilo chatbot, com nodes visuais conectados: Trigger → Delay → Message', y, '8. Automações WhatsApp');
y = bullet('Cada fluxo é vinculado a um evento de gatilho (booking, cadastro, etc.)', y, '8. Automações WhatsApp');
y = bullet('Mensagens podem usar variáveis dinâmicas (nome, hotel, datas, valor, etc.)', y, '8. Automações WhatsApp');

y = subtitulo('Eventos disparados automaticamente', y + 2);
y = bulletLabel('booking_confirmed: ', 'ao salvar uma reserva confirmada', y, '8. Automações WhatsApp');
y = bulletLabel('booking_cancelled: ', 'ao cancelar uma reserva', y, '8. Automações WhatsApp');
y = bulletLabel('registration_completed: ', 'ao finalizar cadastro de associado pela LP', y, '8. Automações WhatsApp');

y = subtitulo('Operacional', y + 4);
y = bullet('Teste de envio com progresso em tempo real e visualização de logs', y, '8. Automações WhatsApp');
y = bullet('Configuração da API WESCCTECH (token e URL) feita pela própria interface', y, '8. Automações WhatsApp');
y = bullet('Persistência da configuração em system_config (key: whatsapp_config)', y, '8. Automações WhatsApp');

// ===================== 9. INFRAESTRUTURA =====================
y = tituloSecao('9. Infraestrutura de Produção');
paginasSecoes['Infraestrutura de Produção'] = pagina;
y = paragrafo(
  'O ambiente de produção roda em um único servidor da WESCCTECH com containerização Docker. O banco PostgreSQL fica no host (fora do container) para garantir isolamento e facilitar backups.',
  y, { headerTitulo: '9. Infraestrutura de Produção' }
);

y = subtitulo('Topologia', y + 2);
y = tabela(
  ['Componente', 'Detalhe'],
  [
    ['Domínio', 'unycoclub.com.br'],
    ['Servidor', 'Diretório /var/www/html/app-unycoprod'],
    ['Container', 'ghcr.io/devs-wescctech/app-unycoprod:latest'],
    ['Porta exposta', '5100 (host) → 5000 (container)'],
    ['Banco de dados', 'PostgreSQL no host, acessado via 172.17.0.1:5432'],
    ['Database', 'unycoprod'],
    ['Healthcheck', 'GET /api/health (configurado no docker-compose)'],
    ['Logs', 'docker logs + arquivos de sync em volume persistente'],
  ],
  y, '9. Infraestrutura de Produção', [30, 70]
);

y = subtitulo('Empacotamento', y + 2);
y = bullet('Dockerfile multi-stage: build do frontend (Vite) + cópia para o estágio de runtime Node 20 Alpine', y, '9. Infraestrutura de Produção');
y = bullet('docker-compose.yml fixa porta 5100 externa, healthcheck e variáveis de ambiente via env_file', y, '9. Infraestrutura de Produção');
y = bullet('Arquivo .env (chmod 600, fora do repositório) carregado em runtime pelo compose', y, '9. Infraestrutura de Produção');

// ===================== 10. DEPLOY E CI/CD =====================
y = tituloSecao('10. Deploy e CI/CD');
paginasSecoes['Deploy e CI/CD'] = pagina;
y = paragrafo(
  'A entrega contínua é totalmente automatizada via GitHub Actions. Toda merge na branch main publica uma nova imagem Docker no GitHub Container Registry, pronta para deploy no servidor.',
  y, { headerTitulo: '10. Deploy e CI/CD' }
);

y = subtitulo('Pipeline (.github/workflows/deploy.yml)', y + 2);
y = bullet('Trigger: push na branch main', y, '10. Deploy e CI/CD');
y = bullet('Build da imagem Docker multi-stage', y, '10. Deploy e CI/CD');
y = bullet('Push para ghcr.io/devs-wescctech/app-unycoprod:latest', y, '10. Deploy e CI/CD');

y = subtitulo('Atualização do servidor', y + 4);
y = caixaInfo(
  'Comando de update no host',
  'cd /var/www/html/app-unycoprod\ndocker compose pull\ndocker compose up -d',
  y, '10. Deploy e CI/CD'
);

y = subtitulo('Variáveis de ambiente (produção)', y + 2);
y = tabela(
  ['Variável', 'Função'],
  [
    ['NODE_ENV', 'production (definido no compose)'],
    ['PORT', '5000 (definido no compose)'],
    ['DATABASE_URL', 'Conexão com o PostgreSQL'],
    ['DB_SSL', 'Flag de SSL para o banco'],
    ['TOTVS_API_TOKEN', 'Autenticação da API TOTVS'],
    ['VINDI_API_KEY', 'Chave de API Vindi'],
    ['WHATSAPP_API_URL / WHATSAPP_API_TOKEN', 'API WESCCTECH WhatsApp'],
    ['COOBMAIS_BASE_URL / AUTH_URL / ACCESS_KEY / PASSWORD', 'API Coobmais'],
  ],
  y, '10. Deploy e CI/CD', [40, 60]
);

// ===================== 11. SEGURANÇA E OPERAÇÃO =====================
y = tituloSecao('11. Segurança e Operação');
paginasSecoes['Segurança e Operação'] = pagina;
y = paragrafo(
  'O sistema adota práticas de segurança alinhadas com a sensibilidade dos dados manipulados (CPF, dados de pagamento, dados de associados).',
  y, { headerTitulo: '11. Segurança e Operação' }
);

y = subtitulo('Práticas adotadas', y + 2);
y = bullet('Tokens de integrações nunca expostos no frontend; sempre proxiados pelo backend', y, '11. Segurança e Operação');
y = bullet('Mascaramento automático de credenciais nos retornos da Central de APIs', y, '11. Segurança e Operação');
y = bullet('Controle de acesso por perfil no CRM (Administrador, Gerente, Operador, Visualizador)', y, '11. Segurança e Operação');
y = bullet('Rotas sensíveis protegidas (ex.: rota Planos com ProtectedRoute fail-closed)', y, '11. Segurança e Operação');
y = bullet('Pagamentos processados pela Vindi; cartões nunca trafegam pelo banco da UNYCO', y, '11. Segurança e Operação');
y = bullet('Validação obrigatória de HTTPS e allowlist de domínios na Central de APIs', y, '11. Segurança e Operação');
y = bullet('Arquivo .env do servidor com chmod 600 e fora do repositório Git', y, '11. Segurança e Operação');

y = subtitulo('Tratamento de erros', y + 2);
y = paragrafo(
  'Sistema centralizado de tradução automática de erros técnicos para mensagens amigáveis em português. Erros TOTVS são processados primeiro (EXISTCLI/Loja Inválido → "já existe", campos em branco → "dados incompletos", CGC → "CPF inválido"). Códigos HTTP 401/403/502/503/504 utilizam word boundary para evitar falsos positivos em mensagens.',
  y, { headerTitulo: '11. Segurança e Operação' }
);

// ===================== 12. PRÓXIMOS PASSOS =====================
y = tituloSecao('12. Suporte, Próximos Passos e Contato');
paginasSecoes['Suporte, Próximos Passos e Contato'] = pagina;

y = subtitulo('Suporte e operação', y);
y = bullet('Monitoramento contínuo via /api/health e healthcheck do Docker', y, '12. Suporte, Próximos Passos e Contato');
y = bullet('Alterações de configuração de integrações realizadas pela própria equipe UNYCO via Central de APIs', y, '12. Suporte, Próximos Passos e Contato');
y = bullet('Atualizações da aplicação publicadas automaticamente via pipeline GitHub Actions', y, '12. Suporte, Próximos Passos e Contato');
y = bullet('Backup do banco PostgreSQL gerenciado no host (fora do container)', y, '12. Suporte, Próximos Passos e Contato');

y = subtitulo('Documentação técnica complementar', y + 4);
y = bullet('README.md no repositório com visão geral, comandos e estrutura', y, '12. Suporte, Próximos Passos e Contato');
y = bullet('scripts/db-schema.sql com o DDL completo do banco', y, '12. Suporte, Próximos Passos e Contato');
y = bullet('scripts/deploy-guide.md com guia passo a passo de deploy', y, '12. Suporte, Próximos Passos e Contato');
y = bullet('.env.example com a lista completa de variáveis de ambiente', y, '12. Suporte, Próximos Passos e Contato');

y = caixaInfo(
  'Contato técnico',
  'WESCCTECH · suporte e desenvolvimento\nRepositório: github.com/Devs-Wescctech/app-unycoprod\nProdução: https://unycoclub.com.br',
  y, '12. Suporte, Próximos Passos e Contato'
);

// ===================== Insere SUMÁRIO logo após a capa =====================
doc.insertPage(2);
pagina = 1; // recompõe contagem (capa = 0, sumário = 1)
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
  'Sumário Executivo',
  'Visão Geral do Sistema',
  'Arquitetura',
  'Stack Frontend',
  'Stack Backend e Banco de Dados',
  'Integrações Externas',
  'Central de APIs',
  'Automações WhatsApp',
  'Infraestrutura de Produção',
  'Deploy e CI/CD',
  'Segurança e Operação',
  'Suporte, Próximos Passos e Contato',
];
ordem.forEach((titulo, idx) => {
  const num = String(idx + 1).padStart(2, '0');
  // por causa do insertPage, todas as páginas das seções aumentaram em 1
  const pg = (paginasSecoes[titulo] || 0) + 1;
  setText(COR_AZUL_ESCURO);
  doc.setFont('helvetica', 'bold');
  doc.text(num, MARGEM, yy);
  setText(COR_TEXTO);
  doc.setFont('helvetica', 'normal');
  doc.text(titulo, MARGEM + 12, yy);
  setText(COR_CINZA);
  doc.setFontSize(9);
  // pontilhado
  const dots = '. '.repeat(70);
  const titW = doc.getTextWidth(titulo);
  setDraw(COR_CINZA_CLARO);
  doc.setLineDashPattern([0.6, 1.2], 0);
  doc.line(MARGEM + 12 + titW + 2, yy - 0.8, PAGE_W - MARGEM - 10, yy - 0.8);
  doc.setLineDashPattern([], 0);
  setText(COR_AZUL_ESCURO);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(String(pg), PAGE_W - MARGEM, yy, { align: 'right' });
  setText(COR_TEXTO);
  doc.setFont('helvetica', 'normal');
  yy += 8;
});

setText(COR_CINZA);
doc.setFont('helvetica', 'italic');
doc.setFontSize(9);
doc.text('Documento confidencial · uso exclusivo da UNYCO e WESCCTECH', MARGEM, PAGE_H - 20);

// rodapé na página de sumário
rodape();

// ===================== SALVAR =====================
const out = path.resolve('entrega/UNYCO-CRM-Documento-Tecnico.pdf');
fs.mkdirSync(path.dirname(out), { recursive: true });
doc.save(out);
console.log('PDF gerado:', out, '·', fs.statSync(out).size, 'bytes');
