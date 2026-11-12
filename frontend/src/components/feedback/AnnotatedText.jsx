import { useMemo, useState } from 'react';
import { ArrowRight } from 'lucide-react';

const isGrammar = (error) => !error.category || error.category === 'grammar';

/** Finds each quoted mistake in the text. Quotes that overlap an earlier one or cannot be found are listed separately. */
export function locateErrors(text, errors) {
  const lower = text.toLowerCase();
  const placed = [];
  const unplaced = [];

  errors.forEach((error, index) => {
    const quote = (error.original ?? '').trim();
    if (!quote) return;
    const candidates = [quote, quote.replace(/[.,;:!?]+$/, '')].map(q => q.toLowerCase()).filter(Boolean);

    for (const candidate of candidates) {
      let from = 0;
      while (from <= lower.length) {
        const start = lower.indexOf(candidate, from);
        if (start === -1) break;
        const end = start + candidate.length;
        if (!placed.some(p => start < p.end && end > p.start)) {
          placed.push({ start, end, error, index });
          return;
        }
        from = start + 1;
      }
    }
    unplaced.push({ error, index });
  });

  return { placed: placed.sort((a, b) => a.start - b.start), unplaced };
}

function ErrorDetail({ error }) {
  return (
    <div style={{ fontSize: 13, lineHeight: 1.6 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <span style={{ color: 'var(--accent-danger)', textDecoration: 'line-through' }}>{error.original}</span>
        <ArrowRight size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        <strong style={{ color: 'var(--accent-success)' }}>{error.correction ?? error.corrected ?? error.suggestion}</strong>
      </div>
      {(error.explanation ?? error.reason) && <div style={{ color: 'var(--text-secondary)', marginTop: 2 }}>{error.explanation ?? error.reason}</div>}
    </div>
  );
}

/** The learner's own text with each mistake marked. Tapping a mark shows the correction. */
export default function AnnotatedText({ text, errors = [], title = 'Your response, marked' }) {
  const [active, setActive] = useState(null);
  const { placed, unplaced } = useMemo(() => locateErrors(text ?? '', errors ?? []), [text, errors]);

  if (!text) return null;

  const segments = [];
  let cursor = 0;
  placed.forEach(mark => {
    if (mark.start > cursor) segments.push({ text: text.slice(cursor, mark.start) });
    segments.push({ text: text.slice(mark.start, mark.end), mark });
    cursor = mark.end;
  });
  if (cursor < text.length) segments.push({ text: text.slice(cursor) });

  const activeMark = placed.find(m => m.index === active);

  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>{title}</div>
        {placed.length > 0 && (
          <div style={{ display: 'flex', gap: 10, fontSize: 12, color: 'var(--text-muted)' }}>
            <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 3, background: 'var(--mark-error)', borderBottom: '2px solid var(--accent-danger)', marginRight: 4 }} />Grammar</span>
            <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 3, background: 'var(--mark-word)', borderBottom: '2px solid var(--accent-warning)', marginRight: 4 }} />Words & style</span>
          </div>
        )}
      </div>

      <div style={{ padding: '12px 14px', borderRadius: 12, background: 'var(--bg-elevated)', fontSize: 14, lineHeight: 1.9, color: 'var(--text-primary)', whiteSpace: 'pre-line', overflowWrap: 'anywhere' }}>
        {segments.map((segment, i) => segment.mark ? (
          <mark
            key={i}
            role="button"
            tabIndex={0}
            aria-pressed={active === segment.mark.index}
            aria-label={`Mistake: ${segment.text}. Show correction`}
            onClick={() => setActive(a => (a === segment.mark.index ? null : segment.mark.index))}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActive(a => (a === segment.mark.index ? null : segment.mark.index)); } }}
            style={{
              cursor: 'pointer', color: 'inherit', borderRadius: 4, padding: '1px 2px',
              background: isGrammar(segment.mark.error) ? 'var(--mark-error)' : 'var(--mark-word)',
              borderBottom: `2px solid ${isGrammar(segment.mark.error) ? 'var(--accent-danger)' : 'var(--accent-warning)'}`,
              outline: active === segment.mark.index ? '2px solid var(--accent-primary)' : 'none',
            }}
          >{segment.text}</mark>
        ) : <span key={i}>{segment.text}</span>)}
      </div>

      {placed.length > 0 && (
        <div style={{ marginTop: 8, padding: '10px 12px', borderRadius: 10, border: '1px dashed var(--border)', minHeight: 44 }}>
          {activeMark ? <ErrorDetail error={activeMark.error} /> : <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Tap a marked phrase to see the fix ({placed.length} marked).</span>}
        </div>
      )}

      {unplaced.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>{placed.length ? 'More corrections' : 'Corrections'}</div>
          {unplaced.map(({ error, index }) => (
            <div key={index} style={{ padding: '8px 10px', borderLeft: '2px solid var(--accent-warning)', marginBottom: 6 }}><ErrorDetail error={error} /></div>
          ))}
        </div>
      )}
    </div>
  );
}
