import { useEffect, useRef, useState } from 'react';
import { CheckCircle, Clock, Play, Volume2, XCircle } from 'lucide-react';
import { hasSpeechSynthesis, speak, stopSpeaking, useIsSpeaking } from '../../lib/speech';
import HighlightableText from './Highlighter';

export function useCountdown(seconds, running, onExpire) {
  const [left, setLeft] = useState(seconds);
  const expireRef = useRef(onExpire);
  useEffect(() => { expireRef.current = onExpire; }, [onExpire]);

  useEffect(() => {
    if (!running) return undefined;
    const deadline = Date.now() + seconds * 1000;
    setLeft(seconds);
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setLeft(remaining);
      if (remaining === 0) {
        clearInterval(interval);
        expireRef.current?.();
      }
    }, 250);
    return () => clearInterval(interval);
  }, [seconds, running]);

  return left;
}

export function formatClock(total) {
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60).toString().padStart(hours ? 2 : 1, '0');
  const seconds = (total % 60).toString().padStart(2, '0');
  return hours ? `${hours}:${minutes}:${seconds}` : `${minutes}:${seconds}`;
}

export function ClockBadge({ seconds, urgentAt = 60 }) {
  const urgent = seconds <= urgentAt;
  return (
    <span role="timer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-score)', fontWeight: 700, fontSize: 15, padding: '6px 12px', borderRadius: 8, color: urgent ? 'var(--accent-danger)' : 'var(--text-primary)', background: urgent ? 'rgba(239,68,68,0.12)' : 'var(--bg-elevated)' }}>
      <Clock size={14} /> {formatClock(seconds)}
    </span>
  );
}

function readPlayed(storageKey) {
  try {
    return !!storageKey && localStorage.getItem(storageKey) === '1';
  } catch {
    return false;
  }
}

function markPlayed(storageKey) {
  try {
    if (storageKey) localStorage.setItem(storageKey, '1');
  } catch {
    // Without storage the recording is still limited to one play until the page reloads.
  }
}

/** Plays a recording once. With storageKey, the play is remembered so a reload cannot replay it. */
export function AudioOnce({ script, colorHex = 'var(--accent-primary)', label = 'Play recording', storageKey }) {
  const [state, setState] = useState(() => (readPlayed(storageKey) ? 'done' : 'idle'));
  const otherPlaying = useIsSpeaking() && state === 'idle';
  useEffect(() => stopSpeaking, []);

  if (!hasSpeechSynthesis || state === 'failed') {
    return (
      <div style={{ padding: 14, background: 'var(--bg-elevated)', borderRadius: 10, marginBottom: 14 }}>
        <div style={{ fontSize: 12, color: 'var(--accent-warning)', fontWeight: 600, marginBottom: 6 }}>Audio is not available in this browser, so please read the script instead.</div>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-line' }}>{script}</p>
      </div>
    );
  }

  const play = () => {
    setState('playing');
    markPlayed(storageKey);
    speak(script, { onEnd: () => setState('done'), onError: () => setState('failed') });
  };

  return (
    <button type="button" onClick={play} disabled={state !== 'idle' || otherPlaying} className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 14, padding: '10px 18px', fontSize: 14, color: state === 'idle' && !otherPlaying ? colorHex : 'var(--text-muted)', cursor: state === 'idle' && !otherPlaying ? 'pointer' : 'not-allowed' }}>
      {state === 'playing' ? <Volume2 size={15} /> : <Play size={15} />}
      {otherPlaying ? 'Wait for the current part to finish' : state === 'idle' ? `${label} (plays once)` : state === 'playing' ? 'Playing…' : 'Recording finished'}
    </button>
  );
}

export function Passage({ title, text }) {
  return (
    <div style={{ padding: '10px 18px 16px', background: 'var(--bg-elevated)', borderRadius: 12, marginBottom: 16, maxHeight: 460, overflowY: 'auto' }}>
      {title && <h4 style={{ fontSize: 15, margin: '6px 0 4px', fontFamily: 'var(--font-display)' }}>{title}</h4>}
      <HighlightableText text={text} />
    </div>
  );
}

export function QuestionItem({ number, question, value, onChange, colorHex = 'var(--accent-primary)', anchorId }) {
  return (
    <div id={anchorId} style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.6, marginBottom: 8, display: 'flex', gap: 8 }}>
        <span style={{ fontFamily: 'var(--font-score)', fontWeight: 700, color: colorHex, flexShrink: 0 }}>{number}.</span>
        <span>{question.question}</span>
      </div>
      {question.options ? (
        <div role="radiogroup" aria-label={`Question ${number}`} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {question.options.map(option => {
            const selected = value === option;
            return (
              <button key={option} type="button" role="radio" aria-checked={selected} onClick={() => onChange(option)} style={{ textAlign: 'left', padding: '9px 12px', borderRadius: 9, fontSize: 13, cursor: 'pointer', color: selected ? 'var(--text-primary)' : 'var(--text-secondary)', background: selected ? `color-mix(in srgb, ${colorHex} 16%, transparent)` : 'var(--bg-elevated)', border: `1px solid ${selected ? colorHex : 'var(--border)'}` }}>
                {option}
              </button>
            );
          })}
        </div>
      ) : (
        <input className="input-dark" aria-label={`Answer ${number}`} value={value ?? ''} onChange={e => onChange(e.target.value)} placeholder="Your answer" style={{ maxWidth: 320 }} />
      )}
    </div>
  );
}

export function QuizResults({ results }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {results.map((r, i) => (
        <div key={r.id} style={{ padding: '10px 12px', borderRadius: 10, background: 'var(--bg-elevated)', borderLeft: `3px solid ${r.correct ? 'var(--accent-success)' : 'var(--accent-danger)'}` }}>
          <div style={{ display: 'flex', gap: 8, fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5 }}>
            {r.correct ? <CheckCircle size={15} style={{ color: 'var(--accent-success)', flexShrink: 0, marginTop: 2 }} /> : <XCircle size={15} style={{ color: 'var(--accent-danger)', flexShrink: 0, marginTop: 2 }} />}
            <span>{i + 1}. {r.question}</span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, paddingLeft: 23 }}>
            Your answer: {r.given || '(blank)'}{!r.correct && <> · Correct: <strong>{r.expectedText ?? r.expected.split('/')[0]}</strong></>}
          </div>
          {r.explain && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3, paddingLeft: 23 }}>{r.explain}</div>}
        </div>
      ))}
    </div>
  );
}

export function wordCount(text) {
  return (text.trim().match(/\S+/g) ?? []).length;
}
