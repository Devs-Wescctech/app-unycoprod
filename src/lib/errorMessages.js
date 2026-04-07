const ERROR_TRANSLATIONS = {
  "Duplicate entry": {
    pattern: /Duplicate entry '(.*)' for key '(.*)'/,
    getMessage: (match) => {
      const value = match[1];
      const field = match[2];
      
      const fieldNames = {
        'email': 'E-mail',
        'cpf': 'CPF',
        'phone': 'Telefone',
        'slug': 'Slug',
        'name': 'Nome'
      };
      
      const fieldName = fieldNames[field] || field;
      
      if (value === '' || value === 'NULL') {
        return `O campo ${fieldName} nao pode ficar vazio (ja existe outro registro sem ${fieldName})`;
      }
      
      return `Ja existe um cadastro com este ${fieldName}: ${value}`;
    }
  },
  "foreign key constraint": {
    pattern: /foreign key constraint/i,
    getMessage: () => "Este registro esta vinculado a outros dados e nao pode ser removido"
  },
  "Token invalido": {
    pattern: /Token invalido/i,
    getMessage: () => "Sessao expirada. Por favor, atualize a pagina e tente novamente"
  },
  "Connection refused": {
    pattern: /Connection refused|Failed to fetch|Network Error/i,
    getMessage: () => "Erro de conexao com o servidor. Verifique sua internet e tente novamente"
  },
  "not found": {
    pattern: /not found|404/i,
    getMessage: () => "O recurso solicitado nao foi encontrado"
  },
  "timeout": {
    pattern: /timeout|ETIMEDOUT/i,
    getMessage: () => "A requisicao demorou muito. Tente novamente"
  },
  "Integrity constraint": {
    pattern: /Integrity constraint violation: (\d+)/,
    getMessage: (match) => {
      const code = match[1];
      if (code === '1062') return "Ja existe um registro com esses dados";
      if (code === '1451') return "Este registro esta sendo usado por outros dados";
      if (code === '1452') return "Referencia invalida (plano ou usuario nao existe)";
      return "Erro de validacao dos dados";
    }
  }
};

export function translateError(error) {
  const message = error?.message || error?.details?.detail || error?.details?.error || String(error);
  
  for (const key of Object.keys(ERROR_TRANSLATIONS)) {
    const { pattern, getMessage } = ERROR_TRANSLATIONS[key];
    const match = message.match(pattern);
    
    if (match) {
      return getMessage(match);
    }
  }
  
  if (message.includes('SQLSTATE')) {
    return 'Erro ao processar dados. Verifique as informacoes e tente novamente';
  }
  
  if (message.length > 100) {
    return 'Ocorreu um erro ao processar sua solicitacao. Tente novamente';
  }
  
  return message;
}

export function getErrorDetails(error) {
  return {
    userMessage: translateError(error),
    technicalMessage: error?.details?.detail || error?.message || String(error),
    status: error?.status || 500
  };
}
