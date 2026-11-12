import { useEffect, useRef, useState } from 'react';
import { Highlighter } from 'lucide-react';

// On phones, tapping the button clears the selection first, so the last one is kept for a moment.
const SELECTION_GRACE_MS = 800;

function offsetWithin(container, node, offset) {
  const range = document.createRange();
  range.selectNodeContents(container);
  range.setEnd(node, offset);
  return range.toString().length;
}

export function mergeRanges(ranges) {
  const sorted = [...ranges].sort((a, b) => a.start - b.start);
  const merged = [];
  for (const range of sorted) {
    const last = merged[merged.length - 1];
    if (last && range.start <= last.end) last.end = Math.max(last.end, range.end);
    else merged.push({ ...range });
  }
  return merged;
}

/**
 * Reading text the learner can mark up, like the highlighter in computer-delivered IELTS.
 * Pass highlights and onChange to keep the marks when the text is hidden and shown again.
 */
export default function HighlightableText({ text, highlights, onChange, textStyle, background = 'var(--bg-elevated)' }) {
  const [ownHighlights, setOwnHighlights] = useState([]);
  const ranges = highlights ?? ownHighlights;
  const setRanges = onChange ?? setOwnHighlights;
  const [pending, setPending] = useState(null);
  const textRef = useRef(null);
  const clearTimer = useRef(null);

  useEffect(() => {
    const onSelectionChange = () => {
      const selection = window.getSelection();
      const container = textRef.current;
      if (!selection || !container) return;
      const range = selection.rangeCount ? selection.getRangeAt(0) : null;

      if (!range || selection.isCollapsed || !container.contains(range.startContainer) || !container.contains(range.endContainer)) {
        clearTimeout(clearTimer.current);
        clearTimer.current = setTimeout(() => setPending(null), SELECTION_GRACE_MS);
        return;
      }

      clearTimeout(clearTimer.current);
      const start = offsetWithin(container, range.startContainer, range.startOffset);
      const end = offsetWithin(container, range.endContainer, range.endOffset);
      if (end > start) setPending({ start, end });
    };

    document.addEventListener('selectionchange', onSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', onSelectionChange);
      clearTimeout(clearTimer.current);
    };
  }, []);

  const apply = () => {
    if (!pending) return;
    setRanges(mergeRanges([...ranges, pending]));
    setPending(null);
    window.getSelection()?.removeAllRanges();
  };

  const remove = (target) => {
    if (!window.getSelection()?.isCollapsed) return;
    setRanges(ranges.filter(r => r.start !== target.start || r.end !== target.end));
  };

  const segments = [];
  let cursor = 0;
  mergeRanges(ranges).forEach(range => {
    if (range.start > cursor) segments.push({ text: text.slice(cursor, range.start) });
    segments.push({ text: text.slice(range.start, range.end), range });
    cursor = range.end;
  });
  if (cursor < text.length) segments.push({ text: text.slice(cursor) });

  return (
    <div>
      <div style={{ position: 'sticky', top: 0, zIndex: 2, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', padding: '6px 0 8px', background }}>
        <button
          type="button"
          data-compact
          onMouseDown={e => e.preventDefault()}
          onClick={apply}
          disabled={!pending}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 99, fontSize: 13, fontWeight: 700, cursor: pending ? 'pointer' : 'default', border: '1px solid var(--border)', background: pending ? 'var(--highlight-bg)' : 'var(--bg-card)', color: pending ? '#3A2E00' : 'var(--text-muted)' }}
        >
          <Highlighter size={14} /> Highlight
        </button>
        {ranges.length > 0 ? (
          <button type="button" data-compact onClick={() => setRanges([])} style={{ background: 'none', border: 'none', padding: '6px 4px', fontSize: 12, color: 'var(--text-muted)', cursor: 'pointer', textDecoration: 'underline' }}>Clear all</button>
        ) : (
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Select words, then tap Highlight. Tap a highlight to remove it.</span>
        )}
      </div>
      <p ref={textRef} style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--text-secondary)', whiteSpace: 'pre-line', ...textStyle }}>
        {segments.map((segment, i) => segment.range ? (
          <mark key={i} onClick={() => remove(segment.range)} title="Tap to remove" style={{ background: 'var(--highlight-bg)', color: 'var(--text-primary)', borderRadius: 3, cursor: 'pointer' }}>{segment.text}</mark>
        ) : <span key={i}>{segment.text}</span>)}
      </p>
    </div>
  );
}
