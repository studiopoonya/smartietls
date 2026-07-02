export default function WordCounter({ text, target }) {
  const count = text ? text.trim().split(/\s+/).filter(Boolean).length : 0;
  const isOk = count >= (target ?? 0);

  return (
    <span style={{ fontSize: 12, fontFamily: 'Space Mono', color: isOk ? 'var(--accent-success)' : 'var(--text-muted)' }}>
      {count} words{target ? ` / ${target} min` : ''}
    </span>
  );
}
