import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpenText, ExternalLink, Minus, Plus, Search } from 'lucide-react';
import { useJournalArticle } from '../hooks/useJournals';
import { useIsMobile } from '../hooks/useIsMobile';

const SIZES = [14, 15, 16, 18, 20];
const SIZE_KEY = 'journal-text-size';
const SELECTION_GRACE_MS = 800;
const MAX_LOOKUP_WORDS = 4;

function readSize() {
  try {
    const saved = Number(localStorage.getItem(SIZE_KEY));
    return SIZES.includes(saved) ? saved : 16;
  } catch {
    return 16;
  }
}

/** The words the learner has selected inside the article, kept briefly so a tap on the button still sees them. */
function useSelectedWords(containerRef) {
  const [selected, setSelected] = useState('');
  const timer = useRef(null);

  useEffect(() => {
    const onChange = () => {
      const selection = window.getSelection();
      const container = containerRef.current;
      const text = selection?.toString().trim().replace(/\s+/g, ' ') ?? '';
      const inside = container && selection?.rangeCount && container.contains(selection.getRangeAt(0).commonAncestorContainer);
      clearTimeout(timer.current);
      if (inside && text && text.split(' ').length <= MAX_LOOKUP_WORDS) {
        setSelected(text.replace(/^[^\p{L}]+|[^\p{L}]+$/gu, ''));
      } else {
        timer.current = setTimeout(() => setSelected(''), SELECTION_GRACE_MS);
      }
    };
    document.addEventListener('selectionchange', onChange);
    return () => { document.removeEventListener('selectionchange', onChange); clearTimeout(timer.current); };
  }, [containerRef]);

  return selected;
}

export default function JournalReader() {
  const { id } = useParams();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { data: article, isLoading, isError, error, refetch } = useJournalArticle(id);
  const [size, setSize] = useState(readSize);
  const articleRef = useRef(null);
  const selected = useSelectedWords(articleRef);
  const pad = isMobile ? '16px 16px 40px' : '32px 40px 60px';

  const changeSize = (step) => {
    const next = SIZES[Math.min(SIZES.length - 1, Math.max(0, SIZES.indexOf(size) + step))];
    setSize(next);
    try { localStorage.setItem(SIZE_KEY, String(next)); } catch { /* the size still applies for this visit */ }
  };

  const back = (
    <Link to="/journals" onClick={e => { if (window.history.length > 1) { e.preventDefault(); navigate(-1); } }} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)', textDecoration: 'none', marginBottom: 14 }}>
      <ArrowLeft size={14} /> Journals
    </Link>
  );

  if (isLoading) {
    return (
      <div style={{ padding: pad, maxWidth: 760, margin: '0 auto' }}>
        {back}
        <div className="skeleton" style={{ height: 34, borderRadius: 10, marginBottom: 12 }} />
        <div className="skeleton" style={{ height: 18, width: '60%', borderRadius: 8, marginBottom: 24 }} />
        {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 90, borderRadius: 10, marginBottom: 12 }} />)}
      </div>
    );
  }

  if (isError) {
    return (
      <div style={{ padding: pad, maxWidth: 760, margin: '0 auto' }}>
        {back}
        <div style={{ padding: 16, borderRadius: 12, background: 'var(--bg-card)', border: '1px solid var(--border)', fontSize: 14, color: 'var(--text-secondary)' }}>
          {error?.response?.data?.message ?? 'This article could not be loaded.'}
          {error?.response?.status !== 404 && <button type="button" className="btn-secondary" onClick={() => refetch()} style={{ display: 'block', marginTop: 10, padding: '8px 16px', fontSize: 13 }}>Try again</button>}
        </div>
      </div>
    );
  }

  const words = [article.abstract, ...article.sections.flatMap(s => s.paragraphs)].join(' ').split(/\s+/).length;
  const minutes = Math.max(1, Math.round(words / 200));
  const text = { fontSize: size, lineHeight: 1.8, color: 'var(--text-primary)', marginBottom: '1em' };

  return (
    <div style={{ padding: pad, maxWidth: 760, margin: '0 auto' }}>
      {back}

      <header style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-secondary)', marginBottom: 6 }}>{[article.journal, article.year].filter(Boolean).join(' · ')}</div>
        <h1 style={{ fontSize: isMobile ? 21 : 26, lineHeight: 1.3, fontFamily: 'var(--font-display)', marginBottom: 6 }}>{article.title}</h1>
        {article.authors && <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{article.authors}</div>}
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>About {minutes} min read</div>
      </header>

      <div style={{ position: 'sticky', top: isMobile ? 66 : 0, zIndex: 5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '8px 0', marginBottom: 12, background: 'var(--bg-primary)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button type="button" data-compact aria-label="Smaller text" disabled={size === SIZES[0]} onClick={() => changeSize(-1)} className="btn-secondary" style={{ width: 34, height: 34, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Minus size={14} /></button>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', width: 34, textAlign: 'center', fontFamily: 'var(--font-score)' }}>{size}px</span>
          <button type="button" data-compact aria-label="Larger text" disabled={size === SIZES[SIZES.length - 1]} onClick={() => changeSize(1)} className="btn-secondary" style={{ width: 34, height: 34, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={14} /></button>
        </div>
        <button
          type="button"
          data-compact
          onMouseDown={e => e.preventDefault()}
          disabled={!selected}
          onClick={() => navigate(`/vocabulary?word=${encodeURIComponent(selected)}`)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 99, fontSize: 13, fontWeight: 700, border: 'none', cursor: selected ? 'pointer' : 'default', background: selected ? 'var(--accent-primary)' : 'var(--bg-elevated)', color: selected ? 'white' : 'var(--text-muted)', maxWidth: isMobile ? 210 : 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
        >
          <Search size={13} style={{ flexShrink: 0 }} /> {selected ? `Look up “${selected}”` : 'Select a word to look it up'}
        </button>
      </div>

      <article ref={articleRef}>
        {article.abstract && (
          <section style={{ padding: '14px 16px', borderRadius: 12, background: 'var(--bg-elevated)', marginBottom: 22 }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Abstract</h2>
            <p style={{ ...text, marginBottom: 0 }}>{article.abstract}</p>
          </section>
        )}

        {article.sections.length === 0 ? (
          <div style={{ display: 'flex', gap: 10, padding: 14, borderRadius: 12, border: '1px dashed var(--border)', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            <BookOpenText size={18} style={{ flexShrink: 0, color: 'var(--text-muted)', marginTop: 2 }} />
            The full text cannot be shown here for this article. You can read the abstract above, or open the original below.
          </div>
        ) : article.sections.map((section, i) => (
          <section key={i}>
            {section.title && (section.level === 1
              ? <h2 style={{ fontSize: size + 3, fontFamily: 'var(--font-display)', margin: '1.4em 0 0.5em' }}>{section.title}</h2>
              : <h3 style={{ fontSize: size + 1, fontFamily: 'var(--font-display)', margin: '1.1em 0 0.4em', color: 'var(--text-secondary)' }}>{section.title}</h3>)}
            {section.paragraphs.map((paragraph, j) => <p key={j} style={text}>{paragraph}</p>)}
          </section>
        ))}
      </article>

      <footer style={{ marginTop: 28, paddingTop: 14, borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.7 }}>
        © The authors. {article.licenceUrl ? <a href={article.licenceUrl} target="_blank" rel="noreferrer" style={{ color: 'inherit' }}>{article.licence}</a> : article.licence} licence. Shown as text only, without figures, tables or references.
        <div style={{ marginTop: 8 }}>
          <a href={article.sourceUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 14, fontWeight: 700, color: 'var(--accent-secondary)' }}>
            Open the original on Europe PMC <ExternalLink size={13} />
          </a>
        </div>
        {article.doi && <div>DOI: {article.doi}</div>}
      </footer>
    </div>
  );
}
