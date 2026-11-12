import { useEffect, useState } from 'react';
import { CheckCircle, Loader2 } from 'lucide-react';

export const WRITING_STAGES = ['Reading your response', 'Checking task response and structure', 'Scanning grammar and vocabulary', 'Writing your band score and feedback'];
export const SPEAKING_STAGES = ['Reading your transcript', 'Checking fluency and coherence', 'Scanning grammar and vocabulary', 'Writing your band score and feedback'];
export const GRAMMAR_STAGES = ['Reading your sentences', 'Checking verbs and tenses', 'Checking articles, prepositions and word forms', 'Writing simple explanations'];
export const PRACTICE_STAGES = ['Looking at your mistakes', 'Writing new questions on the same rule', 'Checking the answers'];

const STEP_MS = 3500;

/**
 * Shows what Claude is working on while a request runs. The steps follow a timer, not real
 * progress, so the last step stays active until the response arrives.
 */
export default function StagedLoader({ stages = WRITING_STAGES, colorHex = 'var(--accent-primary)', note = 'This usually takes 10–20 seconds.' }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setStep(s => Math.min(s + 1, stages.length - 1)), STEP_MS);
    return () => clearInterval(interval);
  }, [stages.length]);

  return (
    <div role="status" aria-live="polite" style={{ padding: '14px 16px', borderRadius: 12, background: 'var(--bg-elevated)', border: '1px solid var(--border)', marginTop: 12 }}>
      {stages.map((label, i) => {
        const done = i < step;
        const active = i === step;
        return (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '4px 0', fontSize: 13, color: done ? 'var(--text-secondary)' : active ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: active ? 700 : 500, opacity: i > step ? 0.6 : 1 }}>
            {done ? <CheckCircle size={15} style={{ color: 'var(--accent-success)', flexShrink: 0 }} />
              : active ? <Loader2 size={15} style={{ color: colorHex, flexShrink: 0, animation: 'spin 0.8s linear infinite' }} />
              : <span style={{ width: 15, height: 15, borderRadius: '50%', border: '2px solid var(--border)', flexShrink: 0 }} />}
            {label}{active ? '…' : ''}
          </div>
        );
      })}
      {note && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>{note}</div>}
    </div>
  );
}
