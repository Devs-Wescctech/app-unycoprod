import PptxGenJS from 'pptxgenjs';
import fs from 'node:fs';
import path from 'node:path';

const AZUL_ESCURO = '2E6299';
const AZUL_CLARO = '4DA3FF';
const BRANCO = 'FFFFFF';
const TEXTO = '1F2937';
const CINZA = '6B7280';
const FUNDO_SUAVE = 'F3F6FB';

const FONT_DISPLAY = 'Calibri';
const FONT_BODY = 'Calibri';

const pres = new PptxGenJS();
pres.layout = 'LAYOUT_WIDE'; // 13.333 x 7.5 in (16:9)
pres.title = 'UNYCO CRM — Apresentação';
pres.company = 'UNYCO';
pres.author = 'WESCCTECH';

const W = 13.333;
const H = 7.5;

function header(s) {
  s.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: W, h: 0.45, fill: { color: AZUL_ESCURO }, line: { type: 'none' } });
  s.addText('UNYCO', { x: 0.5, y: 0.05, w: 3, h: 0.35, fontFace: FONT_DISPLAY, fontSize: 12, bold: true, color: BRANCO, valign: 'middle' });
  s.addText('CRM · Documento de Apresentação', { x: W - 5.5, y: 0.05, w: 5, h: 0.35, fontFace: FONT_BODY, fontSize: 10, color: BRANCO, align: 'right', valign: 'middle' });
}
function rodape(s, num) {
  s.addShape(pres.ShapeType.line, { x: 0.5, y: H - 0.45, w: W - 1, h: 0, line: { color: 'E5E7EB', width: 0.5 } });
  s.addText('unycoclub.com.br', { x: 0.5, y: H - 0.4, w: 5, h: 0.3, fontFace: FONT_BODY, fontSize: 9, color: CINZA, valign: 'middle' });
  s.addText(`${num}`, { x: W - 1.5, y: H - 0.4, w: 1, h: 0.3, fontFace: FONT_BODY, fontSize: 9, color: CINZA, align: 'right', valign: 'middle' });
}
function tituloSlide(s, texto) {
  s.addShape(pres.ShapeType.rect, { x: 0.5, y: 0.85, w: 0.12, h: 0.6, fill: { color: AZUL_CLARO }, line: { type: 'none' } });
  s.addText(texto, { x: 0.75, y: 0.8, w: W - 1.5, h: 0.7, fontFace: FONT_DISPLAY, fontSize: 32, bold: true, color: AZUL_ESCURO });
}

// =====================================================
// SLIDE 1 — CAPA
// =====================================================
{
  const s = pres.addSlide();
  // Fundo gradiente azul
  s.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: W, h: H, fill: { color: AZUL_ESCURO }, line: { type: 'none' } });
  // Faixa azul claro decorativa
  s.addShape(pres.ShapeType.rect, { x: 0, y: H - 1.4, w: W, h: 1.4, fill: { color: AZUL_CLARO }, line: { type: 'none' } });
  s.addShape(pres.ShapeType.rect, { x: 0, y: H - 1.42, w: W, h: 0.04, fill: { color: AZUL_ESCURO }, line: { type: 'none' } });

  // Logo UNYCO grande
  s.addText('UNYCO', { x: 0.7, y: 1.2, w: 8, h: 1.8, fontFace: FONT_DISPLAY, fontSize: 110, bold: true, color: BRANCO, charSpacing: -2 });
  s.addText('CRM · Plataforma de Gestão e Reservas', { x: 0.75, y: 2.95, w: 10, h: 0.4, fontFace: FONT_BODY, fontSize: 14, color: BRANCO });

  // Linha decorativa
  s.addShape(pres.ShapeType.rect, { x: 0.75, y: 4.0, w: 0.6, h: 0.05, fill: { color: AZUL_CLARO }, line: { type: 'none' } });

  s.addText('Apresentação Executiva', { x: 0.7, y: 4.2, w: 11, h: 0.8, fontFace: FONT_DISPLAY, fontSize: 38, bold: true, color: BRANCO });
  s.addText('Arquitetura, Módulos e Integrações', { x: 0.75, y: 5.0, w: 11, h: 0.5, fontFace: FONT_BODY, fontSize: 18, color: BRANCO });

  const hoje = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  s.addText('PROJETO', { x: 0.75, y: H - 1.05, w: 2, h: 0.25, fontFace: FONT_BODY, fontSize: 10, bold: true, color: BRANCO });
  s.addText('UNYCO CRM', { x: 0.75, y: H - 0.78, w: 3, h: 0.3, fontFace: FONT_BODY, fontSize: 12, color: BRANCO });

  s.addText('CLIENTE', { x: 4.5, y: H - 1.05, w: 2, h: 0.25, fontFace: FONT_BODY, fontSize: 10, bold: true, color: BRANCO });
  s.addText('UNYCO', { x: 4.5, y: H - 0.78, w: 3, h: 0.3, fontFace: FONT_BODY, fontSize: 12, color: BRANCO });

  s.addText('FORNECEDOR', { x: 7.5, y: H - 1.05, w: 2.5, h: 0.25, fontFace: FONT_BODY, fontSize: 10, bold: true, color: BRANCO });
  s.addText('WESCCTECH', { x: 7.5, y: H - 0.78, w: 3, h: 0.3, fontFace: FONT_BODY, fontSize: 12, color: BRANCO });

  s.addText('DATA', { x: 11, y: H - 1.05, w: 2, h: 0.25, fontFace: FONT_BODY, fontSize: 10, bold: true, color: BRANCO });
  s.addText(hoje, { x: 11, y: H - 0.78, w: 2.2, h: 0.3, fontFace: FONT_BODY, fontSize: 12, color: BRANCO });
}

// =====================================================
// SLIDE 2 — O QUE É O UNYCO CRM
// =====================================================
{
  const s = pres.addSlide();
  header(s);
  tituloSlide(s, 'O que é o UNYCO CRM');

  s.addText(
    'Plataforma fullstack que une back-office de gestão, landing page de reservas e integrações operacionais em um só sistema.',
    { x: 0.75, y: 1.7, w: W - 1.5, h: 0.6, fontFace: FONT_BODY, fontSize: 16, color: TEXTO }
  );

  // 3 cards
  const cards = [
    { titulo: 'Landing Page', texto: 'Site público de busca de hotéis, reservas e pagamentos por Cartão e PIX.' },
    { titulo: 'CRM', texto: 'Back-office para gestão de cadastros, planos, reservas, sincronização e usuários.' },
    { titulo: 'Integrações', texto: 'TOTVS, Coobmais, Vindi, WhatsApp e ViaCEP centralizadas em um único backend.' },
  ];
  const cw = (W - 1.5 - 0.6) / 3;
  cards.forEach((c, i) => {
    const x = 0.75 + i * (cw + 0.3);
    const y = 2.8;
    s.addShape(pres.ShapeType.rect, { x, y, w: cw, h: 3.5, fill: { color: FUNDO_SUAVE }, line: { type: 'none' } });
    s.addShape(pres.ShapeType.rect, { x, y, w: 0.08, h: 3.5, fill: { color: AZUL_CLARO }, line: { type: 'none' } });
    s.addText(c.titulo, { x: x + 0.3, y: y + 0.3, w: cw - 0.4, h: 0.5, fontFace: FONT_DISPLAY, fontSize: 22, bold: true, color: AZUL_ESCURO });
    s.addText(c.texto, { x: x + 0.3, y: y + 1.1, w: cw - 0.4, h: 2.2, fontFace: FONT_BODY, fontSize: 14, color: TEXTO });
  });

  rodape(s, 2);
}

// =====================================================
// SLIDE 3 — ARQUITETURA EM 3 CAMADAS
// =====================================================
{
  const s = pres.addSlide();
  header(s);
  tituloSlide(s, 'Arquitetura em 3 camadas');

  s.addText('SPA React + API Express + PostgreSQL, tudo empacotado em uma única imagem Docker.', {
    x: 0.75, y: 1.7, w: W - 1.5, h: 0.5, fontFace: FONT_BODY, fontSize: 15, color: CINZA,
  });

  // 3 caixas em pilha (camadas)
  const camadas = [
    { titulo: 'Frontend', sub: 'React 18 · Vite · Tailwind · Radix UI · React Query' },
    { titulo: 'Backend', sub: 'Node.js 20 · Express · pg Pool · proxies de integração' },
    { titulo: 'Persistência', sub: 'PostgreSQL no host · system_config · season_config · category_rates' },
  ];
  camadas.forEach((c, i) => {
    const y = 2.6 + i * 1.3;
    s.addShape(pres.ShapeType.rect, { x: 0.75, y, w: W - 1.5, h: 1.1, fill: { color: i === 0 ? AZUL_ESCURO : (i === 1 ? AZUL_CLARO : FUNDO_SUAVE) }, line: { type: 'none' } });
    s.addText(c.titulo, { x: 1.0, y: y + 0.2, w: 4, h: 0.5, fontFace: FONT_DISPLAY, fontSize: 22, bold: true, color: i === 2 ? AZUL_ESCURO : BRANCO });
    s.addText(c.sub, { x: 1.0, y: y + 0.65, w: W - 2, h: 0.35, fontFace: FONT_BODY, fontSize: 13, color: i === 2 ? TEXTO : BRANCO });
  });

  rodape(s, 3);
}

// =====================================================
// SLIDE 4 — STACK TECNOLÓGICA
// =====================================================
{
  const s = pres.addSlide();
  header(s);
  tituloSlide(s, 'Stack tecnológica');

  // 2 colunas
  s.addText('Frontend', { x: 0.75, y: 1.8, w: 5, h: 0.5, fontFace: FONT_DISPLAY, fontSize: 22, bold: true, color: AZUL_ESCURO });
  s.addShape(pres.ShapeType.rect, { x: 0.75, y: 2.35, w: 1.5, h: 0.04, fill: { color: AZUL_CLARO }, line: { type: 'none' } });
  const front = [
    'React 18 + Vite',
    'Tailwind CSS + Radix UI',
    'React Router DOM',
    'TanStack React Query',
    'React Hook Form + Zod',
    'Recharts (gráficos)',
    'jsPDF · xlsx · html2canvas (export)',
  ];
  s.addText(
    front.map(t => ({ text: t, options: { bullet: { code: '25CF' }, color: TEXTO, fontFace: FONT_BODY, fontSize: 14 } })),
    { x: 0.75, y: 2.55, w: 5.5, h: 4 }
  );

  s.addText('Backend e infra', { x: 7.0, y: 1.8, w: 5, h: 0.5, fontFace: FONT_DISPLAY, fontSize: 22, bold: true, color: AZUL_ESCURO });
  s.addShape(pres.ShapeType.rect, { x: 7.0, y: 2.35, w: 1.5, h: 0.04, fill: { color: AZUL_CLARO }, line: { type: 'none' } });
  const back = [
    'Node.js 20 + Express',
    'PostgreSQL (driver pg)',
    'Auto-init de tabelas',
    'Health check em /api/health',
    'Docker (Alpine multi-stage)',
    'GitHub Actions + GHCR',
    'docker compose · porta 5100',
  ];
  s.addText(
    back.map(t => ({ text: t, options: { bullet: { code: '25CF' }, color: TEXTO, fontFace: FONT_BODY, fontSize: 14 } })),
    { x: 7.0, y: 2.55, w: 5.5, h: 4 }
  );

  rodape(s, 4);
}

// =====================================================
// SLIDE 5 — MÓDULOS DO CRM
// =====================================================
{
  const s = pres.addSlide();
  header(s);
  tituloSlide(s, 'Módulos do CRM');

  s.addText('Back-office completo, com controle de acesso por perfil (Administrador, Gerente, Operador, Visualizador).', {
    x: 0.75, y: 1.7, w: W - 1.5, h: 0.5, fontFace: FONT_BODY, fontSize: 14, color: CINZA,
  });

  const mods = [
    { titulo: 'Dashboard', texto: 'Visão executiva com mapas, gráficos e filtros de período.' },
    { titulo: 'Cadastros', texto: 'Gestão de associados com busca, filtros e exportação.' },
    { titulo: 'Planos', texto: 'Gestão de planos de assinatura (quando ativo).' },
    { titulo: 'Pagamentos', texto: 'Acompanhamento de cobranças e status Vindi.' },
    { titulo: 'Reservas & Receita', texto: 'Mapa interativo com bolhas por estado e modal de detalhes.' },
    { titulo: 'Sincronização', texto: 'Sync com TOTVS com cronômetro, retry e logs persistidos.' },
    { titulo: 'Pesquisa TOTVS', texto: 'Consulta direta ao ERP a partir do CRM.' },
    { titulo: 'Usuários', texto: 'Cadastro e perfis de acesso interno.' },
  ];

  const cw = (W - 1.5 - 0.6) / 4;
  const ch = 1.4;
  mods.forEach((m, i) => {
    const col = i % 4;
    const row = Math.floor(i / 4);
    const x = 0.75 + col * (cw + 0.2);
    const y = 2.5 + row * (ch + 0.2);
    s.addShape(pres.ShapeType.rect, { x, y, w: cw, h: ch, fill: { color: FUNDO_SUAVE }, line: { type: 'none' } });
    s.addShape(pres.ShapeType.rect, { x, y, w: cw, h: 0.06, fill: { color: AZUL_CLARO }, line: { type: 'none' } });
    s.addText(m.titulo, { x: x + 0.2, y: y + 0.18, w: cw - 0.3, h: 0.4, fontFace: FONT_DISPLAY, fontSize: 14, bold: true, color: AZUL_ESCURO });
    s.addText(m.texto, { x: x + 0.2, y: y + 0.6, w: cw - 0.3, h: 0.75, fontFace: FONT_BODY, fontSize: 11, color: TEXTO });
  });

  rodape(s, 5);
}

// =====================================================
// SLIDE 6 — LANDING PAGE
// =====================================================
{
  const s = pres.addSlide();
  header(s);
  tituloSlide(s, 'Landing Page integrada');

  s.addText('Fluxo completo de busca, reserva e pagamento, com a identidade visual UNYCO.', {
    x: 0.75, y: 1.7, w: W - 1.5, h: 0.5, fontFace: FONT_BODY, fontSize: 14, color: CINZA,
  });

  const passos = [
    { n: '1', t: 'Buscar', d: 'Pesquisa por destino, datas e número de hóspedes.' },
    { n: '2', t: 'Escolher', d: 'Hotel e apartamento com tarifa por categoria.' },
    { n: '3', t: 'Revisar', d: 'Resumo da reserva e dados do hóspede.' },
    { n: '4', t: 'Pagar', d: 'Cartão de crédito ou PIX com QR Code e polling automático.' },
    { n: '5', t: 'Confirmar', d: 'Reserva confirmada e disparo automático de WhatsApp.' },
  ];
  const cw = (W - 1.5 - 1.2) / 5;
  passos.forEach((p, i) => {
    const x = 0.75 + i * (cw + 0.3);
    const y = 2.7;
    s.addShape(pres.ShapeType.ellipse, { x: x + cw / 2 - 0.45, y, w: 0.9, h: 0.9, fill: { color: AZUL_ESCURO }, line: { type: 'none' } });
    s.addText(p.n, { x: x + cw / 2 - 0.45, y, w: 0.9, h: 0.9, fontFace: FONT_DISPLAY, fontSize: 28, bold: true, color: BRANCO, align: 'center', valign: 'middle' });
    s.addText(p.t, { x, y: y + 1.1, w: cw, h: 0.4, fontFace: FONT_DISPLAY, fontSize: 16, bold: true, color: AZUL_ESCURO, align: 'center' });
    s.addText(p.d, { x, y: y + 1.55, w: cw, h: 1.6, fontFace: FONT_BODY, fontSize: 11, color: TEXTO, align: 'center' });
  });

  // destaque PIX
  s.addShape(pres.ShapeType.rect, { x: 0.75, y: 6.0, w: W - 1.5, h: 0.9, fill: { color: FUNDO_SUAVE }, line: { type: 'none' } });
  s.addShape(pres.ShapeType.rect, { x: 0.75, y: 6.0, w: 0.08, h: 0.9, fill: { color: AZUL_CLARO }, line: { type: 'none' } });
  s.addText([
    { text: 'PIX em produção: ', options: { bold: true, color: AZUL_ESCURO, fontFace: FONT_DISPLAY, fontSize: 13 } },
    { text: 'QR Code + Pix Copia e Cola, com polling a cada 5s para confirmar pagamento sem intervenção manual.', options: { color: TEXTO, fontFace: FONT_BODY, fontSize: 13 } },
  ], { x: 1.0, y: 6.05, w: W - 2, h: 0.8, valign: 'middle' });

  rodape(s, 6);
}

// =====================================================
// SLIDE 7 — INTEGRAÇÕES
// =====================================================
{
  const s = pres.addSlide();
  header(s);
  tituloSlide(s, 'Integrações externas');

  s.addText('Todas as integrações passam pelo backend como camada de proxy, com tokens configuráveis em runtime.', {
    x: 0.75, y: 1.7, w: W - 1.5, h: 0.5, fontFace: FONT_BODY, fontSize: 14, color: CINZA,
  });

  const ints = [
    { nome: 'TOTVS', desc: 'ERP — sincronização de cadastros com retry e tradução de erros.' },
    { nome: 'Coobmais', desc: 'Associados, hotéis e reservas. Auto-login com cache de JWT.' },
    { nome: 'Vindi', desc: 'Pagamentos em produção: Cartão e PIX (QR Code + polling).' },
    { nome: 'WhatsApp WESCCTECH', desc: 'Mensagens transacionais e fluxos visuais de automação.' },
    { nome: 'ViaCEP', desc: 'Autopreenchimento de endereço a partir do CEP.' },
  ];
  const cw = (W - 1.5 - 0.8) / 5;
  ints.forEach((it, i) => {
    const x = 0.75 + i * (cw + 0.2);
    const y = 2.7;
    s.addShape(pres.ShapeType.rect, { x, y, w: cw, h: 3.5, fill: { color: BRANCO }, line: { color: 'E5E7EB', width: 0.5 } });
    s.addShape(pres.ShapeType.rect, { x, y, w: cw, h: 0.6, fill: { color: AZUL_ESCURO }, line: { type: 'none' } });
    s.addText(it.nome, { x: x + 0.15, y: y + 0.1, w: cw - 0.3, h: 0.4, fontFace: FONT_DISPLAY, fontSize: 15, bold: true, color: BRANCO, valign: 'middle' });
    s.addText(it.desc, { x: x + 0.2, y: y + 0.85, w: cw - 0.4, h: 2.5, fontFace: FONT_BODY, fontSize: 12, color: TEXTO });
  });

  s.addText('Configuração dinâmica via Central de APIs · sem necessidade de redeploy', {
    x: 0.75, y: 6.5, w: W - 1.5, h: 0.4, fontFace: FONT_BODY, fontSize: 12, italic: true, color: AZUL_ESCURO, align: 'center',
  });

  rodape(s, 7);
}

// =====================================================
// SLIDE 8 — WHATSAPP + CENTRAL DE APIs
// =====================================================
{
  const s = pres.addSlide();
  header(s);
  tituloSlide(s, 'WhatsApp + Central de APIs');

  // Coluna 1 — WhatsApp
  s.addText('Automações WhatsApp', { x: 0.75, y: 1.8, w: 5.5, h: 0.5, fontFace: FONT_DISPLAY, fontSize: 22, bold: true, color: AZUL_ESCURO });
  s.addShape(pres.ShapeType.rect, { x: 0.75, y: 2.35, w: 1.5, h: 0.04, fill: { color: AZUL_CLARO }, line: { type: 'none' } });
  const wa = [
    'Construtor visual de fluxos (Trigger → Delay → Message)',
    'Disparo automático em booking_confirmed',
    'Disparo automático em booking_cancelled',
    'Disparo automático em registration_completed',
    'Teste de envio com progresso em tempo real',
    'Logs persistidos para auditoria',
  ];
  s.addText(
    wa.map(t => ({ text: t, options: { bullet: { code: '25CF' }, color: TEXTO, fontFace: FONT_BODY, fontSize: 13 } })),
    { x: 0.75, y: 2.55, w: 5.8, h: 4.2 }
  );

  // Coluna 2 — Central de APIs
  s.addText('Central de APIs', { x: 7.0, y: 1.8, w: 5.5, h: 0.5, fontFace: FONT_DISPLAY, fontSize: 22, bold: true, color: AZUL_ESCURO });
  s.addShape(pres.ShapeType.rect, { x: 7.0, y: 2.35, w: 1.5, h: 0.04, fill: { color: AZUL_CLARO }, line: { type: 'none' } });
  const central = [
    'Status, latência e auto-refresh por API',
    'Teste individual de endpoints',
    'Edição de tokens e URLs em tempo real',
    'Validação obrigatória de HTTPS',
    'Allowlist de domínios e mascaramento de tokens',
    'Geração e regeneração do JWT Coobmais',
  ];
  s.addText(
    central.map(t => ({ text: t, options: { bullet: { code: '25CF' }, color: TEXTO, fontFace: FONT_BODY, fontSize: 13 } })),
    { x: 7.0, y: 2.55, w: 5.8, h: 4.2 }
  );

  rodape(s, 8);
}

// =====================================================
// SLIDE 9 — INFRAESTRUTURA
// =====================================================
{
  const s = pres.addSlide();
  header(s);
  tituloSlide(s, 'Infraestrutura de produção');

  s.addText('Container Docker no servidor WESCCTECH, banco PostgreSQL no host e pipeline automatizado de deploy.', {
    x: 0.75, y: 1.7, w: W - 1.5, h: 0.5, fontFace: FONT_BODY, fontSize: 14, color: CINZA,
  });

  // Tabela de topologia
  const linhas = [
    ['Domínio', 'unycoclub.com.br'],
    ['Servidor', '/var/www/html/app-unycoprod'],
    ['Imagem Docker', 'ghcr.io/devs-wescctech/app-unycoprod:latest'],
    ['Porta', '5100 (host) → 5000 (container)'],
    ['Banco de dados', 'PostgreSQL no host (172.17.0.1:5432) — db unycoprod'],
    ['Healthcheck', 'GET /api/health'],
    ['CI/CD', 'GitHub Actions → GHCR → docker compose pull && up -d'],
  ];

  let yt = 2.6;
  linhas.forEach((row, idx) => {
    s.addShape(pres.ShapeType.rect, { x: 0.75, y: yt, w: W - 1.5, h: 0.55, fill: { color: idx % 2 ? FUNDO_SUAVE : BRANCO }, line: { type: 'none' } });
    s.addText(row[0], { x: 1.0, y: yt + 0.05, w: 3.5, h: 0.45, fontFace: FONT_BODY, fontSize: 13, bold: true, color: AZUL_ESCURO, valign: 'middle' });
    s.addText(row[1], { x: 4.6, y: yt + 0.05, w: 7.7, h: 0.45, fontFace: FONT_BODY, fontSize: 13, color: TEXTO, valign: 'middle' });
    yt += 0.55;
  });

  rodape(s, 9);
}

// =====================================================
// SLIDE 10 — ENCERRAMENTO
// =====================================================
{
  const s = pres.addSlide();
  s.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: W, h: H, fill: { color: AZUL_ESCURO }, line: { type: 'none' } });
  s.addShape(pres.ShapeType.rect, { x: 0, y: H - 1.0, w: W, h: 1.0, fill: { color: AZUL_CLARO }, line: { type: 'none' } });

  s.addText('UNYCO', { x: 0.7, y: 1.5, w: 8, h: 1.5, fontFace: FONT_DISPLAY, fontSize: 90, bold: true, color: BRANCO, charSpacing: -2 });
  s.addShape(pres.ShapeType.rect, { x: 0.75, y: 3.4, w: 0.6, h: 0.05, fill: { color: AZUL_CLARO }, line: { type: 'none' } });

  s.addText('Sistema entregue, operando em produção', { x: 0.75, y: 3.6, w: 11, h: 0.7, fontFace: FONT_DISPLAY, fontSize: 30, bold: true, color: BRANCO });
  s.addText('Atualizações contínuas via pipeline · Monitoramento por Central de APIs · Configuração em runtime sem redeploy.', {
    x: 0.75, y: 4.4, w: 11, h: 1, fontFace: FONT_BODY, fontSize: 16, color: BRANCO,
  });

  s.addText('Produção', { x: 0.75, y: H - 0.9, w: 3, h: 0.3, fontFace: FONT_BODY, fontSize: 11, bold: true, color: BRANCO });
  s.addText('unycoclub.com.br', { x: 0.75, y: H - 0.55, w: 5, h: 0.3, fontFace: FONT_BODY, fontSize: 13, color: BRANCO });

  s.addText('Repositório', { x: 7, y: H - 0.9, w: 3, h: 0.3, fontFace: FONT_BODY, fontSize: 11, bold: true, color: BRANCO });
  s.addText('github.com/Devs-Wescctech/app-unycoprod', { x: 7, y: H - 0.55, w: 6, h: 0.3, fontFace: FONT_BODY, fontSize: 13, color: BRANCO });
}

// =====================================================
// SALVAR
// =====================================================
const out = path.resolve('entrega/UNYCO-CRM-Apresentacao.pptx');
fs.mkdirSync(path.dirname(out), { recursive: true });
await pres.writeFile({ fileName: out });
console.log('PPTX gerado:', out, '·', fs.statSync(out).size, 'bytes');
