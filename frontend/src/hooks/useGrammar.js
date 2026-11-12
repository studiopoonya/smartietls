import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';
import { toast } from '../components/common/Toast';

export function useGrammarHistory() {
  return useQuery({
    queryKey: ['grammar'],
    queryFn: () => api.get('/grammar').then(r => r.data),
  });
}

export function useGrammarCheck() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ text, topic, language }) => api.post('/grammar/check', { text, topic, language }).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grammar'] });
      queryClient.invalidateQueries({ queryKey: ['error-bank'] });
    },
    onError: (err) => toast(err.response?.data?.message ?? 'The grammar check failed. Please try again.', 'error'),
  });
}
