import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';

export function useLessonProgress() {
  return useQuery({
    queryKey: ['lesson-progress'],
    queryFn: () => api.get('/lessons/progress').then(r => r.data.completed),
    staleTime: 1000 * 60 * 5,
  });
}

export function useCompleteLesson() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (lessonId) => api.post(`/lessons/${lessonId}/complete`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lesson-progress'] }),
  });
}
