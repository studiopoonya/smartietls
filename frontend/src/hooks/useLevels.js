import { useQuery } from '@tanstack/react-query';
import api from '../lib/axios';

export function useLevels() {
  return useQuery({
    queryKey: ['levels'],
    queryFn: () => api.get('/levels').then(r => r.data),
    staleTime: 30_000,
  });
}
