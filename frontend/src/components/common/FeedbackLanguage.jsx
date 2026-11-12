import { useMutation } from '@tanstack/react-query';
import { Languages } from 'lucide-react';
import api from '../../lib/axios';
import { useAppStore } from '../../store/useAppStore';
import { toast } from './Toast';

/** The learner's choice of language for Claude's explanations, shared by every page. */
export function useFeedbackLanguage() {
  const language = useAppStore(s => s.user?.feedback_language) === 'id' ? 'id' : 'en';
  const updateUser = useAppStore(s => s.updateUser);
  const mutation = useMutation({
    mutationFn: (value) => api.put('/user/profile', { feedback_language: value }).then(() => value),
    onMutate: (value) => {
      const previous = language;
      updateUser({ feedback_language: value });
      return { previous };
    },
    onError: (_err, _value, context) => {
      updateUser({ feedback_language: context?.previous ?? 'en' });
      toast('Could not save your language choice. Please try again.', 'error');
    },
  });

  return [language, mutation.mutate];
}

export default function FeedbackLanguageToggle({ label = 'Feedback in' }) {
  const [language, setLanguage] = useFeedbackLanguage();

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-muted)' }}><Languages size={14} /> {label}</span>
      <div role="radiogroup" aria-label="Feedback language" style={{ display: 'inline-flex', padding: 3, borderRadius: 12, background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
        {[['en', 'English'], ['id', 'Bahasa']].map(([value, text]) => (
          <button key={value} type="button" role="radio" data-compact aria-checked={language === value} onClick={() => language !== value && setLanguage(value)} style={{ padding: '6px 12px', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer', border: 'none', background: language === value ? 'var(--accent-primary)' : 'transparent', color: language === value ? 'white' : 'var(--text-secondary)' }}>{text}</button>
        ))}
      </div>
    </div>
  );
}
