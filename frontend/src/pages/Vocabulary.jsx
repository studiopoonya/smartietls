import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookMarked, Search, Plus, Trash2, RefreshCw, X, Brain, CheckCircle2, XCircle, RotateCcw, ChevronRight } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useVocabExplain } from '../hooks/useAI';
import { useIsMobile } from '../hooks/useIsMobile';
import GlowCard from '../components/common/GlowCard';
import api from '../lib/axios';

/* ─── Lookup panel — must be top-level so it never remounts on parent re-render ─── */
function LookupPanel({ word, setWord, onSubmit, isPending, definition, saving, onSave }) {
  return (
    <div>
      {/* Search bar */}
      <div style={{ position: 'relative', marginBottom: 10 }}>
        <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input
          className="input-dark"
          value={word}
          onChange={e => setWord(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && onSubmit()}
          placeholder="Type a word... (e.g. possible, resilient)"
          style={{ paddingLeft: 38, fontSize: 15 }}
        />
      </div>
      <button className="btn-primary" onClick={onSubmit} disabled={isPending || !word.trim()} style={{ width: '100%', padding: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        {isPending ? (
          <>
            <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.35)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />
            Looking up...
          </>
        ) : (
          <><Search size={13} />Look up</>
        )}
      </button>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      <AnimatePresence>
        {definition && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: 20 }}>

            {/* Word header */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
                <span style={{ fontFamily: 'Space Grotesk', fontSize: 26, fontWeight: 700, color: 'var(--text-primary)' }}>{definition.word}</span>
                <span className="badge badge-purple" style={{ fontSize: 10 }}>{definition.bandLevel}</span>
              </div>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', background: 'var(--bg-elevated)', padding: '2px 8px', borderRadius: 6 }}>
                {definition.partOfSpeech}
              </span>
            </div>

            {/* Definition */}
            <p style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.75, marginBottom: 14, paddingLeft: 12, borderLeft: '3px solid var(--accent-primary)' }}>
              {definition.definition}
            </p>

            {/* 3 Example sentences */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Example Sentences
              </div>
              {(definition.examples ?? (definition.exampleSentence ? [definition.exampleSentence] : [])).map((ex, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
                  <span style={{ fontFamily: 'Space Mono', fontSize: 11, fontWeight: 700, color: 'var(--accent-primary)', flexShrink: 0, marginTop: 2 }}>{i + 1}.</span>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65, fontStyle: 'italic', margin: 0 }}>"{ex}"</p>
                </div>
              ))}
            </div>

            {/* IELTS tip */}
            {definition.ieltsUsage && (
              <div style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 8, padding: '10px 12px', marginBottom: 14 }}>
                <div style={{ fontSize: 10, color: 'var(--accent-primary)', fontWeight: 600, marginBottom: 3, textTransform: 'uppercase' }}>IELTS Tip</div>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>{definition.ieltsUsage}</p>
              </div>
            )}

            {/* Synonyms + Antonyms */}
            {(definition.synonyms?.length > 0 || definition.antonyms?.length > 0) && (
              <div style={{ display: 'flex', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
                {definition.synonyms?.length > 0 && (
                  <div style={{ flex: 1, minWidth: 120 }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase' }}>Synonyms</div>
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                      {definition.synonyms.slice(0, 4).map((s, i) => <span key={i} className="badge badge-purple">{s}</span>)}
                    </div>
                  </div>
                )}
                {definition.antonyms?.length > 0 && (
                  <div style={{ flex: 1, minWidth: 120 }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase' }}>Antonyms</div>
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                      {definition.antonyms.slice(0, 4).map((a, i) => <span key={i} className="badge badge-cyan">{a}</span>)}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Collocations */}
            {definition.collocations?.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase' }}>Common Collocations</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {definition.collocations.map((c, i) => (
                    <span key={i} style={{ fontSize: 11, padding: '3px 9px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-secondary)', fontFamily: 'Space Mono' }}>{c}</span>
                  ))}
                </div>
              </div>
            )}

            <button onClick={onSave} disabled={saving} className="btn-primary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
              <Plus size={14} /> {saving ? 'Saving...' : 'Save to my dictionary'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Flashcard Mode ─── */
function FlashcardMode({ words, onClose }) {
  const [deck, setDeck] = useState(() => [...words].sort(() => Math.random() - 0.5));
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState(0);
  const [unknown, setUnknown] = useState(0);
  const [done, setDone] = useState(false);

  const card = deck[idx];
  const total = deck.length;
  const progress = idx / total;

  const handleKnow = useCallback(() => {
    setKnown(k => k + 1);
    if (idx + 1 >= deck.length) { setDone(true); return; }
    setIdx(i => i + 1);
    setFlipped(false);
  }, [idx, deck.length]);

  const handleDontKnow = useCallback(() => {
    setUnknown(u => u + 1);
    setDeck(d => [...d, d[idx]]); // push to end of deck
    if (idx + 1 >= deck.length) { setDone(true); return; }
    setIdx(i => i + 1);
    setFlipped(false);
  }, [idx, deck.length]);

  const handleRestart = () => {
    setDeck([...words].sort(() => Math.random() - 0.5));
    setIdx(0); setFlipped(false); setKnown(0); setUnknown(0); setDone(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'var(--bg-primary)', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-secondary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Brain size={16} style={{ color: 'var(--accent-primary)' }} />
          <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 15 }}>Flashcard Practice</span>
          {!done && <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'Space Mono' }}>{idx + 1} / {total}</span>}
        </div>
        <button onClick={onClose} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}>
          <X size={16} />
        </button>
      </div>

      {/* Progress bar */}
      {!done && (
        <div style={{ height: 3, background: 'var(--border)' }}>
          <motion.div animate={{ width: `${progress * 100}%` }} style={{ height: '100%', background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))' }} />
        </div>
      )}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 20px', maxWidth: 540, margin: '0 auto', width: '100%' }}>
        {done ? (
          /* ── Summary ── */
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
            <h2 style={{ fontSize: 22, fontFamily: 'Space Grotesk', marginBottom: 8 }}>Session Complete!</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 28 }}>You went through {words.length} word{words.length !== 1 ? 's' : ''}</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 28 }}>
              <div style={{ padding: '20px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 14, textAlign: 'center' }}>
                <div style={{ fontFamily: 'Space Mono', fontSize: 36, fontWeight: 700, color: 'var(--accent-success)' }}>{known}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Known</div>
              </div>
              <div style={{ padding: '20px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 14, textAlign: 'center' }}>
                <div style={{ fontFamily: 'Space Mono', fontSize: 36, fontWeight: 700, color: 'var(--accent-danger)' }}>{unknown}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Still Learning</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={handleRestart} className="btn-secondary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                <RotateCcw size={14} /> Practice Again
              </button>
              <button onClick={onClose} className="btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                <ChevronRight size={14} /> Back to Dictionary
              </button>
            </div>
          </motion.div>
        ) : card ? (
          /* ── Card ── */
          <div style={{ width: '100%' }}>
            {/* Score row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <span style={{ fontSize: 12, color: 'var(--accent-success)', fontWeight: 600 }}>✓ {known} known</span>
              <span style={{ fontSize: 12, color: 'var(--accent-danger)', fontWeight: 600 }}>✗ {unknown} learning</span>
            </div>

            {/* Flip card container */}
            <div onClick={() => setFlipped(f => !f)} style={{ cursor: 'pointer', perspective: 1200, marginBottom: 24 }}>
              <motion.div
                animate={{ rotateY: flipped ? 180 : 0 }}
                transition={{ duration: 0.45, ease: 'easeInOut' }}
                style={{ position: 'relative', transformStyle: 'preserve-3d', minHeight: 260 }}>
                {/* Front */}
                <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, boxShadow: '0 8px 40px rgba(0,0,0,0.25)' }}>
                  <div style={{ fontFamily: 'Space Grotesk', fontSize: 42, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10, textAlign: 'center' }}>{card.word}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>{card.definition_data?.partOfSpeech}</div>
                  <div style={{ marginTop: 24, fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5, opacity: 0.6 }}>
                    <span>Tap to reveal definition</span>
                  </div>
                </div>
                {/* Back */}
                <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)', background: 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(6,182,212,0.06))', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 20, padding: '24px 26px', boxShadow: '0 8px 40px rgba(124,58,237,0.15)', overflowY: 'auto' }}>
                  <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'Space Grotesk', color: 'var(--accent-primary)', marginBottom: 10 }}>{card.word}</div>
                  <p style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.75, marginBottom: 14, paddingLeft: 12, borderLeft: '3px solid var(--accent-primary)' }}>
                    {card.definition_data?.definition}
                  </p>
                  {card.definition_data?.examples?.slice(0, 2).map((ex, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 7 }}>
                      <span style={{ fontFamily: 'Space Mono', fontSize: 11, fontWeight: 700, color: 'var(--accent-secondary)', flexShrink: 0, marginTop: 2 }}>{i + 1}.</span>
                      <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, fontStyle: 'italic', margin: 0 }}>"{ex}"</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Action buttons — only shown after flip */}
            <AnimatePresence>
              {flipped && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <button onClick={handleDontKnow}
                    style={{ padding: '16px', borderRadius: 14, border: '1px solid rgba(239,68,68,0.35)', background: 'rgba(239,68,68,0.1)', color: 'var(--accent-danger)', cursor: 'pointer', fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <XCircle size={18} /> Still Learning
                  </button>
                  <button onClick={handleKnow}
                    style={{ padding: '16px', borderRadius: 14, border: '1px solid rgba(16,185,129,0.35)', background: 'rgba(16,185,129,0.12)', color: 'var(--accent-success)', cursor: 'pointer', fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <CheckCircle2 size={18} /> Got It!
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {!flipped && (
              <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>Tap the card to see the definition</p>
            )}
          </div>
        ) : null}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </motion.div>
  );
}

/* ─── Main page ─── */
export default function Vocabulary() {
  const [word, setWord]           = useState('');
  const [definition, setDefinition] = useState(null);
  const [saving, setSaving]       = useState(false);
  const [showLookup, setShowLookup] = useState(false);
  const [showFlashcard, setShowFlashcard] = useState(false);
  const isMobile  = useIsMobile();
  const qc        = useQueryClient();
  const { mutate: explain, isPending } = useVocabExplain();
  const pad = isMobile ? '20px 16px' : '36px 40px';

  const { data: vocab, isLoading } = useQuery({
    queryKey: ['vocabulary'],
    queryFn: () => api.get('/vocabulary').then(r => r.data),
  });

  const { data: allVocab } = useQuery({
    queryKey: ['vocabulary-all'],
    queryFn: () => api.get('/vocabulary?per_page=200').then(r => r.data),
    enabled: showFlashcard,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/vocabulary/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vocabulary'] }),
  });

  const reviewMutation = useMutation({
    mutationFn: (id) => api.put(`/vocabulary/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vocabulary'] }),
  });

  const handleExplain = () => {
    if (!word.trim()) return;
    explain({ word: word.trim() }, { onSuccess: setDefinition });
  };

  const handleSave = async () => {
    if (!definition) return;
    setSaving(true);
    try {
      await api.post('/vocabulary', { word: definition.word, definition_data: definition });
      qc.invalidateQueries({ queryKey: ['vocabulary'] });
      setDefinition(null);
      setWord('');
      if (isMobile) setShowLookup(false);
    } finally { setSaving(false); }
  };

  const flashWords = allVocab?.data ?? vocab?.data ?? [];

  return (
    <div style={{ padding: pad, maxWidth: isMobile ? '100%' : 1100 }}>
      {/* Flashcard overlay */}
      <AnimatePresence>
        {showFlashcard && flashWords.length > 0 && (
          <FlashcardMode words={flashWords} onClose={() => setShowFlashcard(false)} />
        )}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BookMarked size={16} style={{ color: 'var(--accent-primary)' }} />
            </div>
            <div>
              <h1 style={{ fontSize: isMobile ? 20 : 26 }}>Vocabulary</h1>
              {isMobile && <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{vocab?.total ?? 0} words saved</p>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {(vocab?.total ?? 0) > 0 && (
              <button onClick={() => setShowFlashcard(true)}
                style={{ padding: '9px 14px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 10, color: 'var(--accent-primary)', cursor: 'pointer', fontWeight: 600, fontFamily: 'Space Grotesk' }}>
                <Brain size={14} /> {isMobile ? 'Flashcards' : 'Practice Flashcards'}
              </button>
            )}
            {isMobile && (
              <button className="btn-primary" onClick={() => { setDefinition(null); setWord(''); setShowLookup(true); }}
                style={{ padding: '9px 14px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Search size={14} /> Look up
              </button>
            )}
          </div>
        </div>
        {!isMobile && <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>AI-powered dictionary — definition, examples, synonyms & IELTS tips</p>}
      </motion.div>

      {/* Mobile lookup modal */}
      <AnimatePresence>
        {isMobile && showLookup && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', overflowY: 'auto', padding: '16px 16px 80px' }}>
            <div style={{ background: 'var(--bg-secondary)', borderRadius: 16, padding: 20, maxWidth: 480, margin: '0 auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <h2 style={{ fontSize: 17 }}>Dictionary</h2>
                <button onClick={() => setShowLookup(false)}
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                  <X size={16} />
                </button>
              </div>
              <LookupPanel
                word={word} setWord={setWord}
                onSubmit={handleExplain} isPending={isPending}
                definition={definition} saving={saving} onSave={handleSave}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '360px 1fr', gap: 24 }}>
        {/* Desktop lookup panel */}
        {!isMobile && (
          <div>
            <GlowCard hover={false} style={{ padding: 22 }}>
              <h3 style={{ fontSize: 15, marginBottom: 4, fontFamily: 'Space Grotesk' }}>Dictionary</h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>Search any word for definition + 3 example sentences</p>
              <LookupPanel
                word={word} setWord={setWord}
                onSubmit={handleExplain} isPending={isPending}
                definition={definition} saving={saving} onSave={handleSave}
              />
            </GlowCard>
          </div>
        )}

        {/* Saved words */}
        <div>
          {!isMobile && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <h2 style={{ fontSize: 17, fontFamily: 'Space Grotesk' }}>Saved Words</h2>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{vocab?.total ?? 0} words</span>
            </div>
          )}
          {isLoading ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 90 }} />)}
            </div>
          ) : vocab?.data?.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--text-muted)' }}>
              <BookMarked size={36} style={{ margin: '0 auto 14px', display: 'block', opacity: 0.2 }} />
              <p style={{ fontSize: 14, marginBottom: 6 }}>No words saved yet</p>
              {isMobile && (
                <button className="btn-primary" onClick={() => setShowLookup(true)} style={{ padding: '10px 24px', marginTop: 12 }}>
                  Look up a word
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(200px, 1fr))', gap: isMobile ? 8 : 12 }}>
              {vocab?.data?.map(v => isMobile ? (
                <motion.div key={v.id} style={{ padding: '14px 16px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
                  {/* Word + badge + actions row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontFamily: 'Space Grotesk', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{v.word}</span>
                    <span className="badge badge-purple" style={{ fontSize: 9 }}>{v.definition_data?.bandLevel}</span>
                    <div style={{ display: 'flex', gap: 6, marginLeft: 'auto', flexShrink: 0 }}>
                      <button onClick={() => reviewMutation.mutate(v.id)} style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: 'var(--accent-success)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <RefreshCw size={12} />
                      </button>
                      <button onClick={() => deleteMutation.mutate(v.id)} style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--accent-danger)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                  {/* Part of speech */}
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: 4 }}>{v.definition_data?.partOfSpeech}</div>
                  {/* Definition — 2 lines max */}
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.55, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {v.definition_data?.definition}
                  </div>
                </motion.div>
              ) : (
                <motion.div key={v.id} className="glow-card" style={{ padding: 16 }} whileHover={{ y: -2 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div>
                      <div style={{ fontFamily: 'Space Grotesk', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{v.word}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>{v.definition_data?.partOfSpeech}</div>
                    </div>
                    <span className="badge badge-purple" style={{ fontSize: 9 }}>{v.definition_data?.bandLevel}</span>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 10 }}>
                    {v.definition_data?.definition?.slice(0, 90)}{v.definition_data?.definition?.length > 90 ? '...' : ''}
                  </p>
                  <div style={{ display: 'flex', gap: 7 }}>
                    <button onClick={() => reviewMutation.mutate(v.id)} style={{ flex: 1, padding: '6px', borderRadius: 7, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: 'var(--accent-success)', cursor: 'pointer', fontSize: 10, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                      <RefreshCw size={10} /> Done ({v.review_count})
                    </button>
                    <button onClick={() => deleteMutation.mutate(v.id)} style={{ padding: '6px 9px', borderRadius: 7, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--accent-danger)', cursor: 'pointer' }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
