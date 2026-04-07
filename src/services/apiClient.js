class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

function buildUrl(endpoint, params = {}) {
  const url = new URL(endpoint, window.location.origin);
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, value);
    }
  });
  
  return url.toString();
}

async function request(endpoint, options = {}, queryParams = {}) {
  const url = buildUrl(endpoint, queryParams);
  const method = options.method || 'GET';
  
  const headers = {};

  const fetchOptions = {
    method,
    headers,
  };

  if (method !== 'GET' && method !== 'HEAD' && options.body) {
    headers['Content-Type'] = 'application/json';
    fetchOptions.body = options.body;
  }

  try {
    console.log('API Request:', { url, method, body: options.body });
    const response = await fetch(url, fetchOptions);
    
    const text = await response.text();
    console.log('API Response:', { status: response.status, text: text.substring(0, 500) });
    
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error('Invalid JSON response:', text.substring(0, 500));
      throw new ApiError('Resposta invalida do servidor: ' + text.substring(0, 200), response.status, text.substring(0, 500));
    }

    if (!response.ok) {
      const errorMessage = data.error || data.message || 'Erro na requisicao';
      console.error('API Error:', { status: response.status, data });
      throw new ApiError(errorMessage, response.status, data);
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    console.error('Network Error:', error.message || error);
    throw new ApiError('Erro de conexao com o servidor', 0, error.message);
  }
}

// ========== PLANOS - /api/plans.php ==========

export async function getPlans(params = {}) {
  const result = await request('/api/plans.php', { method: 'GET' }, {
    id: params.id,
    active: params.active
  });
  
  return result.data || [];
}

export async function createPlan(payload) {
  return request('/api/plans.php', {
    method: 'POST',
    body: JSON.stringify({ action: 'create', ...payload })
  }, {});
}

export async function updatePlan(payload) {
  const { plan_id, ...rest } = payload;
  const id = plan_id || payload.id;
  
  return request('/api/plans.php', {
    method: 'POST',
    body: JSON.stringify({ action: 'update', id, ...rest })
  }, {});
}

export async function deletePlan(id) {
  return request('/api/plans.php', {
    method: 'POST',
    body: JSON.stringify({ action: 'delete', id })
  }, {});
}

// ========== USUARIOS - /api/users.php ==========

export async function getUsers(params = {}) {
  const result = await request('/api/users.php', { method: 'GET' }, {
    id: params.id,
    cpf: params.cpf
  });
  
  return result.data || [];
}

export async function getUser(id) {
  const result = await request('/api/users.php', { method: 'GET' }, { id });
  const data = result.data;
  if (Array.isArray(data)) return data[0] || null;
  return data || null;
}

export async function createUser(payload) {
  return request('/api/users.php', {
    method: 'POST',
    body: JSON.stringify({ action: 'create', ...payload })
  }, {});
}

export async function updateUser(payload) {
  const { user_id, ...rest } = payload;
  const id = user_id || payload.id;
  
  return request('/api/users.php', {
    method: 'POST',
    body: JSON.stringify({ action: 'update', id, ...rest })
  }, {});
}

export async function deleteUser(id) {
  return request('/api/users.php', {
    method: 'POST',
    body: JSON.stringify({ action: 'delete', id })
  }, {});
}

// ========== ASSINATURAS - /api/subscriptions.php ==========

export async function getSubscriptions(params = {}) {
  const result = await request('/api/subscriptions.php', { method: 'GET' }, {
    id: params.id,
    user_id: params.user_id,
    status: params.status
  });
  
  return result.data || [];
}

export async function createSubscription(payload) {
  return request('/api/subscriptions.php', {
    method: 'POST',
    body: JSON.stringify({ action: 'create', ...payload })
  }, {});
}

export async function updateSubscription(payload) {
  const { subscription_id, ...rest } = payload;
  const id = subscription_id || payload.id;
  
  return request('/api/subscriptions.php', {
    method: 'POST',
    body: JSON.stringify({ action: 'update', subscription_id: id, ...rest })
  }, {});
}

export async function deleteSubscription(id) {
  return request('/api/subscriptions.php', {
    method: 'POST',
    body: JSON.stringify({ action: 'delete', id })
  }, {});
}

// ========== DADOS COMBINADOS (usuarios + assinaturas + planos) ==========

export async function getUsersSubscriptions(params = {}) {
  const result = await request('/api/sync.php', { method: 'GET' }, {
    cpf: params.cpf,
    date_start: params.date_start,
    date_end: params.date_end
  });
  
  return result.data || result;
}

export { ApiError };
