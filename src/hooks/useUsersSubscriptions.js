import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getUsersSubscriptions,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getSubscriptions,
  createSubscription,
  updateSubscription,
  deleteSubscription
} from '@/services/apiClient';

export function useUsersSubscriptions(filters = {}) {
  return useQuery({
    queryKey: ['usersSubscriptions', filters],
    queryFn: () => getUsersSubscriptions(filters),
    staleTime: 30000,
    refetchOnWindowFocus: false
  });
}

export function useUsers(filters = {}) {
  return useQuery({
    queryKey: ['users', filters],
    queryFn: () => getUsers(filters),
    staleTime: 30000,
    refetchOnWindowFocus: false
  });
}

export function useSubscriptions(filters = {}) {
  return useQuery({
    queryKey: ['subscriptions', filters],
    queryFn: () => getSubscriptions(filters),
    staleTime: 30000,
    refetchOnWindowFocus: false
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usersSubscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    }
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usersSubscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    }
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usersSubscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    }
  });
}

export function useCreateSubscription() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createSubscription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usersSubscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    }
  });
}

export function useUpdateSubscription() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateSubscription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usersSubscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    }
  });
}

export function useDeleteSubscription() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteSubscription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usersSubscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    }
  });
}
