import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';
import { toast } from '../components/common/Toast';
import { useAppStore } from '../store/useAppStore';

const showError = (err) => toast(err.response?.data?.message ?? 'Something went wrong. Please try again.', 'error');

function useRefreshProgress() {
  const queryClient = useQueryClient();
  return () => ['curriculum', 'lesson', 'error-bank', 'study-plan', 'exam-status'].forEach(key => queryClient.invalidateQueries({ queryKey: [key] }));
}

export function useCurriculum() {
  return useQuery({
    queryKey: ['curriculum'],
    queryFn: () => api.get('/curriculum').then(r => r.data),
  });
}

export function useLesson(slug) {
  return useQuery({
    queryKey: ['lesson', slug],
    queryFn: () => api.get(`/curriculum/lessons/${slug}`).then(r => r.data),
    retry: false,
  });
}

/** Only fetched once the learner asks for it, because the first request for a lesson calls Claude. */
export function useLessonInBahasa(slug, enabled) {
  return useQuery({
    queryKey: ['lesson-bahasa', slug],
    queryFn: () => api.get(`/curriculum/lessons/${slug}/bahasa`).then(r => r.data),
    enabled,
    staleTime: Infinity,
    retry: false,
  });
}

export function useDrillStart(slug) {
  return useMutation({
    mutationFn: () => api.post(`/drills/${slug}/start`).then(r => r.data),
    onError: showError,
  });
}

export function useUpdateTargetBand() {
  const queryClient = useQueryClient();
  const updateUser = useAppStore(s => s.updateUser);
  return useMutation({
    mutationFn: (targetBand) => api.put('/user/profile', { target_band: targetBand }).then(() => targetBand),
    onSuccess: (targetBand) => {
      updateUser({ target_band: targetBand });
      queryClient.invalidateQueries({ queryKey: ['curriculum'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: showError,
  });
}

export function useUpdateSkillMinimums() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (minimums) => api.put('/user/profile', { skill_minimums: minimums }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['curriculum'] }),
    onError: showError,
  });
}

export function useDrillNext(slug) {
  const refresh = useRefreshProgress();
  return useMutation({
    mutationFn: ({ responses, blockIndex }) => api.post(`/drills/${slug}/next`, { responses, blockIndex }).then(r => r.data),
    onSuccess: (data) => { if (data.done) refresh(); },
    onError: showError,
  });
}

export function useDrillSubmit(slug) {
  const refresh = useRefreshProgress();
  return useMutation({
    mutationFn: (body) => api.post(`/drills/${slug}/submit`, body).then(r => r.data),
    onSuccess: refresh,
    onError: showError,
  });
}

export function useErrorBank() {
  return useQuery({
    queryKey: ['error-bank'],
    queryFn: () => api.get('/error-bank').then(r => r.data),
  });
}

export function usePracticeError() {
  return useMutation({
    mutationFn: ({ id, answer }) => api.post(`/error-bank/${id}/practice`, { answer }).then(r => r.data),
    onError: showError,
  });
}

export function useSubmitRewrite() {
  const refresh = useRefreshProgress();
  return useMutation({
    mutationFn: ({ id, rewritten }) => api.post(`/rewrite-challenges/${id}/submit`, { rewritten }).then(r => r.data),
    onSuccess: refresh,
    onError: showError,
  });
}

export function useStartWeaknessPractice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ skill, weakness }) => api.post('/weakness-practice', { skill, weakness }).then(r => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['error-bank'] }),
    onError: showError,
  });
}

export function useSubmitWeaknessPractice() {
  return useMutation({
    mutationFn: ({ id, responses }) => api.post(`/weakness-practice/${id}/submit`, { responses }).then(r => r.data),
    onError: showError,
  });
}

export function useExamStatus() {
  return useQuery({
    queryKey: ['exam-status'],
    queryFn: () => api.get('/exam').then(r => r.data),
    staleTime: 0,
  });
}
