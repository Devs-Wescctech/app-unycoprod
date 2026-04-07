import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getPlans,
  createPlan,
  updatePlan,
  deletePlan
} from '@/services/apiClient';

export function usePlans() {
  return useQuery({
    queryKey: ['plans'],
    queryFn: async () => {
      const data = await getPlans();
      
      if (!Array.isArray(data)) {
        return [];
      }
      
      return data.map(plan => ({
        id: plan.id,
        nome: plan.name || 'Sem nome',
        slug: plan.slug || '',
        preco: parseFloat(plan.price) || 0,
        cobranca: plan.billing_period || 'mensal',
        descricao: plan.description || '',
        beneficios: plan.perks || '',
        ativo: plan.active === 1 || plan.active === '1' || plan.active === true,
        status: (plan.active === 1 || plan.active === '1' || plan.active === true) ? 'Ativo' : 'Inativo',
        created_at: plan.created_at,
        updated_at: plan.updated_at
      }));
    },
    staleTime: 60000,
    refetchOnWindowFocus: false
  });
}

export function useCreatePlan() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      queryClient.invalidateQueries({ queryKey: ['usersSubscriptions'] });
    }
  });
}

export function useUpdatePlan() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updatePlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      queryClient.invalidateQueries({ queryKey: ['usersSubscriptions'] });
    }
  });
}

export function useDeletePlan() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deletePlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      queryClient.invalidateQueries({ queryKey: ['usersSubscriptions'] });
    }
  });
}
