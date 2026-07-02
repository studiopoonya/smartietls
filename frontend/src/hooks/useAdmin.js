import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';

export function useAdminOverview() {
  return useQuery({
    queryKey: ['admin-overview'],
    queryFn: () => api.get('/admin/overview').then(r => r.data),
    staleTime: 30_000,
  });
}

export function useAdminUsers(params) {
  return useQuery({
    queryKey: ['admin-users', params],
    queryFn: () => api.get('/admin/users', { params }).then(r => r.data),
    keepPreviousData: true,
  });
}

export function useAdminUser(id) {
  return useQuery({
    queryKey: ['admin-user', id],
    queryFn: () => api.get(`/admin/users/${id}`).then(r => r.data),
    enabled: !!id,
  });
}

export function useAdminUserProgress(id, days = 30) {
  return useQuery({
    queryKey: ['admin-user-progress', id, days],
    queryFn: () => api.get(`/admin/users/${id}/progress`, { params: { days } }).then(r => r.data),
    enabled: !!id,
  });
}

export function useAdminUserSessions(id, params) {
  return useQuery({
    queryKey: ['admin-user-sessions', id, params],
    queryFn: () => api.get(`/admin/users/${id}/sessions`, { params }).then(r => r.data),
    enabled: !!id,
    keepPreviousData: true,
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => api.put(`/admin/users/${id}`, data).then(r => r.data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      qc.invalidateQueries({ queryKey: ['admin-user', String(id)] });
    },
  });
}

export function useToggleAdmin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.patch(`/admin/users/${id}/toggle-admin`).then(r => r.data),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      qc.invalidateQueries({ queryKey: ['admin-user', String(id)] });
    },
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/admin/users/${id}`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  });
}
