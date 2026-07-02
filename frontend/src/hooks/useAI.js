import { useMutation } from '@tanstack/react-query';
import api from '../lib/axios';

export const useWritingAnalysis = () => useMutation({
  mutationFn: (data) => api.post('/ai/writing/analyze', data).then(r => r.data),
});

export const useSpeakingChat = () => useMutation({
  mutationFn: (data) => api.post('/ai/speaking/message', data).then(r => r.data),
});

export const useSpeakingGenerate = () => useMutation({
  mutationFn: () => api.post('/ai/speaking/generate').then(r => r.data),
});

export const useSpeakingEvaluate = () => useMutation({
  mutationFn: (data) => api.post('/ai/speaking/evaluate', data).then(r => r.data),
});

export const useReadingGenerate = () => useMutation({
  mutationFn: (data) => api.post('/ai/reading/generate', data).then(r => r.data),
});

export const useListeningGenerate = () => useMutation({
  mutationFn: (data) => api.post('/ai/listening/generate', data).then(r => r.data),
});

export const useVocabExplain = () => useMutation({
  mutationFn: (data) => api.post('/ai/vocabulary/explain', data).then(r => r.data),
});

export const useMockTestEvaluate = () => useMutation({
  mutationFn: (data) => api.post('/ai/mock-test/evaluate', data).then(r => r.data),
});
