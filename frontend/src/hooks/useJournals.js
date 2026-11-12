import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import api from '../lib/axios';

export function useJournalSearch(query) {
  return useInfiniteQuery({
    queryKey: ['journals', query],
    queryFn: ({ pageParam }) => api.get('/journals', { params: { q: query, cursor: pageParam } }).then(r => r.data),
    initialPageParam: '*',
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled: query.trim().length >= 2,
    staleTime: 10 * 60 * 1000,
    retry: false,
  });
}

export function useJournalArticle(id) {
  return useQuery({
    queryKey: ['journal', id],
    queryFn: () => api.get(`/journals/${id}`).then(r => r.data),
    staleTime: 60 * 60 * 1000,
    retry: false,
  });
}
