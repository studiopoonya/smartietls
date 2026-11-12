import { useState } from 'react';
import { Lightbulb, Play, Volume2, X } from 'lucide-react';
import { useSubmitWeaknessPractice } from '../../hooks/useCurriculum';
import { hasSpeechSynthesis, speak, stopSpeaking, useIsSpeaking } from '../../lib/speech';
import { Passage, QuestionItem, QuizResults } from './parts';

/** Practice audio may be replayed: this is for learning, not test conditions. */
function ReplayableAudio({ script }) {
  const speaking = useIsSpeaking();

  if (!hasSpeechSynthesis) return <Passage text={script} />;

  return (
    <button type="button" className="btn-secondary" onClick={() => (speaking ? stopSpeaking() : speak(script, {}))} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px', fontSize: 14, marginBottom: 14 }}>
      {speaking ? <><Volume2 size={15} /> Stop</> : <><Play size={15} /> Play recording</>}
    </button>
  );
}

export default function WeaknessPractice({ set, onClose, onChecked }) {
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const submit = useSubmitWeaknessPractice();
  const answered = set.questions.filter(q => (answers[q.id] ?? '').trim()).length;
  const close = () => { stopSpeaking(); onClose(); };

  return (
    <section aria-label={`Practice: ${set.label}`} style={{ background: 'var(--bg-card)', border: '2px solid var(--accent-primary)', borderRadius: 14, padding: '16px 18px', marginBottom: 22 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fix this weakness · {set.skill}</div>
          <h2 style={{ fontSize: 17, fontFamily: 'var(--font-display)' }}>{set.label}</h2>
        </div>
        <button type="button" aria-label="Close practice" onClick={close} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)', flexShrink: 0 }}><X size={16} /></button>
      </div>

      {set.tip && (
        <div style={{ display: 'flex', gap: 8, padding: '10px 12px', borderRadius: 10, background: 'var(--bg-elevated)', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 14 }}>
          <Lightbulb size={15} style={{ color: 'var(--accent-warning)', flexShrink: 0, marginTop: 3 }} />
          <span><strong style={{ color: 'var(--text-primary)' }}>Rule: </strong>{set.tip}</span>
        </div>
      )}

      {result ? (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
            <div>
              <span style={{ fontFamily: 'var(--font-score)', fontSize: 26, fontWeight: 700, color: result.correct / result.total >= 0.8 ? 'var(--accent-success)' : 'var(--accent-warning)' }}>{result.correct}/{result.total}</span>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', marginLeft: 10 }}>{result.correct / result.total >= 0.8 ? 'Nice. This rule is sticking.' : 'Read the explanations, then try a new set later.'}</span>
            </div>
            <button type="button" className="btn-secondary" onClick={close} style={{ padding: '8px 16px', fontSize: 13 }}>Done</button>
          </div>
          {set.skill === 'listening' && result.text && (
            <details style={{ marginBottom: 12 }}>
              <summary style={{ cursor: 'pointer', fontSize: 13, color: 'var(--text-secondary)' }}>Show the script</summary>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, marginTop: 6 }}>{result.text}</p>
            </details>
          )}
          <QuizResults results={result.results} />
        </div>
      ) : (
        <div>
          {set.text && (set.skill === 'listening' ? <ReplayableAudio script={set.text} /> : <Passage text={set.text} />)}
          {set.questions.map((question, i) => (
            <QuestionItem key={question.id} number={i + 1} question={question} value={answers[question.id]} onChange={value => setAnswers(a => ({ ...a, [question.id]: value }))} />
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <button type="button" className="btn-primary" disabled={submit.isPending} onClick={() => submit.mutate({ id: set.id, responses: answers }, { onSuccess: data => { stopSpeaking(); setResult(data); onChecked?.(data); } })} style={{ padding: '11px 22px', fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              {submit.isPending ? 'Checking…' : 'Check answers'}
            </button>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{answered}/{set.questions.length} answered</span>
          </div>
        </div>
      )}
    </section>
  );
}
