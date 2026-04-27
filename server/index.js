import express from 'express';
import https from 'https';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { query } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.get('/', (req, res, next) => {
  const cookies = req.headers.cookie || '';
  const hasLpToken = cookies.split(';').some(c => c.trim().startsWith('lp_token='));
  if (!hasLpToken) {
    return res.sendFile(path.join(__dirname, '../public/lp/index.html'));
  }
  next();
});
app.get('/home', (req, res) => {
  const cookies = req.headers.cookie || '';
  const hasLpToken = cookies.split(';').some(c => c.trim().startsWith('lp_token='));
  if (!hasLpToken) {
    return res.redirect(302, '/');
  }
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});
app.get('/lp/home', (req, res) => res.redirect(302, '/'));
app.get('/lp/home/', (req, res) => res.redirect(302, '/'));
app.use('/lp', express.static(path.join(__dirname, '../public/lp')));

const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
  app.use(express.static(path.join(__dirname, '../dist')));
}

let TOTVS_URL = 'coobrasturviagens179215.protheus.cloudtotvs.com.br';
let TOTVS_PORT = 1806;
let TOTVS_AUTH = process.env.TOTVS_API_TOKEN;

const TOTVS_PATHS = {
  getClient: '/rest/coobClient/getClient',
  insClient: '/rest/coobClient/insClient'
};

const DATA_FILE = path.join(__dirname, 'sync-data.json');
const API_CONFIG_FILE = path.join(__dirname, 'api-config.json');

let apiConfigOverrides = {};
try {
  if (fs.existsSync(API_CONFIG_FILE)) {
    apiConfigOverrides = JSON.parse(fs.readFileSync(API_CONFIG_FILE, 'utf-8'));
    if (apiConfigOverrides.TOTVS?.token) TOTVS_AUTH = apiConfigOverrides.TOTVS.token;
    if (apiConfigOverrides.TOTVS?.baseUrl) {
      try {
        const u = new URL(apiConfigOverrides.TOTVS.baseUrl);
        TOTVS_URL = u.hostname;
        TOTVS_PORT = parseInt(u.port) || 443;
      } catch (_) {}
    }
  }
} catch (e) { apiConfigOverrides = {}; }

let syncService = {
  enabled: true,
  interval: 3600000,
  lastSync: null,
  nextSync: null,
  isRunning: false,
  logs: [],
  syncedUsers: {},
  existingUsers: {},
  errorUsers: {},
  timer: null,
  countdown: 0
};

function loadSyncData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
      syncService.enabled = data.enabled || false;
      syncService.interval = data.interval || 300000;
      syncService.lastSync = data.lastSync || null;
      syncService.logs = (data.logs || []).slice(-100);
      syncService.syncedUsers = data.syncedUsers || {};
      syncService.existingUsers = data.existingUsers || {};
      syncService.errorUsers = data.errorUsers || {};
      console.log('[SYNC SERVICE] Data loaded:', { enabled: syncService.enabled, interval: syncService.interval });
    }
  } catch (error) {
    console.error('[SYNC SERVICE] Error loading data:', error.message);
  }
}

function saveSyncData() {
  try {
    const data = {
      enabled: syncService.enabled,
      interval: syncService.interval,
      lastSync: syncService.lastSync,
      logs: syncService.logs.slice(-100),
      syncedUsers: syncService.syncedUsers,
      existingUsers: syncService.existingUsers,
      errorUsers: syncService.errorUsers
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('[SYNC SERVICE] Error saving data:', error.message);
  }
}

let logCounter = 0;
function addLog(type, message, details = null) {
  const log = {
    id: `${Date.now()}_${logCounter++}`,
    timestamp: new Date().toISOString(),
    type,
    message,
    details
  };
  syncService.logs.push(log);
  if (syncService.logs.length > 100) {
    syncService.logs = syncService.logs.slice(-100);
  }
  saveSyncData();
  console.log(`[SYNC SERVICE] ${type.toUpperCase()}: ${message}`);
}

function isValidCPF(cpf) {
  const cleaned = (cpf || '').replace(/\D/g, '');
  if (cleaned.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleaned)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(cleaned[i]) * (10 - i);
  let remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== parseInt(cleaned[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(cleaned[i]) * (11 - i);
  remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== parseInt(cleaned[10])) return false;
  return true;
}

async function fetchActiveUsersFromDB() {
  const configResult = await query("SELECT value FROM system_config WHERE key = 'plans_enabled'");
  const plansEnabled = configResult.rows.length > 0 ? configResult.rows[0].value : true;

  if (plansEnabled) {
    const result = await query(`
      SELECT
        u.id AS user_id,
        u.name AS user_name,
        u.cpf AS user_cpf,
        u.phone AS user_phone,
        u.email AS user_email,
        u.cep AS user_cep,
        u.address AS user_address,
        u.numero AS user_numero,
        u.bairro AS user_bairro,
        u.cidade AS user_cidade,
        u.estado AS user_estado,
        u.birth_date AS user_birth_date,
        u.created_at AS user_created_at,
        s.id AS subscription_id,
        s.status AS subscription_status,
        s.started_at AS subscription_started_at,
        s.ends_at AS subscription_ends_at,
        p.id AS plan_id,
        p.name AS plan_name,
        p.slug AS plan_slug,
        p.price AS plan_price,
        p.billing_period AS plan_billing_period
      FROM users u
      INNER JOIN subscriptions s ON s.user_id = u.id
      INNER JOIN plans p ON p.id = s.plan_id
      WHERE s.status = 'ativa'
        AND (s.ends_at IS NULL OR s.ends_at > NOW())
      ORDER BY u.id ASC
    `);
    return { rows: result.rows, plansEnabled: true };
  } else {
    const result = await query(`
      SELECT
        u.id AS user_id,
        u.name AS user_name,
        u.cpf AS user_cpf,
        u.phone AS user_phone,
        u.email AS user_email,
        u.cep AS user_cep,
        u.address AS user_address,
        u.numero AS user_numero,
        u.bairro AS user_bairro,
        u.cidade AS user_cidade,
        u.estado AS user_estado,
        u.birth_date AS user_birth_date,
        u.created_at AS user_created_at,
        NULL AS subscription_id,
        'sem_plano' AS subscription_status,
        NULL AS subscription_started_at,
        NULL AS subscription_ends_at,
        NULL AS plan_id,
        NULL AS plan_name,
        NULL AS plan_slug,
        NULL AS plan_price,
        NULL AS plan_billing_period
      FROM users u
      WHERE u.cpf IS NOT NULL AND u.cpf != ''
      ORDER BY u.id ASC
    `);
    return { rows: result.rows, plansEnabled: false };
  }
}

function checkUserExistsInTotvs(cpf) {
  return new Promise((resolve) => {
    const cleanCpf = cpf.replace(/\D/g, '');
    const payload = JSON.stringify({
      A1_CGC: cleanCpf,
      A1_IDPARC: 'WESCC1'
    });

    const options = {
      hostname: TOTVS_URL,
      port: TOTVS_PORT,
      path: TOTVS_PATHS.getClient,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'Authorization': `Basic ${TOTVS_AUTH}`
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(res.statusCode === 200 && parsed && parsed.A1_COD);
        } catch (e) {
          resolve(false);
        }
      });
    });

    req.on('error', () => resolve(false));
    req.write(payload);
    req.end();
  });
}

function syncUserToTotvs(user) {
  return new Promise((resolve, reject) => {
    const cleanCpf = (user.user_cpf || '').replace(/\D/g, '');
    const nameParts = (user.user_name || '').trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    const ddd = (user.user_phone || '').replace(/\D/g, '').substring(0, 2) || '';
    const phone = (user.user_phone || '').replace(/\D/g, '').substring(2) || '';
    const rawBirthDate = user.user_birth_date || '';
    const birthDate = rawBirthDate ? String(rawBirthDate).replace(/-/g, '') : '';

    const fullName = (user.user_name || '').trim();
    const totvData = [{
      A1_CGC: cleanCpf,
      A1_NOME: fullName || firstName,
      A1_NOME2: lastName,
      A1_NREDUZ: fullName.substring(0, 20).toUpperCase(),
      A1_END: (user.user_address || '') + (user.user_numero ? `, ${user.user_numero}` : ''),
      A1_BAIRRO: user.user_bairro || '',
      A1_MUN: user.user_cidade || '',
      A1_EST: user.user_estado || '',
      A1_CEP: (user.user_cep || '').replace(/\D/g, ''),
      A1_DDD: ddd,
      A1_TEL: phone,
      A1_PESSOA: 'F',
      A1_TIPO: 'F',
      A1_PFISICA: 'S',
      A1_PAIS: '105',
      A1_EMAIL: user.user_email || '',
      A1_DTNASC: birthDate,
      A1_IDPARC: 'WESCC1'
    }];

    const payload = JSON.stringify(totvData);

    const options = {
      hostname: TOTVS_URL,
      port: TOTVS_PORT,
      path: TOTVS_PATHS.insClient,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'Authorization': `Basic ${TOTVS_AUTH}`
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`[SYNC SERVICE] TOTVS insClient response (HTTP ${res.statusCode}):`, data.substring(0, 500));
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode === 200 || res.statusCode === 201) {
            resolve({ success: true, data: parsed });
          } else {
            const translated = translateTotvsError(data);
            reject(new Error(`HTTP ${res.statusCode}: ${translated}`));
          }
        } catch (e) {
          const translated = translateTotvsError(data);
          if (res.statusCode === 200 || res.statusCode === 201) {
            resolve({ success: true, data: data });
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${translated || data.substring(0, 200)}`));
          }
        }
      });
    });

    req.on('error', (err) => {
      const translated = translateTotvsError(err.message);
      reject(new Error(translated));
    });
    req.write(payload);
    req.end();
  });
}

async function runSyncCycle() {
  if (syncService.isRunning) {
    console.log('[SYNC SERVICE] Already running, skipping...');
    return;
  }

  syncService.isRunning = true;
  addLog('info', 'Iniciando ciclo de sincronização automática');

  try {
    const fetchResult = await fetchActiveUsersFromDB();
    const activeUsers = fetchResult.rows;
    const plansEnabled = fetchResult.plansEnabled;
    
    const alreadySynced = activeUsers.filter(u => syncService.syncedUsers[u.user_id]).length;
    const alreadyExisting = activeUsers.filter(u => syncService.existingUsers[u.user_id]).length;
    const alreadyErrored = activeUsers.filter(u => syncService.errorUsers[u.user_id]).length;
    const pendingToProcess = activeUsers.filter(u => !syncService.syncedUsers[u.user_id] && !syncService.existingUsers[u.user_id] && !syncService.errorUsers[u.user_id]).length;
    
    addLog('info', `Encontrados ${activeUsers.length} usuários ${plansEnabled ? 'com plano ativo' : 'com CPF cadastrado'}`);
    
    if (alreadySynced > 0 || alreadyExisting > 0 || alreadyErrored > 0) {
      addLog('info', `Status atual: ${alreadySynced} sincronizados, ${alreadyExisting} já existem, ${alreadyErrored} com erro, ${pendingToProcess} pendentes`);
    }
    
    if (pendingToProcess === 0) {
      addLog('success', 'Nenhum usuário novo para sincronizar');
      syncService.lastSync = new Date().toISOString();
      saveSyncData();
      syncService.isRunning = false;
      return;
    }

    let synced = 0;
    let existing = 0;
    let errors = 0;

    for (const user of activeUsers) {
      if (syncService.syncedUsers[user.user_id] || syncService.existingUsers[user.user_id]) {
        continue;
      }

      const prevError = syncService.errorUsers[user.user_id];
      if (prevError) {
        if (prevError.permanent) continue;
        const errorAge = Date.now() - new Date(prevError.errorAt).getTime();
        if (errorAge < 3600000) continue;
        delete syncService.errorUsers[user.user_id];
        addLog('info', `Retentando sincronização de ${user.user_name} (erro anterior: ${prevError.error})`);
      }

      if (!isValidCPF(user.user_cpf)) {
        const cleanCpf = (user.user_cpf || '').replace(/\D/g, '');
        let cpfError = 'CPF inválido';
        if (cleanCpf.length !== 11) cpfError = `CPF inválido (${cleanCpf.length} dígitos, esperado 11)`;
        else if (/^(\d)\1{10}$/.test(cleanCpf)) cpfError = 'CPF inválido (todos os dígitos iguais)';
        else cpfError = 'CPF inválido (dígito verificador incorreto)';
        syncService.errorUsers[user.user_id] = {
          errorAt: new Date().toISOString(),
          name: user.user_name,
          error: cpfError,
          cpf: cleanCpf,
          permanent: true
        };
        addLog('error', `${user.user_name}: ${cpfError} (${cleanCpf || 'vazio'})`);
        errors++;
        continue;
      }

      try {
        const exists = await checkUserExistsInTotvs(user.user_cpf);
        
        if (exists) {
          syncService.existingUsers[user.user_id] = {
            syncedAt: new Date().toISOString(),
            name: user.user_name
          };
          addLog('warning', `${user.user_name} já existe no TOTVS`);
          existing++;
          continue;
        }

        await syncUserToTotvs(user);
        
        syncService.syncedUsers[user.user_id] = {
          syncedAt: new Date().toISOString(),
          name: user.user_name
        };
        addLog('success', `${user.user_name} sincronizado com sucesso`);
        synced++;

        await new Promise(r => setTimeout(r, 500));
        
      } catch (error) {
        const errMsg = error.message || '';
        let friendlyError = '';
        if (errMsg.includes('EXISTCLI') || errMsg.includes('mesmo código e loja') || errMsg.includes('já existe no TOTVS')) {
          syncService.existingUsers[user.user_id] = {
            syncedAt: new Date().toISOString(),
            name: user.user_name
          };
          addLog('warning', `${user.user_name} já existe no TOTVS (detectado na inserção)`);
          existing++;
        } else if (errMsg.includes('CGC') || errMsg.includes('Digito verificador') || errMsg.includes('digito verificador') || errMsg.includes('CPF inválido')) {
          friendlyError = 'CPF rejeitado pelo TOTVS (dígito verificador incorreto)';
          syncService.errorUsers[user.user_id] = {
            errorAt: new Date().toISOString(),
            name: user.user_name,
            error: friendlyError,
            permanent: true
          };
          addLog('error', `${user.user_name}: ${friendlyError}`);
          errors++;
        } else if (/Loja.*Invalido/i.test(errMsg)) {
          friendlyError = 'Erro de configuração TOTVS (Loja inválida)';
          syncService.errorUsers[user.user_id] = {
            errorAt: new Date().toISOString(),
            name: user.user_name,
            error: friendlyError,
            permanent: false
          };
          addLog('error', `${user.user_name}: ${friendlyError}`);
          errors++;
        } else if (/campos obrigat|em branco/i.test(errMsg)) {
          friendlyError = 'Dados incompletos (campos obrigatórios em branco)';
          syncService.errorUsers[user.user_id] = {
            errorAt: new Date().toISOString(),
            name: user.user_name,
            error: friendlyError,
            permanent: false
          };
          addLog('error', `${user.user_name}: ${friendlyError}`);
          errors++;
        } else {
          friendlyError = errMsg.length > 200 ? errMsg.substring(0, 200) + '...' : errMsg;
          syncService.errorUsers[user.user_id] = {
            errorAt: new Date().toISOString(),
            name: user.user_name,
            error: friendlyError,
            permanent: false
          };
          addLog('error', `Erro ao sincronizar ${user.user_name}: ${friendlyError}`);
          errors++;
        }
      }
    }

    syncService.lastSync = new Date().toISOString();
    addLog('info', `Ciclo concluído: ${synced} sincronizados, ${existing} já existiam, ${errors} erros`);
    saveSyncData();

  } catch (error) {
    addLog('error', `Erro no ciclo de sincronização: ${error.message}`);
  } finally {
    syncService.isRunning = false;
  }
}

function startSyncTimer() {
  if (syncService.timer) {
    clearInterval(syncService.timer);
  }

  syncService.countdown = syncService.interval;
  syncService.nextSync = new Date(Date.now() + syncService.interval).toISOString();

  syncService.timer = setInterval(() => {
    syncService.countdown -= 1000;
    
    if (syncService.countdown <= 0) {
      syncService.countdown = syncService.interval;
      syncService.nextSync = new Date(Date.now() + syncService.interval).toISOString();
      if (syncService.enabled) {
        runSyncCycle();
      }
    }
  }, 1000);

  console.log('[SYNC SERVICE] Timer started with interval:', syncService.interval);
}

function stopSyncTimer() {
  if (syncService.timer) {
    clearInterval(syncService.timer);
    syncService.timer = null;
  }
  syncService.countdown = 0;
  syncService.nextSync = null;
  console.log('[SYNC SERVICE] Timer stopped');
}

loadSyncData();
if (syncService.enabled) {
  startSyncTimer();
  addLog('info', 'Serviço de sincronização iniciado automaticamente');
}

// ========== PLANS API ==========

app.get('/api/plans.php', async (req, res) => {
  try {
    const id = req.query.id ? parseInt(req.query.id) : 0;

    if (id > 0) {
      const result = await query('SELECT * FROM plans WHERE id = $1 LIMIT 1', [id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Plano não encontrado' });
      }
      return res.json({ success: true, data: result.rows[0] });
    }

    const result = await query('SELECT * FROM plans ORDER BY id ASC');
    res.json({ success: true, total: result.rows.length, data: result.rows });
  } catch (error) {
    console.error('[PLANS] Error:', error.message);
    res.status(500).json({ success: false, error: 'Erro ao consultar planos', detail: error.message });
  }
});

app.post('/api/plans.php', async (req, res) => {
  const input = req.body;
  const action = input.action;

  if (!action) {
    return res.status(400).json({ success: false, error: 'Ação (action) não informada' });
  }

  try {
    if (action === 'create') {
      const name = (input.name || '').trim();
      const slug = (input.slug || '').trim();
      const price = parseFloat(input.price) || 0;
      const billingPeriod = input.billing_period || 'mensal';
      const description = input.description || null;
      const perks = input.perks || null;
      const active = input.active !== undefined ? parseInt(input.active) : 1;

      if (!name || !slug) {
        return res.status(400).json({ success: false, error: 'Campos obrigatórios: name, slug' });
      }

      const result = await query(
        'INSERT INTO plans (name, slug, price, billing_period, description, perks, active, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) RETURNING id',
        [name, slug, price, billingPeriod, description, perks, active]
      );

      return res.json({ success: true, message: 'Plano criado com sucesso', plan_id: result.rows[0].id });
    }

    if (action === 'update') {
      const planId = parseInt(input.id) || 0;
      if (planId <= 0) {
        return res.status(400).json({ success: false, error: 'Campo id é obrigatório' });
      }

      const fields = [];
      const params = [];
      let paramIndex = 1;

      if (input.name !== undefined) { fields.push(`name = $${paramIndex++}`); params.push((input.name || '').trim()); }
      if (input.slug !== undefined) { fields.push(`slug = $${paramIndex++}`); params.push((input.slug || '').trim()); }
      if (input.price !== undefined) { fields.push(`price = $${paramIndex++}`); params.push(parseFloat(input.price) || 0); }
      if (input.billing_period !== undefined) { fields.push(`billing_period = $${paramIndex++}`); params.push(input.billing_period); }
      if (input.description !== undefined) { fields.push(`description = $${paramIndex++}`); params.push(input.description); }
      if (input.perks !== undefined) { fields.push(`perks = $${paramIndex++}`); params.push(input.perks); }
      if (input.active !== undefined) { fields.push(`active = $${paramIndex++}`); params.push(parseInt(input.active)); }

      if (fields.length === 0) {
        return res.status(400).json({ success: false, error: 'Nenhum campo para atualizar' });
      }

      fields.push(`updated_at = NOW()`);
      params.push(planId);

      await query(`UPDATE plans SET ${fields.join(', ')} WHERE id = $${paramIndex}`, params);
      return res.json({ success: true, message: 'Plano atualizado com sucesso', plan_id: planId });
    }

    if (action === 'delete') {
      const planId = parseInt(input.id) || 0;
      if (planId <= 0) {
        return res.status(400).json({ success: false, error: 'Campo id é obrigatório' });
      }

      const result = await query('DELETE FROM plans WHERE id = $1', [planId]);
      return res.json({ success: true, message: 'Plano excluído (se existia)', rows_affected: result.rowCount });
    }

    return res.status(400).json({ success: false, error: 'Ação inválida' });
  } catch (error) {
    console.error('[PLANS] Error:', error.message);
    res.status(500).json({ success: false, error: 'Erro ao processar operação', detail: error.message });
  }
});

// ========== USERS API ==========

app.get('/api/users.php', async (req, res) => {
  try {
    const id = req.query.id ? parseInt(req.query.id) : 0;
    const cpf = req.query.cpf || null;

    if (id > 0) {
      const result = await query(
        'SELECT id, name, cpf, phone, email, cep, birth_date, address, numero, bairro, cidade, estado, is_admin, created_at FROM users WHERE id = $1 LIMIT 1',
        [id]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Usuário não encontrado' });
      }
      return res.json({ success: true, data: result.rows });
    }

    if (cpf) {
      const cleanCpf = cpf.replace(/\D/g, '');
      const result = await query(
        "SELECT id, name, cpf, phone, email, cep, birth_date, address, numero, bairro, cidade, estado, is_admin, created_at FROM users WHERE REPLACE(REPLACE(REPLACE(cpf, '.', ''), '-', ''), '/', '') = $1",
        [cleanCpf]
      );
      return res.json({ success: true, total: result.rows.length, data: result.rows });
    }

    const result = await query(
      'SELECT id, name, cpf, phone, email, cep, birth_date, address, numero, bairro, cidade, estado, is_admin, created_at FROM users ORDER BY id ASC'
    );
    res.json({ success: true, total: result.rows.length, data: result.rows });
  } catch (error) {
    console.error('[USERS] Error:', error.message);
    res.status(500).json({ success: false, error: 'Erro ao consultar usuários', detail: error.message });
  }
});

app.post('/api/users.php', async (req, res) => {
  const input = req.body;
  const action = input.action;

  if (!action) {
    return res.status(400).json({ success: false, error: 'Ação (action) não informada' });
  }

  try {
    if (action === 'create') {
      const name = (input.name || '').trim();
      const cpf = (input.cpf || '').replace(/\D/g, '');
      const phone = input.phone || null;
      const email = input.email || null;
      const cep = input.cep || null;
      const birthDate = input.birth_date || null;
      const address = input.address || null;
      const numero = input.numero || null;
      const bairro = input.bairro || null;
      const cidade = input.cidade || null;
      const estado = input.estado || null;
      const password = input.password || null;
      const isAdmin = input.is_admin ? parseInt(input.is_admin) : 0;

      if (!name || !cpf) {
        return res.status(400).json({ success: false, error: 'Campos obrigatórios: name, cpf' });
      }

      const existing = await query("SELECT id FROM users WHERE REPLACE(REPLACE(REPLACE(cpf, '.', ''), '-', ''), '/', '') = $1", [cpf]);
      if (existing.rows.length > 0) {
        return res.status(400).json({ success: false, error: `Já existe um cadastro com este CPF: ${cpf}` });
      }

      if (email) {
        const existingEmail = await query('SELECT id FROM users WHERE email = $1', [email]);
        if (existingEmail.rows.length > 0) {
          return res.status(400).json({ success: false, error: `Já existe um cadastro com este E-mail: ${email}` });
        }
      }

      const result = await query(
        'INSERT INTO users (name, cpf, phone, email, cep, birth_date, address, numero, bairro, cidade, estado, password, is_admin, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW()) RETURNING id',
        [name, cpf, phone, email, cep, birthDate, address, numero, bairro, cidade, estado, password, isAdmin]
      );

      return res.json({ success: true, message: 'Usuário criado com sucesso', user_id: result.rows[0].id });
    }

    if (action === 'update') {
      const userId = parseInt(input.id) || 0;
      if (userId <= 0) {
        return res.status(400).json({ success: false, error: 'Campo id é obrigatório' });
      }

      const fields = [];
      const params = [];
      let paramIndex = 1;

      if (input.name !== undefined) { fields.push(`name = $${paramIndex++}`); params.push((input.name || '').trim()); }
      if (input.cpf !== undefined) { fields.push(`cpf = $${paramIndex++}`); params.push((input.cpf || '').replace(/\D/g, '')); }
      if (input.phone !== undefined) { fields.push(`phone = $${paramIndex++}`); params.push(input.phone); }
      if (input.email !== undefined) { fields.push(`email = $${paramIndex++}`); params.push(input.email); }
      if (input.cep !== undefined) { fields.push(`cep = $${paramIndex++}`); params.push(input.cep); }
      if (input.birth_date !== undefined) { fields.push(`birth_date = $${paramIndex++}`); params.push(input.birth_date); }
      if (input.address !== undefined) { fields.push(`address = $${paramIndex++}`); params.push(input.address); }
      if (input.numero !== undefined) { fields.push(`numero = $${paramIndex++}`); params.push(input.numero); }
      if (input.bairro !== undefined) { fields.push(`bairro = $${paramIndex++}`); params.push(input.bairro); }
      if (input.cidade !== undefined) { fields.push(`cidade = $${paramIndex++}`); params.push(input.cidade); }
      if (input.estado !== undefined) { fields.push(`estado = $${paramIndex++}`); params.push(input.estado); }
      if (input.password !== undefined) { fields.push(`password = $${paramIndex++}`); params.push(input.password); }
      if (input.is_admin !== undefined) { fields.push(`is_admin = $${paramIndex++}`); params.push(parseInt(input.is_admin)); }

      if (fields.length === 0) {
        return res.status(400).json({ success: false, error: 'Nenhum campo para atualizar' });
      }

      fields.push(`updated_at = NOW()`);
      params.push(userId);

      await query(`UPDATE users SET ${fields.join(', ')} WHERE id = $${paramIndex}`, params);
      return res.json({ success: true, message: 'Usuário atualizado com sucesso', user_id: userId });
    }

    if (action === 'delete') {
      const userId = parseInt(input.id) || 0;
      if (userId <= 0) {
        return res.status(400).json({ success: false, error: 'Campo id é obrigatório' });
      }

      const result = await query('DELETE FROM users WHERE id = $1', [userId]);
      return res.json({ success: true, message: 'Usuário excluído (se existia)', rows_affected: result.rowCount });
    }

    return res.status(400).json({ success: false, error: 'Ação inválida' });
  } catch (error) {
    console.error('[USERS] Error:', error.message);
    res.status(500).json({ success: false, error: 'Erro ao processar operação', detail: error.message });
  }
});

// ========== SUBSCRIPTIONS API ==========

app.get('/api/subscriptions.php', async (req, res) => {
  try {
    const userId = req.query.user_id ? parseInt(req.query.user_id) : 0;

    let sql = `
      SELECT s.*, u.name AS user_name, u.cpf AS user_cpf, p.name AS plan_name, p.slug AS plan_slug
      FROM subscriptions s
      LEFT JOIN users u ON u.id = s.user_id
      LEFT JOIN plans p ON p.id = s.plan_id
    `;
    const params = [];

    if (userId > 0) {
      sql += ' WHERE s.user_id = $1';
      params.push(userId);
    }

    sql += ' ORDER BY s.id DESC';

    const result = await query(sql, params);
    res.json({ success: true, total: result.rows.length, data: result.rows });
  } catch (error) {
    console.error('[SUBSCRIPTIONS] Error:', error.message);
    res.status(500).json({ success: false, error: 'Erro ao consultar assinaturas', detail: error.message });
  }
});

app.post('/api/subscriptions.php', async (req, res) => {
  const input = req.body;
  const action = input.action;

  if (!action) {
    return res.status(400).json({ success: false, error: 'Ação (action) não informada' });
  }

  try {
    if (action === 'create') {
      const userId = parseInt(input.user_id) || 0;
      let planId = input.plan_id;
      const status = (input.status || '').trim();
      let startedAt = input.started_at || null;
      const endsAt = input.ends_at || null;

      if (userId <= 0 || !status) {
        return res.status(400).json({ success: false, error: 'Campos obrigatórios: user_id, status' });
      }

      if (!startedAt) {
        startedAt = new Date().toISOString();
      }

      if (planId === '' || planId === 0 || planId === '0') {
        planId = null;
      } else if (planId) {
        planId = parseInt(planId);
      }

      const result = await query(
        'INSERT INTO subscriptions (user_id, plan_id, status, started_at, ends_at, created_at) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING id',
        [userId, planId, status, startedAt, endsAt]
      );

      return res.json({ success: true, message: 'Assinatura criada com sucesso', subscription_id: result.rows[0].id });
    }

    if (action === 'update') {
      const subId = parseInt(input.id || input.subscription_id) || 0;
      if (subId <= 0) {
        return res.status(400).json({ success: false, error: 'Campo id/subscription_id é obrigatório' });
      }

      const fields = [];
      const params = [];
      let paramIndex = 1;

      if (input.user_id !== undefined) { fields.push(`user_id = $${paramIndex++}`); params.push(parseInt(input.user_id)); }
      if (input.plan_id !== undefined) {
        let planId = input.plan_id;
        if (planId === '' || planId === 0 || planId === '0') planId = null;
        else planId = parseInt(planId);
        fields.push(`plan_id = $${paramIndex++}`);
        params.push(planId);
      }
      if (input.status !== undefined) { fields.push(`status = $${paramIndex++}`); params.push((input.status || '').trim()); }
      if (input.started_at !== undefined) { fields.push(`started_at = $${paramIndex++}`); params.push(input.started_at || null); }
      if (input.ends_at !== undefined) { fields.push(`ends_at = $${paramIndex++}`); params.push(input.ends_at || null); }

      if (fields.length === 0) {
        return res.status(400).json({ success: false, error: 'Nenhum campo para atualizar' });
      }

      params.push(subId);
      await query(`UPDATE subscriptions SET ${fields.join(', ')} WHERE id = $${paramIndex}`, params);
      return res.json({ success: true, message: 'Assinatura atualizada com sucesso', subscription_id: subId });
    }

    if (action === 'delete') {
      const subId = parseInt(input.id || input.subscription_id) || 0;
      if (subId <= 0) {
        return res.status(400).json({ success: false, error: 'Campo id/subscription_id é obrigatório' });
      }

      const result = await query('DELETE FROM subscriptions WHERE id = $1', [subId]);
      return res.json({ success: true, message: 'Assinatura excluída (se existia)', rows_affected: result.rowCount });
    }

    return res.status(400).json({ success: false, error: 'Ação inválida' });
  } catch (error) {
    console.error('[SUBSCRIPTIONS] Error:', error.message);
    res.status(500).json({ success: false, error: 'Erro ao processar operação', detail: error.message });
  }
});

// ========== SYNC (combined users+subscriptions+plans) API ==========

app.get('/api/sync.php', async (req, res) => {
  try {
    const cpfFilter = req.query.cpf ? req.query.cpf.replace(/\D/g, '') : null;
    const dateStart = req.query.date_start || null;
    const dateEnd = req.query.date_end || null;

    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (cpfFilter) {
      conditions.push(`REPLACE(REPLACE(REPLACE(u.cpf, '.', ''), '-', ''), '/', '') = $${paramIndex++}`);
      params.push(cpfFilter);
    }
    if (dateStart) {
      conditions.push(`DATE(s.created_at) >= $${paramIndex++}`);
      params.push(dateStart);
    }
    if (dateEnd) {
      conditions.push(`DATE(s.created_at) <= $${paramIndex++}`);
      params.push(dateEnd);
    }

    const whereSql = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const sql = `
      SELECT
        u.id AS user_id,
        u.name AS user_name,
        u.cpf AS user_cpf,
        u.phone AS user_phone,
        u.email AS user_email,
        u.cep AS user_cep,
        u.address AS user_address,
        u.numero AS user_numero,
        u.bairro AS user_bairro,
        u.cidade AS user_cidade,
        u.estado AS user_estado,
        u.created_at AS user_created_at,
        s.id AS subscription_id,
        s.status AS subscription_status,
        s.started_at AS subscription_started_at,
        s.ends_at AS subscription_ends_at,
        s.created_at AS subscription_created_at,
        p.id AS plan_id,
        p.name AS plan_name,
        p.slug AS plan_slug,
        p.price AS plan_price,
        p.billing_period AS plan_billing_period,
        CASE
          WHEN s.status = 'ativa' AND (s.ends_at IS NULL OR s.ends_at > NOW())
          THEN 1 ELSE 0
        END AS is_active
      FROM users u
      LEFT JOIN (
        SELECT DISTINCT ON (user_id) *
        FROM subscriptions
        ORDER BY user_id, started_at DESC
      ) s ON s.user_id = u.id
      LEFT JOIN plans p ON p.id = s.plan_id
      ${whereSql}
      ORDER BY u.id ASC
    `;

    const result = await query(sql, params);
    res.json({ success: true, total: result.rows.length, data: result.rows });
  } catch (error) {
    console.error('[SYNC] Error:', error.message);
    res.status(500).json({ success: false, error: 'Erro ao consultar o banco', detail: error.message });
  }
});

// ========== SYNC SERVICE ENDPOINTS ==========

app.get('/api/sync-service/status', (req, res) => {
  res.json({
    enabled: syncService.enabled,
    interval: syncService.interval,
    countdown: syncService.countdown,
    lastSync: syncService.lastSync,
    nextSync: syncService.nextSync,
    isRunning: syncService.isRunning,
    stats: {
      synced: Object.keys(syncService.syncedUsers).length,
      existing: Object.keys(syncService.existingUsers).length
    }
  });
});

app.get('/api/sync-service/logs', (req, res) => {
  res.json({
    logs: syncService.logs.slice(-100)
  });
});

app.post('/api/sync-service/config', (req, res) => {
  const { enabled, interval } = req.body;
  
  if (typeof enabled === 'boolean') {
    syncService.enabled = enabled;
  }
  
  if (typeof interval === 'number' && interval >= 60000) {
    syncService.interval = interval;
  }

  if (syncService.enabled) {
    startSyncTimer();
    addLog('info', `Sincronização automática ativada (intervalo: ${syncService.interval / 1000}s)`);
  } else {
    stopSyncTimer();
    addLog('info', 'Sincronização automática desativada');
  }

  saveSyncData();
  
  res.json({
    success: true,
    enabled: syncService.enabled,
    interval: syncService.interval
  });
});

app.post('/api/sync-service/run-now', async (req, res) => {
  if (syncService.isRunning) {
    return res.json({ success: false, message: 'Sincronização já está em andamento' });
  }
  
  runSyncCycle();
  res.json({ success: true, message: 'Sincronização iniciada' });
});

app.post('/api/sync-service/clear', (req, res) => {
  syncService.syncedUsers = {};
  syncService.existingUsers = {};
  syncService.errorUsers = {};
  syncService.logs = [];
  saveSyncData();
  addLog('info', 'Dados de sincronização limpos');
  res.json({ success: true });
});

app.get('/api/sync-service/synced-users', (req, res) => {
  res.json({
    syncedUsers: syncService.syncedUsers,
    existingUsers: syncService.existingUsers,
    errorUsers: syncService.errorUsers
  });
});

// ========== TOTVS ERROR TRANSLATION ==========
function translateTotvsError(raw) {
  if (!raw) return 'Erro desconhecido no TOTVS';
  const s = typeof raw === 'string' ? raw : JSON.stringify(raw);
  if (/Erro Integracao|ExecAutoTabela/i.test(s)) {
    if (/EXISTCLI|mesmo c..digo e loja/i.test(s)) return 'Cliente já existe no TOTVS com este CPF.';
    if (/Loja.*Invalido/i.test(s)) return 'Erro de configuração TOTVS (Loja inválida para este cliente).';
    if (/campos obrigat|em branco/i.test(s)) return 'Campos obrigatórios em branco. Verifique os dados do cadastro (nome, CPF, endereço, telefone, email).';
    if (/CGC|[Dd]igito verificador/i.test(s)) return 'CPF inválido (dígito verificador incorreto).';
    return `Erro na integração TOTVS: ${s.substring(0, 200)}`;
  }
  if (/troca de senha|change.*password|senha.*expirad/i.test(s)) return 'A senha do usuario TOTVS expirou e precisa ser renovada. Entre em contato com o administrador do sistema TOTVS para realizar a troca de senha.';
  if (/usu.*rio.*n.*o encontrado|user.*not found/i.test(s)) return 'Usuario nao encontrado no TOTVS.';
  if (/sem permiss|permission denied|unauthorized/i.test(s)) return 'Sem permissao para acessar a API TOTVS. Verifique as credenciais.';
  if (/\b401\b|\b403\b/i.test(s)) return 'Sem permissao para acessar a API TOTVS. Verifique as credenciais.';
  if (/timeout|timed out|ETIMEDOUT|ESOCKETTIMEDOUT/i.test(s)) return 'Tempo de conexao com TOTVS excedido. Tente novamente.';
  if (/ECONNREFUSED|connection refused/i.test(s)) return 'Nao foi possivel conectar ao servidor TOTVS. O servidor pode estar fora do ar.';
  if (/ECONNRESET|socket hang up|EPIPE/i.test(s)) return 'A conexao com o servidor TOTVS foi interrompida. Tente novamente.';
  if (/ENOTFOUND|DNS|getaddrinfo/i.test(s)) return 'Servidor TOTVS nao encontrado. Verifique a configuracao de rede.';
  if (/\b502\b|bad gateway/i.test(s)) return 'Servidor TOTVS retornou erro de gateway. O servico pode estar em manutencao.';
  if (/\b503\b|service unavailable/i.test(s)) return 'Servidor TOTVS temporariamente indisponivel. Tente novamente em alguns minutos.';
  if (/\b504\b|gateway timeout/i.test(s)) return 'Tempo de resposta do servidor TOTVS excedido. O servico pode estar sobrecarregado.';
  if (/certificate|ssl|tls|UNABLE_TO_VERIFY/i.test(s)) return 'Erro de certificado SSL ao conectar ao TOTVS. Contate o administrador.';
  if (/ECONNABORTED/i.test(s)) return 'Conexao com TOTVS abortada. Tente novamente.';
  return s;
}

// ========== TOTVS PROXY ENDPOINTS ==========

app.post('/api/totvs/search', async (req, res) => {
  const { cpf } = req.body;
  
  if (!cpf || cpf.replace(/\D/g, '').length < 11) {
    return res.status(400).json({ success: false, error: 'CPF inválido' });
  }

  const cleanCpf = cpf.replace(/\D/g, '');
  
  const payload = JSON.stringify({
    A1_CGC: cleanCpf,
    A1_IDPARC: 'WESCC1'
  });

  const options = {
    hostname: TOTVS_URL,
    port: TOTVS_PORT,
    path: TOTVS_PATHS.getClient,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
      'Authorization': `Basic ${TOTVS_AUTH}`
    }
  };

  const proxyReq = https.request(options, (proxyRes) => {
    let data = '';
    proxyRes.on('data', (chunk) => { data += chunk; });
    proxyRes.on('end', () => {
      try {
        const parsed = JSON.parse(data);
        if (proxyRes.statusCode !== 200) {
          const errMsg = parsed?.errorMessage || parsed?.message || parsed?.error || `Erro HTTP ${proxyRes.statusCode}`;
          return res.status(proxyRes.statusCode).json({ success: false, error: translateTotvsError(errMsg), http_code: proxyRes.statusCode });
        }
        res.json({ success: true, data: parsed });
      } catch (e) {
        const translated = translateTotvsError(data);
        res.status(500).json({ success: false, error: translated });
      }
    });
  });

  proxyReq.on('error', (err) => {
    console.error('TOTVS request error:', err);
    res.status(500).json({ success: false, error: translateTotvsError(err.message) });
  });

  proxyReq.write(payload);
  proxyReq.end();
});

app.post('/api/totvs/sync', async (req, res) => {
  const { user } = req.body;
  
  if (!user || !user.cpf) {
    return res.status(400).json({ success: false, error: 'Dados do usuário inválidos' });
  }

  const missingFields = [];
  if (!user.name) missingFields.push('Nome');
  if (!user.cpf) missingFields.push('CPF');
  if (!user.email) missingFields.push('E-mail');
  if (!user.phone) missingFields.push('Telefone');
  if (!user.address) missingFields.push('Endereço');
  if (!user.bairro) missingFields.push('Bairro');
  if (!user.cidade) missingFields.push('Cidade');
  if (!user.estado) missingFields.push('Estado');
  if (!user.cep) missingFields.push('CEP');
  
  if (missingFields.length > 0) {
    return res.status(400).json({ 
      success: false, 
      error: `Campos obrigatórios não preenchidos: ${missingFields.join(', ')}`,
      missing_fields: missingFields
    });
  }

  const cleanCpf = user.cpf.replace(/\D/g, '');
  const nameParts = (user.name || '').trim().split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';
  const ddd = (user.phone || '').replace(/\D/g, '').substring(0, 2) || '';
  const phone = (user.phone || '').replace(/\D/g, '').substring(2) || '';
  const birthDate = user.birth_date ? user.birth_date.replace(/-/g, '') : '';
  
  const totvData = [{
    A1_CGC: cleanCpf,
    A1_NOME: firstName,
    A1_NOME2: lastName,
    A1_NREDUZ: (user.name || '').substring(0, 20).toUpperCase(),
    A1_END: (user.address || '') + (user.numero ? `, ${user.numero}` : ''),
    A1_BAIRRO: user.bairro || '',
    A1_MUN: user.cidade || '',
    A1_EST: user.estado || '',
    A1_CEP: (user.cep || '').replace(/\D/g, ''),
    A1_DDD: ddd,
    A1_TEL: phone,
    A1_PESSOA: 'F',
    A1_TIPO: 'F',
    A1_PFISICA: 'S',
    A1_PAIS: '105',
    A1_EMAIL: user.email || '',
    A1_DTNASC: birthDate,
    A1_IDPARC: 'WESCC1'
  }];
  
  const payload = JSON.stringify(totvData);

  const options = {
    hostname: TOTVS_URL,
    port: TOTVS_PORT,
    path: TOTVS_PATHS.insClient,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
      'Authorization': `Basic ${TOTVS_AUTH}`
    }
  };

  const proxyReq = https.request(options, (proxyRes) => {
    let data = '';
    proxyRes.on('data', (chunk) => { data += chunk; });
    proxyRes.on('end', () => {
      try {
        const parsed = JSON.parse(data);
        if (proxyRes.statusCode !== 200 && proxyRes.statusCode !== 201) {
          return res.status(proxyRes.statusCode).json({ success: false, error: 'Erro ao criar cliente no TOTVS', http_code: proxyRes.statusCode, response: parsed });
        }
        res.json({ success: true, data: parsed, message: 'Cliente sincronizado com sucesso' });
      } catch (e) {
        const translated = translateTotvsError(data);
        res.status(500).json({ success: false, error: translated });
      }
    });
  });

  proxyReq.on('error', (err) => {
    console.error('[TOTVS SYNC] Connection error:', err.message);
    res.status(500).json({ success: false, error: translateTotvsError(err.message) });
  });

  proxyReq.write(payload);
  proxyReq.end();
});

app.post('/api/totvs/check-exists', async (req, res) => {
  const { cpf } = req.body;
  
  if (!cpf) {
    return res.status(400).json({ success: false, error: 'CPF não informado' });
  }

  const cleanCpf = cpf.replace(/\D/g, '');
  
  const payload = JSON.stringify({
    A1_CGC: cleanCpf,
    A1_IDPARC: 'WESCC1'
  });

  const options = {
    hostname: TOTVS_URL,
    port: TOTVS_PORT,
    path: TOTVS_PATHS.getClient,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
      'Authorization': `Basic ${TOTVS_AUTH}`
    }
  };

  const proxyReq = https.request(options, (proxyRes) => {
    let data = '';
    proxyRes.on('data', (chunk) => { data += chunk; });
    proxyRes.on('end', () => {
      try {
        const parsed = JSON.parse(data);
        const exists = proxyRes.statusCode === 200 && parsed && parsed.A1_COD;
        res.json({ success: true, exists, data: exists ? parsed : null });
      } catch (e) {
        res.json({ success: true, exists: false });
      }
    });
  });

  proxyReq.on('error', (err) => {
    console.error('TOTVS check error:', err);
    res.status(500).json({ success: false, error: translateTotvsError(err.message) });
  });

  proxyReq.write(payload);
  proxyReq.end();
});

app.get('/api/totvs/health', (req, res) => {
  if (!TOTVS_AUTH) {
    return res.json({ status: 'error', hasToken: false, message: 'Token TOTVS não configurado' });
  }

  const testPayload = JSON.stringify({ A1_CGC: '00000000000', A1_IDPARC: 'WESCC1' });
  const options = {
    hostname: TOTVS_URL,
    port: TOTVS_PORT,
    path: TOTVS_PATHS.getClient,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(testPayload),
      'Authorization': `Basic ${TOTVS_AUTH}`
    },
    timeout: 10000
  };

  const proxyReq = https.request(options, (proxyRes) => {
    let data = '';
    proxyRes.on('data', (chunk) => { data += chunk; });
    proxyRes.on('end', () => {
      const translated = translateTotvsError(data);
      const needsPasswordChange = /senha.*expirou|troca de senha/i.test(translated);
      let healthStatus = 'ok';
      let healthMessage = 'Conexão com TOTVS funcionando';
      if (needsPasswordChange) {
        healthStatus = 'password_expired';
        healthMessage = translated;
      } else if (proxyRes.statusCode === 401 || proxyRes.statusCode === 403) {
        healthStatus = 'error';
        healthMessage = 'Credenciais inválidas - verifique login e senha';
      } else if (proxyRes.statusCode >= 500) {
        healthStatus = 'error';
        healthMessage = translated;
      }
      res.json({
        status: healthStatus,
        hasToken: true,
        httpCode: proxyRes.statusCode,
        message: healthMessage
      });
    });
  });

  proxyReq.on('timeout', () => {
    proxyReq.destroy();
    res.json({ status: 'timeout', hasToken: true, message: 'Tempo de conexão com TOTVS excedido' });
  });

  proxyReq.on('error', (err) => {
    res.json({ status: 'error', hasToken: true, message: translateTotvsError(err.message) });
  });

  proxyReq.write(testPayload);
  proxyReq.end();
});

// ========== CENTRAL DE APIs ==========

function checkApiHealth(name, options, writeBody = null) {
  return new Promise((resolve) => {
    const start = Date.now();
    const timeout = options.timeout || 10000;

    const req = https.request(options, (proxyRes) => {
      let data = '';
      proxyRes.on('data', (chunk) => { data += chunk; });
      proxyRes.on('end', () => {
        const latency = Date.now() - start;
        const isOk = proxyRes.statusCode >= 200 && proxyRes.statusCode < 400;
        let status = isOk ? 'online' : 'error';
        let message = isOk ? 'Conexão estabelecida' : `HTTP ${proxyRes.statusCode}`;

        if (name === 'WhatsApp') {
          if (proxyRes.statusCode < 500) {
            status = 'online';
            message = 'API acessível';
          }
        }

        if (name === 'TOTVS') {
          const translated = translateTotvsError(data);
          const needsPassword = /senha.*expirou|troca de senha/i.test(translated);
          if (needsPassword) {
            status = 'offline';
            message = 'Senha expirada - necessário trocar senha no TOTVS';
          } else if (proxyRes.statusCode === 401 || proxyRes.statusCode === 403) {
            status = 'offline';
            message = 'Credenciais inválidas - verifique login e senha';
          } else if (isOk || proxyRes.statusCode < 500) {
            status = 'online';
            message = 'Conexão funcionando';
          } else {
            message = translated;
          }
        }

        resolve({ name, status, latency, message, lastChecked: new Date().toISOString() });
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ name, status: 'offline', latency: timeout, message: 'Tempo de conexão excedido', lastChecked: new Date().toISOString() });
    });

    req.on('error', (err) => {
      const latency = Date.now() - start;
      resolve({ name, status: 'offline', latency, message: err.code === 'ECONNREFUSED' ? 'Conexão recusada' : (err.code || err.message), lastChecked: new Date().toISOString() });
    });

    req.setTimeout(timeout);
    if (writeBody) req.write(writeBody);
    req.end();
  });
}

app.get('/api/central/health', async (req, res) => {
  try {
    const checks = [];

    checks.push(checkApiHealth('TOTVS', {
      hostname: TOTVS_URL,
      port: TOTVS_PORT,
      path: TOTVS_PATHS.getClient,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(JSON.stringify({ A1_CGC: '00000000000', A1_IDPARC: 'WESCC1' })),
        'Authorization': TOTVS_AUTH ? `Basic ${TOTVS_AUTH}` : ''
      },
      timeout: 10000
    }, JSON.stringify({ A1_CGC: '00000000000', A1_IDPARC: 'WESCC1' })));

    checks.push((async () => {
      const start = Date.now();
      try {
        const resp = await fetch(`http://localhost:${PORT}/api/lp/cities`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cidade: 'Porto Alegre', uf: 'RS' })
        });
        const latency = Date.now() - start;
        const data = await resp.json();
        const isOk = resp.status === 200 && data.ok;
        return { name: 'Coobmais', status: isOk ? 'online' : 'error', latency, message: isOk ? 'Conexão estabelecida' : (data.error || `HTTP ${resp.status}`), lastChecked: new Date().toISOString() };
      } catch (err) {
        const latency = Date.now() - start;
        return { name: 'Coobmais', status: 'offline', latency, message: err.code || err.message, lastChecked: new Date().toISOString() };
      }
    })());

    const vindiAuth = VINDI_API_KEY ? Buffer.from(`${VINDI_API_KEY}:`).toString('base64') : '';
    checks.push(checkApiHealth('Vindi', {
      hostname: VINDI_BASE_URL || 'sandbox-app.vindi.com.br',
      port: 443,
      path: '/api/v1/payment_methods',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${vindiAuth}`
      },
      timeout: 10000
    }));

    const waConfig = await getWhatsAppConfig();
    const waUrl = (() => { try { return new URL(waConfig.api_url); } catch (_) { return new URL('https://api.wescctech.com.br/core/v2/api'); } })();
    checks.push(checkApiHealth('WhatsApp', {
      hostname: waUrl.hostname,
      port: 443,
      path: waUrl.pathname || '/core/v2/api',
      method: 'GET',
      headers: {
        'access-token': waConfig.access_token
      },
      timeout: 10000
    }));

    checks.push(checkApiHealth('ViaCEP', {
      hostname: 'viacep.com.br',
      port: 443,
      path: '/ws/01001000/json/',
      method: 'GET',
      headers: {},
      timeout: 10000
    }));

    const results = await Promise.all(checks);
    res.json({ success: true, apis: results });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/central/apis', async (req, res) => {
  const waConfig = await getWhatsAppConfig().catch(() => ({ api_url: WHATSAPP_DEFAULTS.api_url, access_token: '' }));
  const apis = [
    {
      name: 'TOTVS',
      description: 'ERP Protheus - Sincronização de clientes e dados cadastrais',
      baseUrl: `https://${TOTVS_URL}:${TOTVS_PORT}`,
      authType: 'Basic Auth',
      hasToken: !!TOTVS_AUTH,
      category: 'ERP',
      endpoints: [
        { method: 'GET', path: '/rest/coobClient/getClient', description: 'Buscar cliente por CPF' },
        { method: 'POST', path: '/rest/coobClient/insClient', description: 'Inserir/atualizar cliente' }
      ]
    },
    {
      name: 'Coobmais',
      description: 'Plataforma de reservas - Hotéis, disponibilidade e confirmação',
      baseUrl: COOBMAIS_BASE_URL,
      authUrl: COOBMAIS_AUTH_URL,
      authType: 'AccessKey + Password (JWT auto-gerado)',
      hasToken: !!COOBMAIS_TOKEN,
      hasCredentials: !!(COOBMAIS_ACCESS_KEY && COOBMAIS_PASSWORD),
      category: 'Reservas',
      endpoints: [
        { method: 'POST', path: '/Book/GetCities', description: 'Buscar cidades' },
        { method: 'POST', path: '/Book/GetHotels', description: 'Buscar hotéis disponíveis' },
        { method: 'GET', path: '/Book/InfoHotels', description: 'Detalhes do hotel' },
        { method: 'POST', path: '/Book/InfoApartment', description: 'Tipos de quarto' },
        { method: 'POST', path: '/Book/AvailabilityBook', description: 'Verificar disponibilidade' },
        { method: 'POST', path: '/Book/BookingConfirmation', description: 'Confirmar reserva' },
        { method: 'PATCH', path: '/Book/CancellationBook', description: 'Cancelar reserva' },
        { method: 'GET', path: '/Associate/GetAssociate', description: 'Dados do associado' }
      ]
    },
    {
      name: 'Vindi',
      description: 'Gateway de pagamentos - Cobranças via cartão e boleto',
      baseUrl: `https://${VINDI_BASE_URL}/api/v1`,
      authType: 'Basic Auth (API Key)',
      hasToken: !!VINDI_API_KEY,
      category: 'Pagamentos',
      endpoints: [
        { method: 'POST', path: '/customers', description: 'Criar/buscar cliente' },
        { method: 'POST', path: '/payment_profiles', description: 'Criar perfil de pagamento' },
        { method: 'POST', path: '/bills', description: 'Criar fatura' },
        { method: 'GET', path: '/bills/:id', description: 'Consultar fatura' },
        { method: 'DELETE', path: '/bills/:id', description: 'Cancelar fatura' },
        { method: 'GET', path: '/payment_methods', description: 'Listar métodos de pagamento' }
      ]
    },
    {
      name: 'WhatsApp',
      description: 'WESCCTECH - Envio de mensagens automatizadas via WhatsApp',
      baseUrl: waConfig.api_url.replace(/\/chats\/send-text$/, ''),
      authType: 'Access Token (Header)',
      hasToken: !!waConfig.access_token,
      category: 'Comunicação',
      endpoints: [
        { method: 'POST', path: '/chats/send-text', description: 'Enviar mensagem de texto' }
      ]
    },
    {
      name: 'ViaCEP',
      description: 'API pública de CEP - Autopreenchimento de endereços',
      baseUrl: 'https://viacep.com.br/ws',
      authType: 'Nenhuma (API pública)',
      hasToken: true,
      category: 'Utilidades',
      endpoints: [
        { method: 'GET', path: '/{cep}/json/', description: 'Buscar endereço por CEP' }
      ]
    }
  ];

  res.json({ success: true, apis });
});

app.get('/api/central/config', (req, res) => {
  const mask = (v) => {
    const s = String(v || '');
    return s.length > 8 ? '••••' + s.slice(-4) : '••••';
  };
  const safeConfig = {};
  for (const [key, val] of Object.entries(apiConfigOverrides)) {
    safeConfig[key] = { ...val };
    if (safeConfig[key].token) safeConfig[key].token = mask(safeConfig[key].token);
    if (safeConfig[key].accessKey) safeConfig[key].accessKey = mask(safeConfig[key].accessKey);
    if (safeConfig[key].password) safeConfig[key].password = mask(safeConfig[key].password);
  }
  res.json({ success: true, config: safeConfig });
});

app.get('/api/central/coobmais/token', async (req, res) => {
  try {
    const token = await ensureCoobToken();
    const tokenPreview = token && token.length > 24 ? token.slice(0, 18) + '...' + token.slice(-12) : token;
    res.json({
      success: true,
      tokenPreview,
      tokenFull: token,
      exp: coobmaisTokenExp,
      expiresAt: coobmaisTokenExp ? new Date(coobmaisTokenExp).toISOString() : null,
      expiresInSeconds: coobmaisTokenExp ? Math.max(0, Math.floor((coobmaisTokenExp - Date.now()) / 1000)) : null,
      hasCredentials: !!(COOBMAIS_ACCESS_KEY && COOBMAIS_PASSWORD),
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/central/coobmais/refresh-token', async (req, res) => {
  try {
    if (!COOBMAIS_ACCESS_KEY || !COOBMAIS_PASSWORD) {
      return res.status(400).json({ success: false, error: 'AccessKey e password não configurados' });
    }
    COOBMAIS_TOKEN = '';
    coobmaisTokenExp = 0;
    if (apiConfigOverrides.Coobmais) delete apiConfigOverrides.Coobmais.token;
    const token = await ensureCoobToken();
    const tokenPreview = token && token.length > 24 ? token.slice(0, 18) + '...' + token.slice(-12) : token;
    res.json({
      success: true,
      tokenPreview,
      tokenFull: token,
      exp: coobmaisTokenExp,
      expiresAt: new Date(coobmaisTokenExp).toISOString(),
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.put('/api/central/apis/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const { baseUrl, token, username, password } = req.body;

    const allowedApis = ['TOTVS', 'Coobmais', 'Vindi', 'WhatsApp'];
    if (!allowedApis.includes(name)) {
      return res.status(400).json({ success: false, error: 'API não reconhecida' });
    }

    if (baseUrl !== undefined) {
      try {
        const parsed = new URL(baseUrl);
        if (parsed.protocol !== 'https:') {
          return res.status(400).json({ success: false, error: 'URL deve usar HTTPS' });
        }
      } catch (_) {
        return res.status(400).json({ success: false, error: 'URL inválida' });
      }
    }
    
    if (!apiConfigOverrides[name]) apiConfigOverrides[name] = {};
    if (baseUrl !== undefined) apiConfigOverrides[name].baseUrl = baseUrl;
    if (token !== undefined) apiConfigOverrides[name].token = token;

    if (name === 'Coobmais') {
      const { accessKey, password: coobPwd, authUrl } = req.body;
      let credsChanged = false;
      if (accessKey !== undefined && accessKey !== '') {
        apiConfigOverrides[name].accessKey = accessKey;
        COOBMAIS_ACCESS_KEY = accessKey;
        credsChanged = true;
      }
      if (coobPwd !== undefined && coobPwd !== '') {
        apiConfigOverrides[name].password = coobPwd;
        COOBMAIS_PASSWORD = coobPwd;
        credsChanged = true;
      }
      if (authUrl !== undefined && authUrl !== '') {
        try {
          const parsed = new URL(authUrl);
          if (parsed.protocol !== 'https:') {
            return res.status(400).json({ success: false, error: 'URL de autenticação deve usar HTTPS' });
          }
        } catch (_) {
          return res.status(400).json({ success: false, error: 'URL de autenticação inválida' });
        }
        apiConfigOverrides[name].authUrl = authUrl;
        COOBMAIS_AUTH_URL = authUrl;
        credsChanged = true;
      }
      if (credsChanged) {
        COOBMAIS_TOKEN = '';
        coobmaisTokenExp = 0;
        delete apiConfigOverrides[name].token;
      }
    }

    if (username && password && name === 'TOTVS') {
      const basicToken = Buffer.from(`${username}:${password}`).toString('base64');
      apiConfigOverrides[name].token = basicToken;
      TOTVS_AUTH = basicToken;
    } else if (token !== undefined) {
      if (name === 'TOTVS') TOTVS_AUTH = token;
      if (name === 'Coobmais') COOBMAIS_TOKEN = token;
      if (name === 'Vindi') VINDI_API_KEY = token;
    }

    if (baseUrl !== undefined) {
      if (name === 'TOTVS') {
        try {
          const u = new URL(baseUrl);
          TOTVS_URL = u.hostname;
          TOTVS_PORT = parseInt(u.port) || 443;
        } catch (_) {}
      }
      if (name === 'Coobmais') {
        COOBMAIS_BASE_URL = baseUrl.replace(/\/+$/, '');
      }
      if (name === 'Vindi') {
        try {
          const u = new URL(baseUrl);
          VINDI_BASE_URL = u.hostname;
        } catch (_) {}
      }
    }
    
    if (name === 'WhatsApp') {
      const currentWa = await getWhatsAppConfig().catch(() => ({ ...WHATSAPP_DEFAULTS }));
      if (token !== undefined) currentWa.access_token = token;
      if (baseUrl !== undefined) currentWa.api_url = baseUrl.replace(/\/+$/, '') + '/chats/send-text';
      await query(
        "INSERT INTO system_config (key, value, updated_at) VALUES ('whatsapp_config', $1, NOW()) ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW()",
        [JSON.stringify(currentWa)]
      );
    }

    fs.writeFileSync(API_CONFIG_FILE, JSON.stringify(apiConfigOverrides, null, 2));
    
    res.json({ success: true, message: `Configuração de ${name} atualizada` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ========== SYSTEM CONFIG API ==========

app.get('/api/config/public', async (req, res) => {
  try {
    const result = await query('SELECT key, value FROM system_config WHERE key IN ($1)', ['plans_enabled']);
    const config = {};
    result.rows.forEach(r => { config[r.key] = r.value; });
    res.json({ ok: true, config });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.get('/api/config', async (req, res) => {
  try {
    const result = await query('SELECT key, value, updated_at FROM system_config ORDER BY key');
    const config = {};
    result.rows.forEach(r => { config[r.key] = r.value; });
    res.json({ ok: true, config, rows: result.rows });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.put('/api/config/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    await query(
      'INSERT INTO system_config (key, value, updated_at) VALUES ($1, $2, NOW()) ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()',
      [key, JSON.stringify(value)]
    );
    res.json({ ok: true, message: `Configuração '${key}' atualizada` });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ========== LP (LANDING PAGE) API ==========

const lpSessions = new Map();

function createLpSession(userId, userName) {
  const token = crypto.randomUUID();
  lpSessions.set(token, { userId, userName, createdAt: Date.now() });
  return token;
}

function getLpSession(token) {
  if (!token) return null;
  const session = lpSessions.get(token);
  if (!session) return null;
  if (Date.now() - session.createdAt > 24 * 60 * 60 * 1000) {
    lpSessions.delete(token);
    return null;
  }
  return session;
}

function parseLpToken(req) {
  const cookie = req.headers.cookie || '';
  const match = cookie.match(/lp_token=([^;]+)/);
  return match ? match[1] : null;
}

let COOBMAIS_TOKEN = process.env.COOBMAIS_TOKEN || '';
let COOBMAIS_BASE_URL = process.env.COOBMAIS_BASE_URL || 'https://apiprod.coobmais.com.br/unico/api';
let COOBMAIS_AUTH_URL = process.env.COOBMAIS_AUTH_URL || 'https://apiprod.coobmais.com.br/auth/api/Users/Authenticate';
let COOBMAIS_ACCESS_KEY = process.env.COOBMAIS_ACCESS_KEY || '';
let COOBMAIS_PASSWORD = process.env.COOBMAIS_PASSWORD || '';
let coobmaisTokenExp = 0;
let coobmaisAuthInflight = null;

if (apiConfigOverrides.Coobmais?.baseUrl) COOBMAIS_BASE_URL = apiConfigOverrides.Coobmais.baseUrl.replace(/\/+$/, '');
if (apiConfigOverrides.Coobmais?.authUrl) COOBMAIS_AUTH_URL = apiConfigOverrides.Coobmais.authUrl;
if (apiConfigOverrides.Coobmais?.accessKey) COOBMAIS_ACCESS_KEY = apiConfigOverrides.Coobmais.accessKey;
if (apiConfigOverrides.Coobmais?.password) COOBMAIS_PASSWORD = apiConfigOverrides.Coobmais.password;
if (apiConfigOverrides.Coobmais?.token) {
  COOBMAIS_TOKEN = apiConfigOverrides.Coobmais.token;
  try {
    const payload = JSON.parse(Buffer.from(COOBMAIS_TOKEN.split('.')[1] + '==', 'base64').toString());
    coobmaisTokenExp = (payload.exp || 0) * 1000;
  } catch (_) {}
}

async function ensureCoobToken() {
  if (COOBMAIS_TOKEN && coobmaisTokenExp > Date.now() + 5 * 60 * 1000) {
    return COOBMAIS_TOKEN;
  }
  if (!COOBMAIS_ACCESS_KEY || !COOBMAIS_PASSWORD) {
    if (COOBMAIS_TOKEN) return COOBMAIS_TOKEN;
    throw new Error('Coobmais não configurada: defina AccessKey e password na Central de APIs');
  }
  if (coobmaisAuthInflight) return coobmaisAuthInflight;
  coobmaisAuthInflight = (async () => {
    try {
      const resp = await fetch(COOBMAIS_AUTH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ AccessKey: COOBMAIS_ACCESS_KEY, password: COOBMAIS_PASSWORD }),
      });
      if (!resp.ok) {
        const errBody = await resp.text().catch(() => '');
        throw new Error(`Login Coobmais falhou (HTTP ${resp.status}): ${errBody.slice(0, 200)}`);
      }
      const data = await resp.json();
      const newToken = data?.token;
      if (!newToken) throw new Error('Resposta de login Coobmais sem campo token');
      COOBMAIS_TOKEN = newToken;
      try {
        const payload = JSON.parse(Buffer.from(newToken.split('.')[1] + '==', 'base64').toString());
        coobmaisTokenExp = (payload.exp || 0) * 1000;
      } catch (_) {
        coobmaisTokenExp = Date.now() + 30 * 60 * 1000;
      }
      if (!apiConfigOverrides.Coobmais) apiConfigOverrides.Coobmais = {};
      apiConfigOverrides.Coobmais.token = newToken;
      try { fs.writeFileSync(API_CONFIG_FILE, JSON.stringify(apiConfigOverrides, null, 2)); } catch (_) {}
      console.log('[Coobmais] Token renovado, expira em', new Date(coobmaisTokenExp).toISOString());
      return newToken;
    } finally {
      coobmaisAuthInflight = null;
    }
  })();
  return coobmaisAuthInflight;
}

app.post('/api/lp/register', async (req, res) => {
  try {
    const { name, cpf, phone, email, password, cep, address, number, bairro, cidade, estado, birth_date } = req.body;

    if (!name || !cpf || !email || !password) {
      return res.status(400).json({ success: false, error: 'Campos obrigatórios: name, cpf, email, password' });
    }

    const cleanCpf = (cpf || '').replace(/\D/g, '');

    if (!isValidCPF(cleanCpf)) {
      return res.status(400).json({ success: false, error: 'CPF inválido. Verifique e tente novamente.' });
    }

    const existingCpf = await query(
      "SELECT id FROM users WHERE REPLACE(REPLACE(REPLACE(cpf, '.', ''), '-', ''), '/', '') = $1",
      [cleanCpf]
    );
    if (existingCpf.rows.length > 0) {
      return res.status(400).json({ success: false, error: 'Já existe um cadastro com este CPF' });
    }

    const existingEmail = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingEmail.rows.length > 0) {
      return res.status(400).json({ success: false, error: 'Já existe um cadastro com este E-mail' });
    }

    const configResult = await query("SELECT value FROM system_config WHERE key = 'plans_enabled'");
    const plansOn = configResult.rows.length > 0 ? configResult.rows[0].value : true;

    if (!plansOn) {
      const missing = [];
      if (!cep) missing.push('CEP');
      if (!address) missing.push('Endereço');
      if (!bairro) missing.push('Bairro');
      if (!cidade) missing.push('Cidade');
      if (!estado) missing.push('Estado');
      if (!birth_date) missing.push('Data de nascimento');
      if (missing.length > 0) {
        return res.status(400).json({ success: false, error: `Campos obrigatórios: ${missing.join(', ')}` });
      }
    }

    const result = await query(
      `INSERT INTO users (name, cpf, phone, email, password, cep, address, numero, bairro, cidade, estado, birth_date, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW()) RETURNING id`,
      [
        name.trim(),
        cleanCpf,
        phone || null,
        email,
        password,
        cep || null,
        address || null,
        number || null,
        bairro || null,
        cidade || null,
        estado || null,
        birth_date || null,
      ]
    );

    const userId = result.rows[0].id;
    const token = createLpSession(userId, name.trim());

    if (!plansOn) {
      try {
        if (phone) {
          triggerWhatsAppFlow('registration_completed', {
            nome: name.trim(),
          }, phone).catch(() => {});
        }
      } catch (e) {}
    }

    const redirect = plansOn ? '/lp/checkout.html' : '/';

    res.cookie('lp_token', token, { httpOnly: true, path: '/', sameSite: 'lax', maxAge: 86400000 });
    res.json({ success: true, user_id: userId, redirect });
  } catch (error) {
    console.error('[LP REGISTER] Error:', error.message);
    res.status(500).json({ success: false, error: 'Erro ao registrar usuário', detail: error.message });
  }
});

app.post('/api/lp/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'E-mail e senha são obrigatórios' });
    }

    const result = await query('SELECT id, name FROM users WHERE email = $1 AND password = $2', [email, password]);

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, error: 'E-mail ou senha inválidos' });
    }

    const user = result.rows[0];
    const token = createLpSession(user.id, user.name);

    res.cookie('lp_token', token, { httpOnly: true, path: '/', sameSite: 'lax', maxAge: 86400000 });
    res.json({ success: true, redirect: '/' });
  } catch (error) {
    console.error('[LP LOGIN] Error:', error.message);
    res.status(500).json({ success: false, error: 'Erro ao realizar login', detail: error.message });
  }
});

app.post('/api/lp/logout', (req, res) => {
  try {
    const token = parseLpToken(req);
    if (token) {
      lpSessions.delete(token);
    }
    res.clearCookie('lp_token', { path: '/' });
    res.json({ success: true });
  } catch (error) {
    console.error('[LP LOGOUT] Error:', error.message);
    res.status(500).json({ success: false, error: 'Erro ao realizar logout' });
  }
});

app.get('/api/lp/session', async (req, res) => {
  try {
    const token = parseLpToken(req);
    const session = getLpSession(token);

    if (session) {
      const subResult = await query(
        'SELECT s.status, p.name as plan_name FROM subscriptions s LEFT JOIN plans p ON s.plan_id = p.id WHERE s.user_id = $1 ORDER BY s.created_at DESC LIMIT 1',
        [session.userId]
      );
      const subscription = subResult.rows.length > 0 ? subResult.rows[0] : null;
      const userRow = await query('SELECT cpf, name, phone, email FROM users WHERE id = $1 LIMIT 1', [session.userId]);
      const userData = userRow.rows[0] || {};
      return res.json({ success: true, user: { id: session.userId, name: session.userName, cpf: userData.cpf || '', phone: userData.phone || '', email: userData.email || '' }, subscription });
    }
    res.json({ success: false });
  } catch (error) {
    console.error('[LP SESSION] Error:', error.message);
    res.status(500).json({ success: false, error: 'Erro ao verificar sessão' });
  }
});

app.get('/api/lp/plans', async (req, res) => {
  try {
    const result = await query('SELECT * FROM plans WHERE active = 1 ORDER BY price ASC');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('[LP PLANS] Error:', error.message);
    res.status(500).json({ success: false, error: 'Erro ao consultar planos', detail: error.message });
  }
});

app.post('/api/lp/checkout', async (req, res) => {
  try {
    const token = parseLpToken(req);
    const session = getLpSession(token);

    if (!session) {
      return res.status(401).json({ success: false, error: 'Sessão inválida ou expirada' });
    }

    const { plan_id, cep, address, number, bairro, cidade, estado, birth_date } = req.body;

    await query(
      'UPDATE users SET cep=$1, address=$2, numero=$3, bairro=$4, cidade=$5, estado=$6, birth_date=$7 WHERE id=$8',
      [cep || null, address || null, number || null, bairro || null, cidade || null, estado || null, birth_date || null, session.userId]
    );

    const planIdNum = parseInt(plan_id) || 0;
    if (planIdNum > 0) {
      await query(
        "INSERT INTO subscriptions (user_id, plan_id, status, started_at) VALUES ($1, $2, 'pendente', NOW())",
        [session.userId, planIdNum]
      );
    } else {
      await query(
        "INSERT INTO subscriptions (user_id, plan_id, status, started_at) VALUES ($1, NULL, 'pendente', NOW())",
        [session.userId]
      );
    }

    try {
      const userResult = await query('SELECT name, phone FROM users WHERE id = $1', [session.userId]);
      const u = userResult.rows[0];
      if (u?.phone) {
        triggerWhatsAppFlow('registration_completed', {
          nome: u.name || session.userName || '',
        }, u.phone).catch(() => {});
      }
    } catch(e) {}

    res.json({ success: true, message: 'Cadastro finalizado com sucesso' });
  } catch (error) {
    console.error('[LP CHECKOUT] Error:', error.message);
    res.status(500).json({ success: false, error: 'Erro ao finalizar cadastro', detail: error.message });
  }
});

const citiesCache = new Map();
const CITIES_CACHE_TTL = 10 * 60 * 1000;

app.post('/api/lp/cities', async (req, res) => {
  try {
    const { cidade, uf } = req.body;
    const payload = {};
    if (cidade) payload.cidade = cidade;
    if (uf) payload.uf = uf;

    const cacheKey = `${(cidade || '').toLowerCase()}|${(uf || '').toLowerCase()}`;
    const cached = citiesCache.get(cacheKey);
    if (cached && Date.now() - cached.ts < CITIES_CACHE_TTL) {
      return res.json({ ok: true, data: cached.data });
    }

    const response = await fetch(`${COOBMAIS_BASE_URL}/Book/GetCities`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await ensureCoobToken()}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    citiesCache.set(cacheKey, { data, ts: Date.now() });
    if (citiesCache.size > 500) {
      const oldest = citiesCache.keys().next().value;
      citiesCache.delete(oldest);
    }
    res.json({ ok: true, data: data });
  } catch (error) {
    console.error('[LP CITIES] Error:', error.message);
    res.status(500).json({ ok: false, error: 'Erro ao buscar cidades', detail: error.message });
  }
});

const hotelCategoryCache = new Map();
const HOTEL_CATEGORY_TTL = 30 * 60 * 1000;

async function getHotelCategory(hotelId) {
  const cached = hotelCategoryCache.get(hotelId);
  if (cached && Date.now() - cached.ts < HOTEL_CATEGORY_TTL) return cached.category;

  try {
    const response = await fetch(`${COOBMAIS_BASE_URL}/Book/InfoHotels?hotel_id=${encodeURIComponent(hotelId)}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${await ensureCoobToken()}` }
    });
    if (response.status !== 200) return null;
    const hotel = await response.json();
    const category = hotel.category || hotel.Category || hotel.category_id || null;
    hotelCategoryCache.set(hotelId, { category, ts: Date.now() });
    if (hotelCategoryCache.size > 500) {
      const oldest = hotelCategoryCache.keys().next().value;
      hotelCategoryCache.delete(oldest);
    }
    return category;
  } catch {
    return null;
  }
}

app.post('/api/lp/hotels', async (req, res) => {
  try {
    const { cidade, uf, checkIn, checkOut, adults, children, rooms, google_place_id, cidade_id } = req.body;

    const childrenCount = typeof children === 'number' ? children : (Array.isArray(children) ? children.length : parseInt(children) || 0);
    const payload = {
      google_place_id: google_place_id || '',
      start_date: checkIn || '',
      end_date: checkOut || '',
      adults: Math.max(2, parseInt(adults) || 2),
      children: childrenCount,
      rooms: parseInt(rooms) || 1
    };

    console.log('[LP HOTELS] Payload:', JSON.stringify(payload));

    const response = await fetch(`${COOBMAIS_BASE_URL}/Book/GetHotels`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await ensureCoobToken()}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    const accommodations = data.accommodations || data.data || [];
    console.log('[LP HOTELS] Found', accommodations.length, 'accommodations');

    let highSeasonMonths = [1, 2, 7, 12];
    try {
      const seasonRow = await query('SELECT high_season_months FROM season_config WHERE id = 1');
      if (seasonRow.rows.length > 0) highSeasonMonths = seasonRow.rows[0].high_season_months;
    } catch {}

    const allRates = await query('SELECT * FROM category_rates');
    const ratesByName = {};
    const ratesById = {};
    allRates.rows.forEach(r => {
      ratesByName[r.category_name.toLowerCase()] = r;
      ratesById[r.category_id] = r;
    });

    const hasAnyRates = allRates.rows.length > 0;

    if (hasAnyRates && checkIn && accommodations.length > 0) {
      const parts = checkIn.split('-');
      const checkInMonth = parts.length >= 2 ? parseInt(parts[1], 10) : new Date(checkIn).getMonth() + 1;
      const isHighSeason = highSeasonMonths.includes(checkInMonth);

      const categoryPromises = accommodations.map(h => getHotelCategory(h.id));
      const categories = await Promise.allSettled(categoryPromises);

      for (let i = 0; i < accommodations.length; i++) {
        const catResult = categories[i];
        const categoryRaw = catResult.status === 'fulfilled' ? catResult.value : null;
        if (!categoryRaw) continue;

        const isNum = !isNaN(categoryRaw);
        const rate = isNum ? ratesById[categoryRaw] : ratesByName[categoryRaw.toLowerCase()];
        if (!rate) continue;

        const lowRate = parseFloat(rate.low_season_rate) || 0;
        const highRate = parseFloat(rate.high_season_rate) || 0;
        const isDiamante = rate.category_name === 'Diamante';
        const appliedRate = isDiamante ? lowRate : (isHighSeason ? (highRate || lowRate) : (lowRate || highRate));

        const h = accommodations[i];
        h.category_name = rate.category_name;
        h.category_low_rate = lowRate;
        h.category_high_rate = highRate;
        h.high_season_months = highSeasonMonths;
        h.season_label = isDiamante ? 'Fixa' : (isHighSeason ? 'Alta' : 'Baixa');

        if (appliedRate && appliedRate > 0) {
          h.original_total_price = h.total_price;
          h.cost = (h.cost || []).map(c => ({ ...c, original_daily: c.daily, daily: appliedRate }));
          h.total_price = h.cost.reduce((sum, c) => sum + (c.daily || 0) + (c.extras || 0), 0);
        }
      }

      console.log('[LP HOTELS] Applied category rates to', accommodations.filter(h => h.category_name).length, 'hotels');
    }

    res.json({ ok: true, data: accommodations });
  } catch (error) {
    console.error('[LP HOTELS] Error:', error.message);
    res.status(500).json({ ok: false, error: 'Erro ao buscar hotéis', detail: error.message });
  }
});

app.get('/api/lp/hotel-info', async (req, res) => {
  try {
    const hotelId = req.query.hotel_id;
    if (!hotelId) {
      return res.status(400).json({ ok: false, error: 'hotel_id é obrigatório' });
    }

    console.log('[LP HOTEL-INFO] Fetching info for hotel:', hotelId);

    const response = await fetch(`${COOBMAIS_BASE_URL}/Book/InfoHotels?hotel_id=${encodeURIComponent(hotelId)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${await ensureCoobToken()}`
      }
    });

    const rawText = await response.text();
    console.log('[LP HOTEL-INFO] Status:', response.status, 'Body length:', rawText.length);

    if (!rawText || rawText.trim() === '' || response.status !== 200) {
      return res.json({ ok: false, data: null });
    }

    const hotel = JSON.parse(rawText);

    const categoryRaw = hotel.category || hotel.Category || hotel.category_id || null;

    let categoryRate = null;
    let categoryId = categoryRaw;
    if (categoryRaw) {
      try {
        const isNumeric = !isNaN(categoryRaw);
        let rateRow;
        if (isNumeric) {
          rateRow = await query('SELECT * FROM category_rates WHERE category_id = $1', [categoryRaw]);
        } else {
          rateRow = await query('SELECT * FROM category_rates WHERE LOWER(category_name) = LOWER($1)', [categoryRaw]);
        }
        if (rateRow.rows.length > 0) {
          categoryRate = rateRow.rows[0];
          categoryId = categoryRate.category_id;
        }
        console.log('[LP HOTEL-INFO] Category lookup:', categoryRaw, '→', categoryRate ? `Found: ${categoryRate.category_name} (low: ${categoryRate.low_season_rate}, high: ${categoryRate.high_season_rate})` : 'Not found');
      } catch (e) {
        console.error('[LP HOTEL-INFO] Category rate lookup error:', e.message);
      }
    }

    let highSeasonMonths = [1, 2, 7, 12];
    try {
      const seasonRow = await query('SELECT high_season_months FROM season_config WHERE id = 1');
      if (seasonRow.rows.length > 0) highSeasonMonths = seasonRow.rows[0].high_season_months;
    } catch (e) {}

    const normalized = {
      id: hotel.id || hotelId,
      name: hotel.name || '',
      address: hotel.address || '',
      phone: hotel.phone || '',
      email: hotel.email || '',
      site_url: hotel.site || '',
      google_place_id: hotel.google_place_id || '',
      latitude: hotel.latitude || null,
      longitude: hotel.longitude || null,
      free: hotel.free || '',
      photos: Array.isArray(hotel.photos) ? hotel.photos : [],
      amenities: Array.isArray(hotel.amenities) ? hotel.amenities : [],
      additional_info: {
        info_A: hotel.additional_info?.info_A || '',
        info_B: hotel.additional_info?.info_B || null
      },
      category_id: categoryId,
      category_name: categoryRate?.category_name || null,
      category_low_rate: categoryRate ? parseFloat(categoryRate.low_season_rate) : null,
      category_high_rate: categoryRate ? parseFloat(categoryRate.high_season_rate) : null,
      high_season_months: highSeasonMonths,
    };

    res.json({ ok: true, data: normalized });
  } catch (error) {
    console.error('[LP HOTEL-INFO] Error:', error.message);
    res.status(500).json({ ok: false, error: 'Erro ao buscar informações do hotel', detail: error.message });
  }
});

app.post('/api/lp/info-apartment', async (req, res) => {
  try {
    const token = parseLpToken(req);
    const session = getLpSession(token);
    if (!session) return res.status(401).json({ ok: false, error: 'Sessão expirada' });

    const { hotel_id, start_date, end_date, adults, children, children_age } = req.body;
    if (!hotel_id || !start_date || !end_date) {
      return res.status(400).json({ ok: false, error: 'hotel_id, start_date e end_date são obrigatórios' });
    }

    console.log('[LP INFO-APARTMENT] hotel_id:', hotel_id, 'dates:', start_date, '-', end_date);

    const response = await fetch(`${COOBMAIS_BASE_URL}/Book/InfoApartment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await ensureCoobToken()}`
      },
      body: JSON.stringify({
        hotel_id: parseInt(hotel_id),
        start_date,
        end_date,
        adults: Math.max(2, parseInt(adults) || 2),
        children: parseInt(children) || 0,
        children_age: parseInt(children_age) || 0
      })
    });

    const rawText = await response.text();
    let data;
    try {
      data = JSON.parse(rawText);
    } catch {
      console.log('[LP INFO-APARTMENT] Non-JSON response:', rawText.substring(0, 200));
      const friendlyMsg = rawText.toLowerCase().includes('não localizado')
        ? 'Apartamentos não disponíveis para esta configuração de hóspedes. Tente com pelo menos 2 adultos.'
        : (rawText || 'Hotel não encontrado na Coobmais');
      return res.json({ ok: false, error: friendlyMsg });
    }

    console.log('[LP INFO-APARTMENT] Status:', response.status, 'Apartments:', Array.isArray(data) ? data.length : 'N/A');

    if (!response.ok) {
      const errMsg = data?.message || data?.error || 'Erro ao buscar apartamentos na Coobmais';
      return res.json({ ok: false, error: errMsg });
    }

    res.json({ ok: true, data });
  } catch (error) {
    console.error('[LP INFO-APARTMENT] Error:', error.message);
    res.status(500).json({ ok: false, error: 'Erro ao buscar apartamentos', detail: error.message });
  }
});

const BOOKING_CNPJ = '1573933000130';

async function getAssociateNic(cpfOrCnpj) {
  try {
    const clean = (cpfOrCnpj || '').replace(/\D/g, '');
    const res = await fetch(`${COOBMAIS_BASE_URL}/Associate/GetAssociate?cpfCnpj=${clean}&empCode=38`, {
      headers: { 'Authorization': `Bearer ${await ensureCoobToken()}` }
    });
    const data = await res.json();
    const nic = data?.AssNic || data?.assNic || data?.assnic || data?.nic || data?.codigo || null;
    console.log('[LP ASSOCIATE] Doc:', clean.substring(0, 4) + '***', 'NIC:', nic || 'NOT_FOUND', 'Response keys:', Object.keys(data || {}).join(','));
    return nic ? String(nic) : null;
  } catch (err) {
    console.error('[LP ASSOCIATE] Error:', err.message);
    return null;
  }
}

function translateBookingError(rawMsg) {
  if (!rawMsg) return 'Erro desconhecido ao processar a reserva.';
  if (rawMsg.includes('assnic') || rawMsg.includes('NULL')) {
    return 'Seu cadastro ainda não está vinculado ao sistema de reservas. Entre em contato com o suporte para ativar seu acesso às reservas.';
  }
  if (rawMsg.includes('não encontrado') || rawMsg.includes('not found')) {
    return 'Associado não encontrado no sistema de reservas. Verifique seus dados ou entre em contato com o suporte.';
  }
  if (rawMsg.includes('expirad') || rawMsg.includes('expired')) {
    return 'Sessão expirada. Faça login novamente para continuar.';
  }
  return rawMsg;
}

app.post('/api/lp/availability-book', async (req, res) => {
  try {
    const lpToken = parseLpToken(req);
    const session = getLpSession(lpToken);
    if (!session) return res.status(401).json({ ok: false, error: 'Sessão expirada' });

    const { booking_code, hotel_id } = req.body;
    if (!booking_code || !hotel_id) {
      return res.status(400).json({ ok: false, error: 'booking_code e hotel_id são obrigatórios' });
    }

    const vfbId = await getAssociateNic(BOOKING_CNPJ);
    console.log('[LP AVAILABILITY] booking_code:', booking_code, 'hotel_id:', hotel_id, 'cnpj:', BOOKING_CNPJ.substring(0, 4) + '***', 'vfb:', vfbId || 'NULL');

    if (!vfbId) {
      console.log('[LP AVAILABILITY] Associate not found for CNPJ, cannot proceed');
      return res.json({ ok: false, data: { sucesso: 0, mensagem: 'O cadastro institucional não está vinculado ao sistema de reservas. Entre em contato com o suporte.' } });
    }

    const response = await fetch(`${COOBMAIS_BASE_URL}/Book/AvailabilityBook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await ensureCoobToken()}`
      },
      body: JSON.stringify({
        token: booking_code,
        cpf: BOOKING_CNPJ,
        hotel_id: parseInt(hotel_id),
        vfb_points: 0,
        vfb_identifier: vfbId
      })
    });

    const rawText = await response.text();
    console.log('[LP AVAILABILITY] Status:', response.status, 'Body:', rawText.substring(0, 500));
    let data;
    try { data = JSON.parse(rawText); } catch { data = { sucesso: 0, mensagem: rawText || 'Resposta inválida' }; }
    if (Array.isArray(data)) data = data[0] || { sucesso: 0, mensagem: 'Resposta vazia' };
    const isSuccess = data.sucesso === 1 || data.sucesso === '1' || data.situacao === 1 || data.situacao === '1';
    if (data.mensagem) data.mensagem = translateBookingError(data.mensagem);
    res.json({ ok: isSuccess, data });
  } catch (error) {
    console.error('[LP AVAILABILITY] Error:', error.message);
    res.status(500).json({ ok: false, error: 'Erro ao verificar disponibilidade', detail: error.message });
  }
});

app.post('/api/lp/booking-confirmation', async (req, res) => {
  try {
    const lpToken = parseLpToken(req);
    const session = getLpSession(lpToken);
    if (!session) return res.status(401).json({ ok: false, error: 'Sessão expirada' });

    const { booking_code, hotel_id } = req.body;
    if (!booking_code || !hotel_id) {
      return res.status(400).json({ ok: false, error: 'booking_code e hotel_id são obrigatórios' });
    }

    const vfbId = await getAssociateNic(BOOKING_CNPJ);
    console.log('[LP BOOKING] Confirming:', booking_code, 'hotel_id:', hotel_id, 'cnpj:', BOOKING_CNPJ.substring(0, 4) + '***', 'vfb:', vfbId || 'NULL');

    if (!vfbId) {
      return res.json({ ok: false, data: { sucesso: 0, mensagem: 'O cadastro institucional não está vinculado ao sistema de reservas. Entre em contato com o suporte.' } });
    }

    const response = await fetch(`${COOBMAIS_BASE_URL}/Book/BookingConfirmation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await ensureCoobToken()}`
      },
      body: JSON.stringify({
        token: booking_code,
        cpf: BOOKING_CNPJ,
        hotel_id: parseInt(hotel_id),
        vfb_points: 0,
        vfb_identifier: vfbId
      })
    });

    const rawText = await response.text();
    console.log('[LP BOOKING] Status:', response.status, 'Body:', rawText.substring(0, 500));
    let data;
    try { data = JSON.parse(rawText); } catch { data = { sucesso: 0, mensagem: rawText || 'Resposta inválida' }; }
    if (Array.isArray(data)) data = data[0] || { sucesso: 0, mensagem: 'Resposta vazia' };
    const isSuccess = data.sucesso === 1 || data.sucesso === '1' || data.situacao === 1 || data.situacao === '1';
    if (!data.localizador && data.Localizador) data.localizador = data.Localizador;
    if (data.mensagem) data.mensagem = translateBookingError(data.mensagem);
    if (!data.mensagem && data.Texto) data.mensagem = data.Texto;

    res.json({ ok: isSuccess, data });
  } catch (error) {
    console.error('[LP BOOKING] Error:', error.message);
    res.status(500).json({ ok: false, error: 'Erro ao confirmar reserva', detail: error.message });
  }
});

// ========== CATEGORY RATES (Valor por Categoria) ==========

app.get('/api/lp/category-list', async (req, res) => {
  try {
    const response = await fetch(`${COOBMAIS_BASE_URL}/Book/CategoryList`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await ensureCoobToken()}`
      }
    });
    const data = await response.json();
    res.json({ ok: true, data });
  } catch (error) {
    console.error('[LP CATEGORIES] Error:', error.message);
    res.status(500).json({ ok: false, error: 'Erro ao buscar categorias' });
  }
});

app.get('/api/category-rates', async (req, res) => {
  try {
    const result = await query('SELECT * FROM category_rates ORDER BY category_id');
    res.json({ ok: true, data: result.rows });
  } catch (error) {
    console.error('[CATEGORY RATES] List error:', error.message);
    res.status(500).json({ ok: false, error: 'Erro ao listar valores de categorias' });
  }
});

app.put('/api/category-rates/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { low_season_rate, high_season_rate, category_name } = req.body;

    if (low_season_rate === undefined && high_season_rate === undefined) {
      return res.status(400).json({ ok: false, error: 'low_season_rate ou high_season_rate é obrigatório' });
    }

    const existing = await query('SELECT id FROM category_rates WHERE category_id = $1', [categoryId]);
    if (existing.rows.length > 0) {
      const sets = [];
      const params = [];
      let idx = 1;
      if (low_season_rate !== undefined) { sets.push(`low_season_rate = $${idx++}`); params.push(low_season_rate); }
      if (high_season_rate !== undefined) { sets.push(`high_season_rate = $${idx++}`); params.push(high_season_rate); }
      if (category_name) { sets.push(`category_name = $${idx++}`); params.push(category_name); }
      sets.push(`updated_at = NOW()`);
      params.push(categoryId);
      await query(`UPDATE category_rates SET ${sets.join(', ')} WHERE category_id = $${idx}`, params);
    } else {
      await query(
        'INSERT INTO category_rates (category_id, category_name, low_season_rate, high_season_rate) VALUES ($1, $2, $3, $4)',
        [categoryId, category_name || `Categoria ${categoryId}`, low_season_rate || 0, high_season_rate || 0]
      );
    }

    console.log('[CATEGORY RATES] Updated category', categoryId, 'low:', low_season_rate, 'high:', high_season_rate);
    res.json({ ok: true });
  } catch (error) {
    console.error('[CATEGORY RATES] Update error:', error.message);
    res.status(500).json({ ok: false, error: 'Erro ao atualizar valor da categoria' });
  }
});

app.post('/api/category-rates/sync', async (req, res) => {
  try {
    const response = await fetch(`${COOBMAIS_BASE_URL}/Book/CategoryList`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await ensureCoobToken()}`
      }
    });
    const categories = await response.json();

    if (Array.isArray(categories)) {
      for (const cat of categories) {
        const existing = await query('SELECT id FROM category_rates WHERE category_id = $1', [cat.Id]);
        if (existing.rows.length === 0) {
          await query(
            'INSERT INTO category_rates (category_id, category_name, low_season_rate, high_season_rate) VALUES ($1, $2, 0, 0)',
            [cat.Id, cat.Description]
          );
        } else {
          await query(
            'UPDATE category_rates SET category_name = $1, updated_at = NOW() WHERE category_id = $2',
            [cat.Description, cat.Id]
          );
        }
      }
    }

    const result = await query('SELECT * FROM category_rates ORDER BY category_id');
    console.log('[CATEGORY RATES] Synced', result.rows.length, 'categories');
    res.json({ ok: true, data: result.rows });
  } catch (error) {
    console.error('[CATEGORY RATES] Sync error:', error.message);
    res.status(500).json({ ok: false, error: 'Erro ao sincronizar categorias' });
  }
});

app.get('/api/lp/category-rates-public', async (req, res) => {
  try {
    const result = await query('SELECT category_id, category_name, low_season_rate, high_season_rate FROM category_rates WHERE low_season_rate > 0 OR high_season_rate > 0 ORDER BY category_id');
    const seasonResult = await query('SELECT high_season_months FROM season_config WHERE id = 1');
    const highSeasonMonths = seasonResult.rows[0]?.high_season_months || [1, 2, 7, 12];
    res.json({ ok: true, data: result.rows, high_season_months: highSeasonMonths });
  } catch (error) {
    console.error('[CATEGORY RATES] Public list error:', error.message);
    res.status(500).json({ ok: false, error: 'Erro ao buscar valores' });
  }
});

app.get('/api/season-config', async (req, res) => {
  try {
    const result = await query('SELECT * FROM season_config WHERE id = 1');
    res.json({ ok: true, data: result.rows[0] || { high_season_months: [1, 2, 7, 12] } });
  } catch (error) {
    res.status(500).json({ ok: false, error: 'Erro ao buscar configuração de temporada' });
  }
});

app.put('/api/season-config', async (req, res) => {
  try {
    const { high_season_months } = req.body;
    if (!Array.isArray(high_season_months) || high_season_months.some(m => m < 1 || m > 12)) {
      return res.status(400).json({ ok: false, error: 'Meses inválidos. Use valores de 1 a 12.' });
    }
    await query(
      'INSERT INTO season_config (id, high_season_months, updated_at) VALUES (1, $1, NOW()) ON CONFLICT (id) DO UPDATE SET high_season_months = $1, updated_at = NOW()',
      [high_season_months]
    );
    console.log('[SEASON CONFIG] Updated high_season_months:', high_season_months);
    res.json({ ok: true });
  } catch (error) {
    console.error('[SEASON CONFIG] Update error:', error.message);
    res.status(500).json({ ok: false, error: 'Erro ao atualizar configuração de temporada' });
  }
});

// ========== BOOKINGS (Minhas Reservas) ==========

app.post('/api/lp/bookings', async (req, res) => {
  try {
    const lpToken = parseLpToken(req);
    const session = getLpSession(lpToken);
    if (!session) return res.status(401).json({ ok: false, error: 'Sessão expirada' });

    let { hotel_id, hotel_name, hotel_city, hotel_state, hotel_image, apartment_type, apartment_description, booking_code, localizador, check_in, check_out, adults, children, total_price, metadata } = req.body;

    if (hotel_city && typeof hotel_city === 'object') {
      hotel_city = hotel_city.name || JSON.stringify(hotel_city);
    }

    if (!localizador) {
      return res.status(400).json({ ok: false, error: 'Localizador é obrigatório' });
    }

    const existing = await query('SELECT id FROM bookings WHERE localizador = $1', [localizador]);
    if (existing.rows.length > 0) {
      return res.json({ ok: true, data: existing.rows[0], message: 'Reserva já registrada' });
    }

    const result = await query(
      `INSERT INTO bookings (user_id, hotel_id, hotel_name, hotel_city, hotel_state, hotel_image, apartment_type, apartment_description, booking_code, localizador, check_in, check_out, adults, children, total_price, status, metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) RETURNING *`,
      [session.userId, hotel_id || null, hotel_name || null, hotel_city || null, hotel_state || null, hotel_image || null, apartment_type || null, apartment_description || null, booking_code || null, localizador, check_in || null, check_out || null, adults || 1, children || 0, total_price || 0, 'confirmed', metadata ? JSON.stringify(metadata) : '{}']
    );

    console.log('[LP BOOKINGS] Created booking:', localizador, 'user:', session.userId);

    try {
      const userRow = await query('SELECT name, phone FROM users WHERE id = $1', [session.userId]);
      const u = userRow.rows[0];
      if (u?.phone) {
        triggerWhatsAppFlow('booking_confirmed', {
          nome: u.name || '',
          hotel: hotel_name || '',
          checkin: check_in || '',
          checkout: check_out || '',
          localizador: localizador || '',
          valor: total_price ? String(total_price) : '',
        }, u.phone).catch(() => {});
      }
    } catch(e) {}

    res.json({ ok: true, data: result.rows[0] });
  } catch (error) {
    console.error('[LP BOOKINGS] Create error:', error.message);
    res.status(500).json({ ok: false, error: 'Erro ao salvar reserva' });
  }
});

app.get('/api/lp/bookings', async (req, res) => {
  try {
    const lpToken = parseLpToken(req);
    const session = getLpSession(lpToken);
    if (!session) return res.status(401).json({ ok: false, error: 'Sessão expirada' });

    const result = await query(
      `SELECT b.*,
              COALESCE(p1.vindi_bill_id, p2.vindi_bill_id) as vindi_bill_id,
              COALESCE(p1.status, p2.status) as payment_status,
              COALESCE(p1.payment_method, p2.payment_method) as payment_method,
              COALESCE(p1.amount, p2.amount) as payment_amount
       FROM bookings b
       LEFT JOIN payments p1 ON b.payment_id = p1.id
       LEFT JOIN payments p2 ON b.localizador = p2.booking_locator AND b.payment_id IS NULL
       WHERE b.user_id = $1
       ORDER BY b.created_at DESC`,
      [session.userId]
    );

    const now = new Date();
    const bookings = result.rows.map(b => {
      let displayStatus = b.status;
      if (b.status === 'confirmed' && b.check_out && new Date(b.check_out) < now) {
        displayStatus = 'completed';
      }
      return { ...b, display_status: displayStatus };
    });

    res.json({ ok: true, data: bookings });
  } catch (error) {
    console.error('[LP BOOKINGS] List error:', error.message);
    res.status(500).json({ ok: false, error: 'Erro ao listar reservas' });
  }
});

app.patch('/api/lp/bookings/:id/cancel', async (req, res) => {
  try {
    const lpToken = parseLpToken(req);
    const session = getLpSession(lpToken);
    if (!session) return res.status(401).json({ ok: false, error: 'Sessão expirada' });

    const { id } = req.params;
    const booking = await query('SELECT * FROM bookings WHERE id = $1 AND user_id = $2', [id, session.userId]);
    if (booking.rows.length === 0) return res.status(404).json({ ok: false, error: 'Reserva não encontrada' });

    const b = booking.rows[0];
    if (b.status === 'cancelled') return res.json({ ok: true, data: b, message: 'Reserva já cancelada' });

    const cancelToken = b.booking_code || b.localizador;
    console.log('[LP BOOKINGS] Cancel using token (booking_code):', cancelToken, 'localizador:', b.localizador);

    let bookingCancelOk = false;
    let bookingCancelMsg = '';
    try {
      const cancelRes = await fetch(`${COOBMAIS_BASE_URL}/Book/CancellationBook`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await ensureCoobToken()}`
        },
        body: JSON.stringify({ token: cancelToken })
      });
      const cancelText = await cancelRes.text();
      console.log('[LP BOOKINGS] Cancel API raw response:', cancelText, 'status:', cancelRes.status);
      let cancelData;
      try { cancelData = JSON.parse(cancelText); } catch { cancelData = cancelText; }
      const cd = Array.isArray(cancelData) ? cancelData[0] : cancelData;
      bookingCancelOk = cancelRes.ok && (
        cd?.situacao === 1 || cd?.situacao === '1' ||
        cd?.sucesso === 1 || cd?.sucesso === '1' ||
        cd?.resultado === 1 || cd?.resultado === '1' ||
        cd?.Situacao === 1 || cd?.Situacao === '1' ||
        cd?.success === true || cd?.Success === true ||
        (typeof cd === 'string' && cd.toLowerCase().includes('sucesso'))
      );
      if (!bookingCancelOk && cancelRes.ok && cd && !cd.situacao && !cd.resultado && !cd.sucesso) {
        bookingCancelOk = true;
      }
      bookingCancelMsg = cd?.Texto || cd?.texto || cd?.mensagem || cd?.Mensagem || cd?.message || '';
      console.log('[LP BOOKINGS] Cancel parsed:', JSON.stringify(cd), 'bookingCancelOk:', bookingCancelOk);
    } catch (err) {
      console.error('[LP BOOKINGS] Cancel API error:', err.message);
      bookingCancelMsg = 'Erro de conexao com a operadora';
    }

    if (!bookingCancelOk) {
      console.log('[LP BOOKINGS] Booking cancel FAILED, aborting. Msg:', bookingCancelMsg);
      return res.json({ ok: false, error: bookingCancelMsg || 'Nao foi possivel cancelar a hospedagem na operadora.' });
    }

    let paymentCancelOk = true;
    let paymentCancelMsg = '';
    const paymentRow = await query('SELECT * FROM payments WHERE booking_locator = $1', [b.localizador]);
    if (paymentRow.rows.length > 0 && paymentRow.rows[0].vindi_bill_id) {
      const billId = paymentRow.rows[0].vindi_bill_id;
      const payStatus = paymentRow.rows[0].status;
      console.log('[LP BOOKINGS] Cancelling Vindi bill:', billId, 'current status:', payStatus);
      if (payStatus !== 'canceled' && payStatus !== 'cancelled') {
        try {
          const vindiRes = await vindiRequest('DELETE', `/bills/${billId}`);
          console.log('[LP BOOKINGS] Vindi cancel response:', vindiRes.status, JSON.stringify(vindiRes.data));
          if (vindiRes.status >= 200 && vindiRes.status < 300) {
            await query('UPDATE payments SET status = $1 WHERE vindi_bill_id = $2', ['canceled', billId]);
            console.log('[LP BOOKINGS] Payment cancelled in DB for bill:', billId);
          } else {
            paymentCancelOk = false;
            paymentCancelMsg = vindiRes.data?.errors?.[0]?.message || vindiRes.data?.message || `Erro Vindi HTTP ${vindiRes.status}`;
          }
        } catch (err) {
          console.error('[LP BOOKINGS] Vindi cancel error:', err.message);
          paymentCancelOk = false;
          paymentCancelMsg = 'Erro ao cancelar pagamento na Vindi';
        }
      }
    }

    if (!paymentCancelOk) {
      console.log('[LP BOOKINGS] Payment cancel FAILED, aborting. Msg:', paymentCancelMsg);
      return res.json({ ok: false, error: `Hospedagem cancelada, mas o pagamento nao pode ser cancelado: ${paymentCancelMsg}` });
    }

    await query('UPDATE bookings SET status = $1, updated_at = NOW() WHERE id = $2', ['cancelled', id]);
    console.log('[LP BOOKINGS] Cancelled booking:', id, 'localizador:', b.localizador);

    try {
      const userRow = await query('SELECT name, phone FROM users WHERE id = $1', [session.userId]);
      const u = userRow.rows[0];
      if (u?.phone) {
        triggerWhatsAppFlow('booking_cancelled', {
          nome: u.name || '',
          hotel: b.hotel_name || '',
          checkin: b.check_in || '',
          checkout: b.check_out || '',
          localizador: b.localizador || '',
          valor: b.total_price ? String(b.total_price) : '',
        }, u.phone).catch(() => {});
      }
    } catch(e) {}

    res.json({ ok: true, message: bookingCancelMsg || 'Reserva e pagamento cancelados com sucesso' });
  } catch (error) {
    console.error('[LP BOOKINGS] Cancel error:', error.message);
    res.status(500).json({ ok: false, error: 'Erro ao cancelar reserva' });
  }
});

app.patch('/api/lp/bookings/:id/payment', async (req, res) => {
  try {
    const lpToken = parseLpToken(req);
    const session = getLpSession(lpToken);
    if (!session) return res.status(401).json({ ok: false, error: 'Sessão expirada' });

    const { id } = req.params;
    const { payment_id } = req.body;
    await query('UPDATE bookings SET payment_id = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3', [payment_id, id, session.userId]);
    res.json({ ok: true });
  } catch (error) {
    console.error('[LP BOOKINGS] Payment link error:', error.message);
    res.status(500).json({ ok: false, error: 'Erro ao vincular pagamento' });
  }
});

app.patch('/api/lp/bookings/:localizador/link-payment', async (req, res) => {
  try {
    const lpToken = parseLpToken(req);
    const session = getLpSession(lpToken);
    if (!session) return res.status(401).json({ ok: false, error: 'Sessão expirada' });

    const { localizador } = req.params;
    const { bill_id } = req.body;
    if (!bill_id) return res.status(400).json({ ok: false, error: 'bill_id obrigatório' });

    const paymentRow = await query('SELECT id FROM payments WHERE vindi_bill_id = $1 LIMIT 1', [String(bill_id)]);
    if (paymentRow.rows.length > 0) {
      await query('UPDATE payments SET booking_locator = $1 WHERE vindi_bill_id = $2', [localizador, String(bill_id)]);
      await query('UPDATE bookings SET payment_id = $1, updated_at = NOW() WHERE localizador = $2 AND user_id = $3', [paymentRow.rows[0].id, localizador, session.userId]);
    }

    console.log('[LP BOOKINGS] Linked payment bill_id:', bill_id, 'to localizador:', localizador);
    res.json({ ok: true });
  } catch (error) {
    console.error('[LP BOOKINGS] Link payment error:', error.message);
    res.status(500).json({ ok: false, error: 'Erro ao vincular pagamento' });
  }
});

app.post('/api/vindi/cancel-bill', async (req, res) => {
  try {
    const lpToken = parseLpToken(req);
    const session = getLpSession(lpToken);
    if (!session) return res.status(401).json({ ok: false, error: 'Sessão expirada' });

    const { bill_id } = req.body;
    if (!bill_id || !VINDI_API_KEY) {
      return res.status(400).json({ ok: false, error: 'bill_id e chave Vindi são obrigatórios' });
    }

    console.log('[VINDI] Cancelling bill:', bill_id);
    const response = await fetch(`https://${VINDI_BASE_URL}/api/v1/bills/${bill_id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(VINDI_API_KEY + ':').toString('base64'),
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      await query("UPDATE payments SET status = 'cancelled' WHERE vindi_bill_id = $1", [String(bill_id)]);
      console.log('[VINDI] Bill cancelled successfully:', bill_id);
      res.json({ ok: true });
    } else {
      const text = await response.text();
      console.error('[VINDI] Cancel bill error:', response.status, text);
      res.json({ ok: false, error: 'Erro ao cancelar fatura na Vindi' });
    }
  } catch (error) {
    console.error('[VINDI] Cancel bill error:', error.message);
    res.status(500).json({ ok: false, error: 'Erro ao cancelar fatura' });
  }
});

app.get('/api/admin/bookings', async (req, res) => {
  try {
    const result = await query(
      `SELECT b.*, u.name as user_name, u.cpf as user_cpf, u.email as user_email,
              COALESCE(p1.status, p2.status) as payment_status,
              COALESCE(p1.payment_method, p2.payment_method) as payment_method,
              COALESCE(p1.amount, p2.amount) as payment_amount
       FROM bookings b
       LEFT JOIN users u ON b.user_id = u.id
       LEFT JOIN payments p1 ON b.payment_id = p1.id
       LEFT JOIN payments p2 ON b.localizador = p2.booking_locator AND b.payment_id IS NULL
       ORDER BY b.created_at DESC`
    );
    res.json({ ok: true, data: result.rows });
  } catch (error) {
    console.error('[ADMIN BOOKINGS] Error:', error.message);
    res.status(500).json({ ok: false, error: 'Erro ao listar reservas' });
  }
});

// ========== VINDI PAYMENT INTEGRATION ==========

let VINDI_API_KEY = process.env.VINDI_API_KEY;
let VINDI_BASE_URL = 'app.vindi.com.br';
let VINDI_PRODUCT_ID = process.env.VINDI_PRODUCT_ID ? parseInt(process.env.VINDI_PRODUCT_ID) : 1980987;
if (apiConfigOverrides.Vindi?.token) VINDI_API_KEY = apiConfigOverrides.Vindi.token;
if (apiConfigOverrides.Vindi?.productId) VINDI_PRODUCT_ID = parseInt(apiConfigOverrides.Vindi.productId);
if (apiConfigOverrides.Vindi?.baseUrl) {
  try {
    const u = new URL(apiConfigOverrides.Vindi.baseUrl);
    VINDI_BASE_URL = u.hostname;
  } catch (_) {}
}

function vindiRequest(method, endpoint, body = null) {
  return new Promise((resolve, reject) => {
    const auth = Buffer.from(`${VINDI_API_KEY}:`).toString('base64');
    const options = {
      hostname: VINDI_BASE_URL,
      port: 443,
      path: `/api/v1${endpoint}`,
      method,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch {
          resolve({ status: res.statusCode, data: { raw: data } });
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Vindi API timeout'));
    });

    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

app.get('/api/vindi/payment-methods', async (req, res) => {
  try {
    if (!VINDI_API_KEY) {
      return res.status(500).json({ ok: false, error: 'Chave Vindi não configurada' });
    }
    const result = await vindiRequest('GET', '/payment_methods');
    const methods = (result.data.payment_methods || [])
      .filter(m => m.status === 'active')
      .map(m => ({
        id: m.id,
        name: m.public_name,
        code: m.code,
        type: m.type,
        companies: (m.payment_companies || []).map(c => ({ id: c.id, name: c.name, code: c.code })),
      }));
    res.json({ ok: true, data: methods });
  } catch (error) {
    console.error('[VINDI] Payment methods error:', error.message);
    res.status(500).json({ ok: false, error: 'Erro ao buscar métodos de pagamento' });
  }
});

const VINDI_PRODUCT_ID_CACHE = { id: null };

async function getOrCreateVindiProduct() {
  if (VINDI_PRODUCT_ID_CACHE.id) return VINDI_PRODUCT_ID_CACHE.id;

  if (VINDI_PRODUCT_ID) {
    const fetched = await vindiRequest('GET', `/products/${VINDI_PRODUCT_ID}`);
    if (fetched.data?.product?.id && fetched.data.product.status === 'active') {
      VINDI_PRODUCT_ID_CACHE.id = fetched.data.product.id;
      return fetched.data.product.id;
    }
    console.warn('[VINDI] Configured VINDI_PRODUCT_ID', VINDI_PRODUCT_ID, 'não encontrado/inativo, tentando fallback HOSP_UNYCO');
  }

  const existing = await vindiRequest('GET', '/products?query=code:HOSP_UNYCO');
  const products = existing.data?.products || [];
  if (products.length > 0 && products[0].status === 'active') {
    VINDI_PRODUCT_ID_CACHE.id = products[0].id;
    return products[0].id;
  }

  const created = await vindiRequest('POST', '/products', {
    name: 'Hospedagem Unyco',
    code: 'HOSP_UNYCO',
    pricing_schema: { price: 0, schema_type: 'per_unit' },
  });
  if (created.data?.product?.id) {
    VINDI_PRODUCT_ID_CACHE.id = created.data.product.id;
    return created.data.product.id;
  }
  throw new Error('Não foi possível criar produto na Vindi');
}

async function findOrCreateVindiCustomer(name, email, cpf, phone) {
  const cleanCpf = cpf.replace(/\D/g, '');
  const searchResult = await vindiRequest('GET', `/customers?query=registry_code:${cleanCpf}`);
  const customers = searchResult.data?.customers || [];
  const active = customers.find(c => c.status === 'active');
  if (active) return active.id;

  const inactive = customers.find(c => c.status === 'inactive');
  if (inactive) {
    await vindiRequest('POST', `/customers/${inactive.id}/unarchive`);
    await vindiRequest('PUT', `/customers/${inactive.id}`, { name, email: email || `${cleanCpf}@unyco.com.br` });
    return inactive.id;
  }

  const customerBody = {
    name,
    email: email || `${cleanCpf}@unyco.com.br`,
    registry_code: cleanCpf,
    metadata: { source: 'unyco_lp' },
  };
  if (phone) {
    const cleanPhone = phone.replace(/\D/g, '');
    customerBody.phones = [{ phone_type: 'mobile', number: cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}` }];
  }
  const created = await vindiRequest('POST', '/customers', customerBody);
  if (created.data?.customer?.id) return created.data.customer.id;
  console.error('[VINDI] Customer create failed. Status:', created.status, 'Body:', JSON.stringify(customerBody), 'Errors:', JSON.stringify(created.data?.errors || created.data));
  const errs = (created.data?.errors || []).map(e => `${e.parameter || e.id || 'campo'}: ${e.message}`).join('; ');
  throw new Error(errs || 'Erro ao criar cliente na Vindi');
}

app.post('/api/vindi/create-bill', async (req, res) => {
  try {
    const lpToken = parseLpToken(req);
    const session = getLpSession(lpToken);
    if (!session) return res.status(401).json({ ok: false, error: 'Sessão expirada' });

    if (!VINDI_API_KEY) {
      return res.status(500).json({ ok: false, error: 'Chave Vindi não configurada' });
    }

    const {
      payment_method_code,
      customer_name,
      customer_email,
      customer_cpf,
      customer_phone,
      amount,
      description,
      installments,
      card_number,
      card_expiration,
      card_cvv,
      card_holder_name,
      card_company_code,
      booking_locator,
      hotel_name,
    } = req.body;

    if (!payment_method_code || !customer_name || !customer_cpf || !amount) {
      return res.status(400).json({ ok: false, error: 'Campos obrigatórios: payment_method_code, customer_name, customer_cpf, amount' });
    }

    if (!isValidCPF(customer_cpf)) {
      console.warn('[VINDI] Rejected invalid CPF for customer:', customer_name);
      return res.status(400).json({ ok: false, error: 'CPF inválido. Verifique seus dados de cadastro e tente novamente.' });
    }

    console.log('[VINDI] Creating bill:', JSON.stringify({
      method: payment_method_code,
      amount,
      customer: customer_name,
      locator: booking_locator,
    }));

    const productId = await getOrCreateVindiProduct();
    const customerId = await findOrCreateVindiCustomer(customer_name, customer_email, customer_cpf.replace(/\D/g, ''), customer_phone);

    const billBody = {
      customer_id: customerId,
      payment_method_code,
      bill_items: [{
        product_id: productId,
        amount: parseFloat(amount),
      }],
      installments: installments || 1,
      metadata: {},
    };

    if (booking_locator) {
      billBody.metadata = { booking_locator, hotel_name };
    }

    if (payment_method_code === 'credit_card' && card_number) {
      const profileResult = await vindiRequest('POST', '/payment_profiles', {
        holder_name: card_holder_name || customer_name,
        registry_code: customer_cpf.replace(/\D/g, ''),
        card_number: card_number.replace(/\s/g, ''),
        card_expiration: card_expiration,
        card_cvv: card_cvv,
        customer_id: customerId,
        payment_method_code: 'credit_card',
        payment_company_code: card_company_code || 'visa',
      });

      if (profileResult.data?.payment_profile?.id) {
        billBody.payment_profile = { id: profileResult.data.payment_profile.id };
      } else {
        const profileErrors = profileResult.data?.errors || [];
        const profileErrMsg = profileErrors.map(e => e.message).join('; ') || 'Erro ao validar cartão';
        console.error('[VINDI] Payment profile error:', JSON.stringify(profileErrors));
        return res.status(422).json({ ok: false, error: profileErrMsg });
      }
    }

    const result = await vindiRequest('POST', '/bills', billBody);
    console.log('[VINDI] Response status:', result.status, 'Bill ID:', result.data?.bill?.id);

    if (result.status === 201 || result.status === 200) {
      const bill = result.data.bill || {};
      const charge = bill.charges?.[0] || {};

      await query(
        `INSERT INTO payments (booking_locator, hotel_name, guest_name, guest_cpf, guest_email, amount, payment_method, vindi_bill_id, vindi_charge_id, vindi_customer_id, status, print_url, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          booking_locator || null,
          hotel_name || null,
          customer_name,
          customer_cpf,
          customer_email || null,
          amount,
          payment_method_code,
          bill.id || null,
          charge.id || null,
          customerId,
          ({'paid':'paid','charge_underpaid':'paid','pending':'pending','waiting':'pending','processing':'pending','canceled':'canceled','cancelled':'canceled','charge_canceled_dev':'canceled','review':'pending','attempted':'pending'}[charge.status || bill.status] || charge.status || bill.status || 'pending'),
          charge.print_url || null,
          JSON.stringify({ vindi_response: { bill_id: bill.id, charge_id: charge.id, charge_status: charge.status } }),
        ]
      );

      const lastTx = charge.last_transaction || {};
      const gwFields = lastTx.gateway_response_fields || {};
      const pixData = (payment_method_code === 'pix' || payment_method_code === 'pix_bank_slip') ? {
        qrcode_original_path: gwFields.qrcode_original_path || gwFields.qrcode_text || gwFields.qr_code_emv || gwFields.qrCodeEmv || null,
        qrcode_path: gwFields.qrcode_path || gwFields.qr_code_image_url || gwFields.qrCodeImageUrl || null,
        max_days_to_keep_waiting_payment: gwFields.max_days_to_keep_waiting_payment || null,
      } : null;

      res.json({
        ok: true,
        data: {
          bill_id: bill.id,
          bill_url: bill.url,
          charge_id: charge.id,
          charge_status: charge.status,
          print_url: charge.print_url || null,
          amount: bill.amount,
          status: charge.status || bill.status,
          paid_at: charge.paid_at,
          payment_method: payment_method_code,
          pix: pixData,
        },
      });
    } else {
      const errors = result.data.errors || [];
      const errorMsg = errors.map(e => e.message || e.id).join('; ') || 'Erro ao criar fatura';
      console.error('[VINDI] Error creating bill:', JSON.stringify(errors));
      res.status(result.status || 422).json({ ok: false, error: errorMsg, details: errors });
    }
  } catch (error) {
    console.error('[VINDI] Create bill error:', error.message, error.stack);
    const msg = error.message || '';
    const isVindiValidationError = /registry_code|email|phone|name|number|cpf|inválido|invalid|obrigat/i.test(msg) && msg.length < 250;
    res.status(500).json({
      ok: false,
      error: isVindiValidationError ? msg : 'Erro ao processar pagamento. Tente novamente.'
    });
  }
});

app.get('/api/payments', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, method, search, sort = 'created_at', order = 'desc' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (status && status !== 'all') {
      conditions.push(`status = $${paramIndex++}`);
      params.push(status);
    }
    if (method && method !== 'all') {
      conditions.push(`payment_method = $${paramIndex++}`);
      params.push(method);
    }
    if (search) {
      conditions.push(`(guest_name ILIKE $${paramIndex} OR guest_cpf ILIKE $${paramIndex} OR booking_locator ILIKE $${paramIndex} OR hotel_name ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const allowedSort = ['created_at', 'amount', 'guest_name', 'status'].includes(sort) ? sort : 'created_at';
    const allowedOrder = order === 'asc' ? 'ASC' : 'DESC';

    const countResult = await query(`SELECT COUNT(*) FROM payments ${where}`, params);
    const total = parseInt(countResult.rows[0].count);

    const dataResult = await query(
      `SELECT * FROM payments ${where} ORDER BY ${allowedSort} ${allowedOrder} LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
      [...params, parseInt(limit), offset]
    );

    const statsResult = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'paid') as paid,
        COUNT(*) FILTER (WHERE status = 'canceled') as canceled,
        COALESCE(SUM(amount), 0) as total_amount,
        COALESCE(SUM(amount) FILTER (WHERE status = 'paid'), 0) as paid_amount,
        COALESCE(SUM(amount) FILTER (WHERE status = 'pending'), 0) as pending_amount,
        COUNT(*) FILTER (WHERE payment_method = 'credit_card') as credit_card_count,
        COUNT(*) FILTER (WHERE payment_method = 'bank_slip') as bank_slip_count,
        COUNT(*) FILTER (WHERE payment_method IN ('pix','pix_bank_slip')) as pix_count
      FROM payments
    `);

    res.json({
      ok: true,
      data: dataResult.rows,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) },
      stats: statsResult.rows[0]
    });
  } catch (error) {
    console.error('[PAYMENTS] List error:', error.message);
    res.status(500).json({ ok: false, error: 'Erro ao listar pagamentos' });
  }
});

app.post('/api/payments/:id/refresh', async (req, res) => {
  try {
    const payment = await query('SELECT * FROM payments WHERE id = $1', [req.params.id]);
    if (payment.rows.length === 0) return res.status(404).json({ ok: false, error: 'Pagamento não encontrado' });

    const p = payment.rows[0];
    if (!p.vindi_bill_id) return res.status(400).json({ ok: false, error: 'Pagamento sem fatura Vindi vinculada' });

    const result = await vindiRequest('GET', `/bills/${p.vindi_bill_id}`);
    if (result.status === 200) {
      const bill = result.data.bill || result.data;
      const charge = bill.charges?.[0] || {};
      const rawStatus = charge.status || bill.status || p.status;
      const VINDI_STATUS_MAP = {
        'paid': 'paid', 'charge_underpaid': 'paid',
        'pending': 'pending', 'waiting': 'pending', 'processing': 'pending',
        'canceled': 'canceled', 'cancelled': 'canceled', 'charge_canceled_dev': 'canceled',
        'review': 'pending', 'attempted': 'pending',
      };
      const newStatus = VINDI_STATUS_MAP[rawStatus] || rawStatus;

      await query(
        'UPDATE payments SET status = $1, print_url = COALESCE($2, print_url), updated_at = NOW() WHERE id = $3',
        [newStatus, charge.print_url || null, req.params.id]
      );

      res.json({
        ok: true,
        data: { status: newStatus, charge_status: charge.status, paid_at: charge.paid_at, print_url: charge.print_url }
      });
    } else {
      res.status(result.status).json({ ok: false, error: 'Erro ao consultar fatura na Vindi' });
    }
  } catch (error) {
    console.error('[PAYMENTS] Refresh error:', error.message);
    res.status(500).json({ ok: false, error: 'Erro ao atualizar status' });
  }
});

app.get('/api/vindi/bill/:id', async (req, res) => {
  try {
    const lpToken = parseLpToken(req);
    const session = getLpSession(lpToken);
    if (!session) return res.status(401).json({ ok: false, error: 'Sessão expirada' });

    if (!VINDI_API_KEY) {
      return res.status(500).json({ ok: false, error: 'Chave Vindi não configurada' });
    }

    const billId = req.params.id;
    const ownership = await query(
      `SELECT p.guest_cpf FROM payments p WHERE p.vindi_bill_id = $1 LIMIT 1`,
      [billId]
    );
    if (ownership.rows.length === 0) {
      return res.status(404).json({ ok: false, error: 'Fatura não encontrada' });
    }
    const userRow = await query('SELECT cpf FROM users WHERE id = $1 LIMIT 1', [session.userId]);
    const userCpf = (userRow.rows[0]?.cpf || '').replace(/\D/g, '');
    const billCpf = (ownership.rows[0]?.guest_cpf || '').replace(/\D/g, '');
    if (!userCpf || !billCpf || userCpf !== billCpf) {
      return res.status(403).json({ ok: false, error: 'Acesso negado' });
    }

    const result = await vindiRequest('GET', `/bills/${billId}`);
    if (result.status === 200) {
      const bill = result.data.bill || result.data;
      const charge = bill.charges?.[0] || {};
      res.json({
        ok: true,
        data: {
          bill_id: bill.id,
          status: bill.status,
          amount: bill.amount,
          charge_status: charge.status,
          paid_at: charge.paid_at,
          print_url: charge.print_url,
          bill_url: bill.url,
        },
      });
    } else {
      res.status(result.status).json({ ok: false, error: 'Fatura não encontrada' });
    }
  } catch (error) {
    console.error('[VINDI] Get bill error:', error.message);
    res.status(500).json({ ok: false, error: 'Erro ao consultar fatura' });
  }
});

// ========== PRODUCTION SPA FALLBACK ==========

// ========== WHATSAPP AUTOMATION ==========

const WHATSAPP_DEFAULTS = {
  api_url: process.env.WHATSAPP_API_URL || 'https://api.wescctech.com.br/core/v2/api/chats/send-text',
  access_token: process.env.WHATSAPP_API_TOKEN || ''
};

async function getWhatsAppConfig() {
  try {
    const result = await query("SELECT value FROM system_config WHERE key = 'whatsapp_config'");
    if (result.rows.length > 0 && result.rows[0].value) {
      const cfg = result.rows[0].value;
      return {
        api_url: cfg.api_url || WHATSAPP_DEFAULTS.api_url,
        access_token: cfg.access_token || WHATSAPP_DEFAULTS.access_token
      };
    }
  } catch (e) {}
  return { ...WHATSAPP_DEFAULTS };
}

app.get('/api/whatsapp/config', async (req, res) => {
  try {
    const cfg = await getWhatsAppConfig();
    res.json({ ok: true, data: { api_url: cfg.api_url, access_token: cfg.access_token ? '••••' + cfg.access_token.slice(-6) : '' } });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.put('/api/whatsapp/config', async (req, res) => {
  try {
    const { api_url, access_token } = req.body;
    const current = await getWhatsAppConfig();
    const newConfig = {
      api_url: api_url || current.api_url,
      access_token: (access_token && !access_token.startsWith('••••')) ? access_token : current.access_token
    };
    await query(
      `INSERT INTO system_config (key, value, updated_at) VALUES ('whatsapp_config', $1, NOW())
       ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW()`,
      [JSON.stringify(newConfig)]
    );
    res.json({ ok: true, message: 'Configuração WhatsApp atualizada' });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

async function sendWhatsAppMessage(phone, message, flowId = null, flowName = null, metadata = {}) {
  const cleanPhone = '55' + (phone || '').replace(/\D/g, '');
  if (cleanPhone.length < 12) {
    console.log('[WHATSAPP] Invalid phone:', phone);
    return { ok: false, error: 'Telefone inválido' };
  }

  try {
    const whaCfg = await getWhatsAppConfig();
    const res = await fetch(whaCfg.api_url, {
      method: 'POST',
      headers: {
        'access-token': whaCfg.access_token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ forceSend: true, message, number: cleanPhone })
    });
    const data = await res.text();
    console.log('[WHATSAPP] Sent to', cleanPhone, '- status:', res.status);

    await query(
      `INSERT INTO whatsapp_logs (flow_id, flow_name, phone, message, status, metadata) VALUES ($1, $2, $3, $4, $5, $6)`,
      [flowId, flowName || 'manual', cleanPhone, message, res.ok ? 'sent' : 'error', JSON.stringify({ ...metadata, api_status: res.status, response: data.substring(0, 500) })]
    );

    if (flowId) {
      await query('UPDATE whatsapp_flows SET send_count = send_count + 1, last_sent_at = NOW() WHERE id = $1', [flowId]);
    }

    return { ok: res.ok, status: res.status };
  } catch (err) {
    console.error('[WHATSAPP] Send error:', err.message);
    await query(
      `INSERT INTO whatsapp_logs (flow_id, flow_name, phone, message, status, error_message) VALUES ($1, $2, $3, $4, 'error', $5)`,
      [flowId, flowName || 'manual', cleanPhone, message, err.message]
    );
    return { ok: false, error: err.message };
  }
}

function renderTemplate(template, vars) {
  let result = template;
  Object.entries(vars).forEach(([key, value]) => {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value || '');
  });
  result = result.replace(/\\n/g, '\n');
  return result;
}

async function triggerWhatsAppFlow(eventName, vars, phone) {
  try {
    const flows = await query('SELECT * FROM whatsapp_flows WHERE trigger_event = $1 AND enabled = true', [eventName]);
    for (const flow of flows.rows) {
      const message = renderTemplate(flow.message_template, vars);
      if (flow.delay_minutes > 0) {
        setTimeout(() => {
          sendWhatsAppMessage(phone, message, flow.id, flow.name, { event: eventName, vars });
        }, flow.delay_minutes * 60 * 1000);
        console.log(`[WHATSAPP] Flow "${flow.name}" scheduled for ${flow.delay_minutes}min`);
      } else {
        await sendWhatsAppMessage(phone, message, flow.id, flow.name, { event: eventName, vars });
      }
    }
  } catch (err) {
    console.error('[WHATSAPP] Trigger error:', err.message);
  }
}

app.get('/api/whatsapp/flows', async (req, res) => {
  try {
    const result = await query('SELECT * FROM whatsapp_flows ORDER BY created_at ASC');
    res.json({ ok: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.get('/api/whatsapp/flows/:id', async (req, res) => {
  try {
    const result = await query('SELECT * FROM whatsapp_flows WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ ok: false, error: 'Fluxo não encontrado' });
    res.json({ ok: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post('/api/whatsapp/flows', async (req, res) => {
  try {
    const { name, slug, description, trigger_event, message_template, enabled, delay_minutes, conditions, metadata } = req.body;
    if (!name || !trigger_event || !message_template) return res.status(400).json({ ok: false, error: 'Campos obrigatórios: name, trigger_event, message_template' });
    const finalSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const result = await query(
      `INSERT INTO whatsapp_flows (name, slug, description, trigger_event, message_template, enabled, delay_minutes, conditions, metadata) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [name, finalSlug, description || '', trigger_event, message_template, enabled !== false, delay_minutes || 0, JSON.stringify(conditions || {}), JSON.stringify(metadata || {})]
    );
    res.json({ ok: true, data: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ ok: false, error: 'Já existe um fluxo com este slug' });
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.put('/api/whatsapp/flows/:id', async (req, res) => {
  try {
    const { name, description, trigger_event, message_template, enabled, delay_minutes, conditions, metadata } = req.body;
    const result = await query(
      `UPDATE whatsapp_flows SET name = COALESCE($1, name), description = COALESCE($2, description), trigger_event = COALESCE($3, trigger_event), message_template = COALESCE($4, message_template), enabled = COALESCE($5, enabled), delay_minutes = COALESCE($6, delay_minutes), conditions = COALESCE($7, conditions), metadata = COALESCE($8, metadata), updated_at = NOW() WHERE id = $9 RETURNING *`,
      [name, description, trigger_event, message_template, enabled, delay_minutes, conditions ? JSON.stringify(conditions) : null, metadata ? JSON.stringify(metadata) : null, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ ok: false, error: 'Fluxo não encontrado' });
    res.json({ ok: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.delete('/api/whatsapp/flows/:id', async (req, res) => {
  try {
    const result = await query('DELETE FROM whatsapp_flows WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ ok: false, error: 'Fluxo não encontrado' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.patch('/api/whatsapp/flows/:id/toggle', async (req, res) => {
  try {
    const result = await query('UPDATE whatsapp_flows SET enabled = NOT enabled, updated_at = NOW() WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ ok: false, error: 'Fluxo não encontrado' });
    res.json({ ok: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

const activeFlowTests = new Map();

function executeFlowTest(testId, phone, flowNodes, flowId) {
  const totalMessages = flowNodes.filter(n => n.type === 'message').length;
  const state = { status: 'running', sent: 0, total: totalMessages, currentStep: '', error: null, schedule: [] };
  activeFlowTests.set(testId, state);

  let accumulatedDelay = 0;
  const steps = [];
  for (const node of flowNodes) {
    if (node.type === 'delay') {
      accumulatedDelay += (node.data.delay_minutes || 0);
    } else if (node.type === 'message' && node.data.message_template) {
      steps.push({ delay: accumulatedDelay, message: node.data.message_template.replace(/\\n/g, '\n') });
      accumulatedDelay = 0;
    }
  }

  state.schedule = steps.map((s, i) => ({
    step: i + 1,
    delay: s.delay,
    status: 'pending'
  }));

  (async () => {
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      state.schedule[i].status = 'waiting';
      if (step.delay > 0) {
        state.currentStep = `Aguardando ${step.delay}min antes da mensagem ${i + 1}...`;
        state.schedule[i].status = 'delaying';
        await new Promise(resolve => setTimeout(resolve, step.delay * 60 * 1000));
      }
      state.currentStep = `Enviando mensagem ${i + 1} de ${totalMessages}...`;
      state.schedule[i].status = 'sending';
      try {
        await sendWhatsAppMessage(phone, step.message, flowId, 'teste-manual', { step: i + 1, total: totalMessages });
        state.sent++;
        state.schedule[i].status = 'sent';
      } catch (err) {
        state.schedule[i].status = 'error';
        state.error = err.message;
      }
    }
    state.status = state.error ? 'error' : 'completed';
    state.currentStep = state.error ? `Erro: ${state.error}` : 'Fluxo completo!';
    setTimeout(() => activeFlowTests.delete(testId), 300000);
  })();
}

app.post('/api/whatsapp/test', async (req, res) => {
  try {
    const { phone, flow_id } = req.body;
    if (!phone) return res.status(400).json({ ok: false, error: 'Phone é obrigatório' });

    let flowNodes = null;
    if (flow_id) {
      const flowResult = await query('SELECT metadata, message_template, delay_minutes, name FROM whatsapp_flows WHERE id = $1', [flow_id]);
      if (flowResult.rows.length > 0) {
        const flow = flowResult.rows[0];
        flowNodes = flow.metadata?.flow_nodes;
        if (!flowNodes || flowNodes.length === 0) {
          const messages = (flow.message_template || '').split('---MSG---').filter(Boolean);
          flowNodes = [];
          if (flow.delay_minutes > 0) {
            flowNodes.push({ type: 'delay', data: { delay_minutes: flow.delay_minutes } });
          }
          messages.forEach(msg => {
            flowNodes.push({ type: 'message', data: { message_template: msg.trim() } });
          });
        }
      }
    }

    if (!flowNodes || flowNodes.length === 0) {
      const { message } = req.body;
      if (!message) return res.status(400).json({ ok: false, error: 'Nenhuma mensagem para enviar' });
      const result = await sendWhatsAppMessage(phone, message.replace(/\\n/g, '\n'), flow_id, 'teste-manual');
      return res.json(result);
    }

    const testId = `test_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    executeFlowTest(testId, phone, flowNodes, flow_id);

    const totalMessages = flowNodes.filter(n => n.type === 'message').length;
    const totalDelayMinutes = flowNodes.filter(n => n.type === 'delay').reduce((s, n) => s + (n.data.delay_minutes || 0), 0);
    res.json({ ok: true, testId, total: totalMessages, totalDelayMinutes, message: `Fluxo iniciado: ${totalMessages} mensagem(ns) com ${totalDelayMinutes}min de pausa total` });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.get('/api/whatsapp/test/:testId', (req, res) => {
  const state = activeFlowTests.get(req.params.testId);
  if (!state) return res.json({ ok: true, status: 'not_found' });
  res.json({ ok: true, ...state });
});

app.get('/api/whatsapp/logs', async (req, res) => {
  try {
    const { page = 1, limit = 50, flow_id, status } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const conditions = [];
    const params = [];
    let idx = 1;
    if (flow_id) { conditions.push(`flow_id = $${idx++}`); params.push(flow_id); }
    if (status) { conditions.push(`status = $${idx++}`); params.push(status); }
    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const countR = await query(`SELECT COUNT(*) FROM whatsapp_logs ${where}`, params);
    const dataR = await query(`SELECT * FROM whatsapp_logs ${where} ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx}`, [...params, parseInt(limit), offset]);
    res.json({
      ok: true,
      data: dataR.rows,
      pagination: { total: parseInt(countR.rows[0].count), page: parseInt(page), limit: parseInt(limit) }
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.get('/api/whatsapp/stats', async (req, res) => {
  try {
    const statsR = await query(`
      SELECT 
        COUNT(*) as total_sent,
        COUNT(*) FILTER (WHERE status = 'sent') as success,
        COUNT(*) FILTER (WHERE status = 'error') as errors,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') as last_24h,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as last_7d
      FROM whatsapp_logs
    `);
    const flowsR = await query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE enabled) as active FROM whatsapp_flows');
    res.json({
      ok: true,
      data: {
        messages: statsR.rows[0],
        flows: flowsR.rows[0]
      }
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

if (isProduction) {
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api/') && !req.path.startsWith('/lp/')) {
      res.sendFile(path.join(__dirname, '../dist/index.html'));
    } else {
      next();
    }
  });
}

async function initializeDatabase() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS system_config (
        key VARCHAR(255) PRIMARY KEY,
        value JSONB,
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await query(
      "INSERT INTO system_config (key, value, updated_at) VALUES ('plans_enabled', $1, NOW()) ON CONFLICT (key) DO NOTHING",
      [JSON.stringify(true)]
    );

    await query(`
      CREATE TABLE IF NOT EXISTS season_config (
        id SERIAL PRIMARY KEY,
        high_season_months INTEGER[] DEFAULT '{1,2,7,12}',
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await query("INSERT INTO season_config (id, high_season_months) VALUES (1, '{1,2,7,12}') ON CONFLICT (id) DO NOTHING");

    await query(`
      CREATE TABLE IF NOT EXISTS category_rates (
        id SERIAL PRIMARY KEY,
        category_id VARCHAR(100),
        category_name VARCHAR(255),
        low_season_rate NUMERIC(10,2) DEFAULT 0,
        high_season_rate NUMERIC(10,2) DEFAULT 0,
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    const userColumns = [
      ['cep', 'VARCHAR(15)'],
      ['birth_date', 'DATE'],
      ['address', 'TEXT'],
      ['numero', 'VARCHAR(20)'],
      ['bairro', 'VARCHAR(100)'],
      ['cidade', 'VARCHAR(100)'],
      ['estado', 'VARCHAR(5)'],
    ];
    for (const [col, type] of userColumns) {
      await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS ${col} ${type}`);
    }

    console.log('[DB] Database initialized successfully');
  } catch (err) {
    console.error('[DB] Error initializing database:', err.message);
  }
}

app.get('/api/health', async (req, res) => {
  try {
    await query('SELECT 1');
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(503).json({ status: 'error', message: err.message });
  }
});

const PORT = process.env.PORT || (isProduction ? 5000 : (process.env.TOTVS_PROXY_PORT || 3001));

(async () => {
  await initializeDatabase();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT} (${isProduction ? 'production' : 'development'})`);
    console.log(`Sync service: ${syncService.enabled ? 'ENABLED' : 'DISABLED'}`);
    console.log('[DB] Connected to PostgreSQL');
  });
})();
