import { useQuery } from '@tanstack/react-query';
import api from '../lib/axios';

export function useProgress() {
  return useQuery({
    queryKey: ['progress'],
    queryFn: () => api.get('/progress').then(r => r.data),
  });
}

export function useProgressChart(days = 30) {
  return useQuery({
    queryKey: ['progress-chart', days],
    queryFn: () => api.get(`/progress/chart?days=${days}`).then(r => r.data),
  });
}

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/dashboard').then(r => r.data),
    staleTime: 1000 * 60 * 5,
  });
}

export function useSessions(module) {
  return useQuery({
    queryKey: ['sessions', module],
    queryFn: () => api.get('/sessions' + (module ? `?module=${module}` : '')).then(r => r.data),
  });
}
