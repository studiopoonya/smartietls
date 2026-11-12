import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Library, Loader2, Search } from 'lucide-react';
import { useJournalSearch } from '../hooks/useJournals';
import { useIsMobile } from '../hooks/useIsMobile';

const SORTS = [
  ['relevant', 'Relevant', 'Best match for your topic'],
  ['popular', 'Most cited', 'Papers other researchers cite the most'],
  ['latest', 'Latest', 'Newest papers first'],
];

const TOPICS = ['Higher education', 'Public health', 'Climate change', 'Artificial intelligence', 'Mental health', 'Urban planning', 'Nutrition', 'Economic inequality'];
const errorMessage = (err) => err?.response?.data?.message ?? 'Something went wrong. Please try again.';

function ArticleCard({ article }) {
  return (
    <Link to={`/journals/${article.id}`} className="glow-card" style={{ display: 'block', padding: 16, textDecoration: 'none' }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-secondary)', marginBottom: 4 }}>
        {[article.journal, article.year].filter(Boolean).join(' · ')}
      </div>
      <h2 style={{ fontSize: 16, fontFamily: 'var(--font-display)', color: 'var(--text-primary)', lineHeight: 1.35, marginBottom: 4 }}>{article.title}</h2>
      {(article.authors || article.citedBy > 0) && (
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
          {article.authors}
          {article.citedBy > 0 && <span style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>{article.authors ? ' · ' : ''}Cited {article.citedBy.toLocaleString('en-US')}×</span>}
        </div>
      )}
      {article.snippet && <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{article.snippet}</p>}
      <div style={{ marginTop: 8, fontSize: 12, fontWeight: 700, color: 'var(--accent-primary)' }}>Read article →</div>
    </Link>
  );
}

export default function Journals() {
  const isMobile = useIsMobile();
  const [params, setParams] = useSearchParams();
  const query = params.get('q') ?? '';
  const sort = SORTS.some(([id]) => id === params.get('sort')) ? params.get('sort') : 'relevant';
  const [draft, setDraft] = useState(query);
  const search = useJournalSearch(query, sort);
  const results = search.data?.pages.flatMap(page => page.results) ?? [];
  const total = search.data?.pages[0]?.total ?? 0;

  const run = (value) => {
    const q = value.trim();
    setDraft(q);
    setParams(q ? { q, ...(sort !== 'relevant' && { sort }) } : {});
  };
  const setSort = (value) => setParams({ q: query, ...(value !== 'relevant' && { sort: value }) }, { replace: true });

  return (
    <div style={{ padding: isMobile ? '20px 16px' : '36px 40px', maxWidth: 820, margin: '0 auto' }}>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <Library size={20}style={{ color: 'var(--accent-secondary)' }} />
          <h1 style={{ fontSize: isMobile ? 22 : 26, fontFamily: 'var(--font-display)' }}>Journals</h1>
        </div>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>Read real research in your field. Academic articles are the best practice for IELTS Reading and for the master's programme itself.</p>
      </motion.div>

      <form role="search" onSubmit={e => { e.preventDefault(); run(draft); }} style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input className="input-dark" type="search" aria-label="Search journal articles" value={draft} onChange={e => setDraft(e.target.value)} placeholder="Search a topic, e.g. online learning" maxLength={120} />
        <button type="submit" className="btn-primary" disabled={draft.trim().length < 2} style={{ padding: '0 18px', display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <Search size={15} /> {!isMobile && 'Search'}
        </button>
      </form>

      <div className="chip-row" style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
        {TOPICS.map(topic => (
          <button key={topic} type="button" data-compact onClick={() => run(topic)} aria-pressed={query === topic} style={{ padding: '6px 12px', whiteSpace: 'nowrap', borderRadius: 99, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: `1px solid ${query === topic ? 'var(--accent-secondary)' : 'var(--border)'}`, background: query === topic ? 'color-mix(in srgb, var(--accent-secondary) 14%, transparent)' : 'var(--bg-card)', color: query === topic ? 'var(--accent-secondary)' : 'var(--text-secondary)' }}>{topic}</button>
        ))}
      </div>

      {!query && (
        <div style={{ padding: 18, borderRadius: 14, background: 'var(--bg-card)', border: '1px solid var(--border)', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          Search for a topic from your field, or tap one above. Every article listed is open access under a Creative Commons licence, so you can read the full text here.
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>Source: Europe PMC. Strongest in health, life sciences, psychology and education research.</div>
        </div>
      )}

      {search.isLoading && (
        <div role="status" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 18, color: 'var(--text-secondary)', fontSize: 14 }}>
          <Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite', color: 'var(--accent-secondary)' }} /> Searching the journal library… this can take a few seconds.
        </div>
      )}

      {search.isError && !search.data && (
        <div style={{ padding: 16, borderRadius: 12, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', fontSize: 14, color: 'var(--text-secondary)' }}>
          {errorMessage(search.error)}
          <button type="button" className="btn-secondary" onClick={() => search.refetch()} style={{ display: 'block', marginTop: 10, padding: '8px 16px', fontSize: 13 }}>Try again</button>
        </div>
      )}

      {search.data && (
        results.length === 0 ? (
          <div style={{ padding: 18, borderRadius: 14, background: 'var(--bg-card)', border: '1px solid var(--border)', fontSize: 14, color: 'var(--text-secondary)' }}>No open-access articles found for “{query}”. Try a broader or different wording.</div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                {search.isPlaceholderData ? <><Loader2 size={13} style={{ animation: 'spin 0.8s linear infinite' }} /> Sorting…</> : `About ${total.toLocaleString('en-US')} articles for “${query}”`}
              </div>
              <div role="radiogroup" aria-label="Sort articles" style={{ display: 'inline-flex', padding: 3, borderRadius: 12, background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                {SORTS.map(([id, label, hint]) => (
                  <button key={id} type="button" role="radio" data-compact aria-checked={sort === id} title={hint} onClick={() => setSort(id)} style={{ padding: '6px 12px', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer', border: 'none', background: sort === id ? 'var(--accent-primary)' : 'transparent', color: sort === id ? 'white' : 'var(--text-secondary)' }}>{label}</button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, opacity: search.isPlaceholderData ? 0.55 : 1, transition: 'opacity 0.2s' }}>
              {results.map(article => <ArticleCard key={article.id} article={article} />)}
            </div>
            {search.hasNextPage && !search.isPlaceholderData && (
              <button type="button" className="btn-secondary" disabled={search.isFetchingNextPage}onClick={() => search.fetchNextPage()} style={{ display: 'block', margin: '16px auto 0', padding: '10px 20px', fontSize: 14 }}>
                {search.isFetchingNextPage ? 'Loading…' : 'Show more articles'}
              </button>
            )}
            {search.isFetchNextPageError && <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--accent-danger)', marginTop: 8 }}>{errorMessage(search.error)}</p>}
          </>
        )
      )}
    </div>
  );
}
