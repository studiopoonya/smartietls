import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import api from '../lib/axios';

export function useJournalSearch(query, sort = 'relevant') {
  return useInfiniteQuery({
    queryKey: ['journals', query, sort],
    queryFn: ({ pageParam }) => api.get('/journals', { params: { q: query, cursor: pageParam, sort } }).then(r => r.data),
    initialPageParam: '*',
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled: query.trim().length >= 2,
    // Changing the sort keeps the current list on screen until the new order arrives, so the sort
    // buttons do not vanish. A new topic starts clean, so old results never sit under a new title.
    placeholderData: (previous, previousQuery) => (previousQuery?.queryKey[1] === query ? previous : undefined),
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
