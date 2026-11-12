import { useMemo, useState } from 'react';
import { CheckCircle, RotateCcw, XCircle } from 'lucide-react';

const stripEnd = (sentence) => sentence.trim().replace(/[.!?]+$/, '');

function shuffle(words, seed) {
  const order = words.map((word, index) => ({ word, index }));
  let state = seed + 1;
  for (let i = order.length - 1; i > 0; i -= 1) {
    state = (state * 9301 + 49297) % 233280;
    const j = Math.floor((state / 233280) * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  // A shuffle that leaves the sentence in order teaches nothing, so rotate it once.
  if (order.every((item, i) => item.index === i)) order.push(order.shift());
  return order;
}

function BuilderItem({ sentence, number, seed }) {
  const target = stripEnd(sentence);
  const tiles = useMemo(() => shuffle(target.split(/\s+/), seed), [target, seed]);
  const [picked, setPicked] = useState([]);
  const [status, setStatus] = useState(null);
  const answer = picked.map(i => tiles[i].word).join(' ');
  const done = picked.length === tiles.length;

  const reset = () => { setPicked([]); setStatus(null); };
  const check = () => setStatus(answer === target ? 'correct' : 'wrong');

  return (
    <div style={{ padding: '12px 14px', borderRadius: 12, background: 'var(--bg-elevated)', marginBottom: 10 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8 }}>SENTENCE {number}</div>

      <div aria-label="Your sentence" style={{ minHeight: 44, display: 'flex', flexWrap: 'wrap', gap: 6, padding: 8, borderRadius: 10, border: `2px dashed ${status === 'correct' ? 'var(--accent-success)' : status === 'wrong' ? 'var(--accent-danger)' : 'var(--border)'}`, background: 'var(--bg-card)', marginBottom: 10 }}>
        {picked.length === 0 && <span style={{ fontSize: 13, color: 'var(--text-muted)', alignSelf: 'center' }}>Tap the words below in the right order</span>}
        {picked.map((tileIndex, position) => (
          <button key={tileIndex} type="button" data-compact disabled={status === 'correct'} onClick={() => { setPicked(p => p.filter((_, i) => i !== position)); setStatus(null); }} style={{ padding: '6px 10px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', border: '1px solid var(--accent-primary)', background: 'color-mix(in srgb, var(--accent-primary) 12%, transparent)', color: 'var(--text-primary)' }}>{tiles[tileIndex].word}</button>
        ))}
      </div>

      {status !== 'correct' && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
          {tiles.map((tile, i) => !picked.includes(i) && (
            <button key={i} type="button" data-compact onClick={() => { setPicked(p => [...p, i]); setStatus(null); }} style={{ padding: '6px 10px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', boxShadow: '0 2px 0 var(--border)' }}>{tile.word}</button>
          ))}
        </div>
      )}

      {status === 'correct' ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 700, color: 'var(--accent-success)' }}><CheckCircle size={16} /> Correct! {sentence}</div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button type="button" className="btn-primary" data-compact disabled={!done} onClick={check} style={{ padding: '7px 16px', fontSize: 13 }}>Check</button>
          {picked.length > 0 && <button type="button" data-compact onClick={reset} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--text-muted)' }}><RotateCcw size={13} /> Start over</button>}
          {status === 'wrong' && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'var(--accent-danger)' }}>
              <XCircle size={14} /> Not quite. Tap a word to move it back.
            </span>
          )}
        </div>
      )}
      {status === 'wrong' && (
        <details style={{ marginTop: 8 }}>
          <summary style={{ cursor: 'pointer', fontSize: 12, color: 'var(--text-muted)' }}>Show the answer</summary>
          <div style={{ fontSize: 14, color: 'var(--accent-success)', fontWeight: 600, marginTop: 4 }}>{sentence}</div>
        </details>
      )}
    </div>
  );
}

/** Word-order practice: a small step between reading a rule and writing freely, with no AI cost. */
export default function SentenceBuilder({ sentences }) {
  return sentences.map((sentence, i) => <BuilderItem key={sentence} sentence={sentence} number={i + 1} seed={i + sentence.length} />);
}
