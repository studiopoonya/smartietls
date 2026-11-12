import { useEffect, useMemo, useState } from 'react';
import { Eye, EyeOff, Play, Square, Volume2 } from 'lucide-react';
import { hasSpeechSynthesis, speak, stopSpeaking } from '../../lib/speech';

const SPEEDS = [0.75, 0.9, 1];

/** Splits a script into sentences, keeping the speaker label on the first sentence of each turn. */
export function splitTranscript(transcript) {
  const segments = [];
  (transcript ?? '').split(/\n+/).forEach(line => {
    const match = line.match(/^\s*([A-Za-z .]{1,20}):\s*/);
    const speaker = match ? match[1].trim() : null;
    const body = match ? line.slice(match[0].length) : line;
    const sentences = body.match(/[^.!?]+[.!?]+["')\]]*|[^.!?]+$/g) ?? [];
    sentences.map(s => s.trim()).filter(Boolean).forEach((text, i) => segments.push({ speaker: i === 0 ? speaker : null, text }));
  });
  return segments;
}

/**
 * Practice-only listening tool: replay any sentence, play on from it, slow it down, and hide or
 * show the words. Never shown during a scored attempt.
 */
export default function PracticeTranscript({ transcript, colorHex = 'var(--accent-primary)', initiallyShowText = false, onBeforePlay }) {
  const segments = useMemo(() => splitTranscript(transcript), [transcript]);
  const [current, setCurrent] = useState(null);
  const [continuous, setContinuous] = useState(false);
  const [rate, setRate] = useState(0.9);
  const [showText, setShowText] = useState(initiallyShowText);

  useEffect(() => stopSpeaking, []);

  const playFrom = (index, keepGoing) => {
    if (index >= segments.length) { setCurrent(null); setContinuous(false); return; }
    onBeforePlay?.();
    setCurrent(index);
    setContinuous(keepGoing);
    speak(segments[index].text, {
      rate,
      onEnd: () => (keepGoing ? playFrom(index + 1, true) : setCurrent(null)),
      onError: () => setCurrent(null),
    });
  };

  const stop = () => { stopSpeaking(); setCurrent(null); setContinuous(false); };

  return (
    <div style={{ padding: '12px 16px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Practice mode: tap a sentence to replay it</div>
        <button type="button" data-compact onClick={() => setShowText(s => !s)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: colorHex, padding: '4px 0' }}>
          {showText ? <><EyeOff size={13} /> Hide words</> : <><Eye size={13} /> Show words</>}
        </button>
      </div>

      {hasSpeechSynthesis && (
        <div className="chip-row" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
          <button type="button" data-compact onClick={() => (current !== null ? stop() : playFrom(0, true))} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 99, fontSize: 13, fontWeight: 700, cursor: 'pointer', border: 'none', background: colorHex, color: 'white' }}>
            {current !== null ? <><Square size={12} fill="white" /> Stop</> : <><Play size={13} /> Play all</>}
          </button>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 4 }}>Speed</span>
          {SPEEDS.map(speed => (
            <button key={speed} type="button" data-compact aria-pressed={rate === speed} onClick={() => setRate(speed)} style={{ padding: '5px 10px', borderRadius: 99, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-score)', border: `1px solid ${rate === speed ? colorHex : 'var(--border)'}`, background: rate === speed ? `color-mix(in srgb, ${colorHex} 14%, transparent)` : 'var(--bg-card)', color: rate === speed ? colorHex : 'var(--text-secondary)' }}>
              {speed === 1 ? '1×' : `${speed}×`}
            </button>
          ))}
        </div>
      )}

      <ol style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4, maxHeight: '45vh', overflowY: 'auto' }}>
        {segments.map((segment, i) => {
          const playing = current === i;
          return (
            <li key={i}>
              <button
                type="button"
                data-compact
                onClick={() => (playing ? stop() : playFrom(i, continuous && current !== null))}
                aria-label={`${playing ? 'Stop' : 'Play'} sentence ${i + 1}`}
                style={{ width: '100%', display: 'flex', alignItems: 'flex-start', gap: 10, textAlign: 'left', padding: '8px 10px', borderRadius: 10, cursor: hasSpeechSynthesis ? 'pointer' : 'default', border: `1px solid ${playing ? colorHex : 'transparent'}`, background: playing ? `color-mix(in srgb, ${colorHex} 12%, transparent)` : 'var(--bg-elevated)' }}
              >
                <span style={{ width: 24, height: 24, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: playing ? colorHex : 'var(--bg-card)', color: playing ? 'white' : colorHex, border: `1px solid ${playing ? colorHex : 'var(--border)'}` }}>
                  {playing ? <Volume2 size={12} /> : <span style={{ fontFamily: 'var(--font-score)', fontSize: 11, fontWeight: 700 }}>{i + 1}</span>}
                </span>
                <span style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--text-secondary)', filter: showText ? 'none' : 'blur(5px)', userSelect: showText ? 'auto' : 'none', transition: 'filter 0.2s' }}>
                  {segment.speaker && <strong style={{ color: 'var(--text-primary)' }}>{segment.speaker}: </strong>}
                  {segment.text}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
