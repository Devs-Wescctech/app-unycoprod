import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

async function fetchConfig() {
  const res = await fetch('/api/config');
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || 'Erro ao carregar configurações');
  return data.config;
}

async function fetchPublicConfig() {
  const res = await fetch('/api/config/public');
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || 'Erro ao carregar configurações');
  return data.config;
}

async function updateConfigKey(key, value) {
  const res = await fetch(`/api/config/${key}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ value })
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || 'Erro ao atualizar configuração');
  return data;
}

export function useSystemConfig() {
  const { data: config, isLoading } = useQuery({
    queryKey: ['system-config'],
    queryFn: fetchConfig,
    staleTime: 30000,
    refetchOnWindowFocus: true
  });

  return {
    config: config || {},
    plansEnabled: config?.plans_enabled !== false,
    isLoading
  };
}

export function usePublicConfig() {
  const { data: config, isLoading } = useQuery({
    queryKey: ['system-config-public'],
    queryFn: fetchPublicConfig,
    staleTime: 30000
  });

  return {
    config: config || {},
    plansEnabled: config?.plans_enabled !== false,
    isLoading
  };
}

export function useUpdateConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ key, value }) => updateConfigKey(key, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-config'] });
      queryClient.invalidateQueries({ queryKey: ['system-config-public'] });
    }
  });
}
