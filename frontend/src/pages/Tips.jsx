import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, PenLine, Mic2, BookOpen, Headphones, Star, AlertCircle, Clock, CheckCircle2, Flame, Target, Hash, RefreshCw, Globe } from 'lucide-react';
import { useIsMobile } from '../hooks/useIsMobile';
import GlowCard from '../components/common/GlowCard';

const SECTIONS = [
  { id: 'all',       label: 'All',       color: '#7C3AED' },
  { id: 'writing',   label: 'Writing',   color: '#7C3AED', icon: PenLine },
  { id: 'speaking',  label: 'Speaking',  color: '#06B6D4', icon: Mic2 },
  { id: 'reading',   label: 'Reading',   color: '#10B981', icon: BookOpen },
  { id: 'listening', label: 'Listening', color: '#F59E0B', icon: Headphones },
  { id: 'general',   label: 'General',   color: '#EC4899', icon: Star },
];

const TIPS = [
  /* ── Writing ── */
  { section: 'writing', icon: Clock, level: 'essential', title: 'Plan before you write', body: 'Spend 5 minutes planning your essay. A clear structure (introduction → body → conclusion) scores higher than a longer but unorganized response.' },
  { section: 'writing', icon: Hash, level: 'essential', title: 'Hit the minimum word count', body: 'Task 1: minimum 150 words. Task 2: minimum 250 words. Going under loses marks immediately. Going over is fine but wastes time.' },
  { section: 'writing', icon: RefreshCw, level: 'essential', title: 'Paraphrase the question', body: 'Never copy the question word-for-word in your intro. Rephrase it using synonyms and different sentence structures.' },
  { section: 'writing', icon: Lightbulb, level: 'tip', title: 'Use linking words', body: 'Connect ideas with "Furthermore", "However", "In contrast", "As a result". This directly improves your Coherence & Cohesion score.' },
  { section: 'writing', icon: PenLine, level: 'tip', title: 'Vary your vocabulary', body: 'Avoid repeating the same word. Use synonyms, collocations, and topic-specific vocabulary to demonstrate Lexical Resource range.' },
  { section: 'writing', icon: CheckCircle2, level: 'tip', title: 'Leave 2 minutes to check', body: 'Quickly review for grammar errors, spelling mistakes, and punctuation. Small fixes can push your Grammatical Range score up.' },

  /* ── Speaking ── */
  { section: 'speaking', icon: Mic2, level: 'essential', title: 'Extend every answer', body: 'Never just say "yes" or "no". Always explain WHY and give an example. Aim for 3–4 sentences per Part 1 answer.' },
  { section: 'speaking', icon: Clock, level: 'essential', title: 'Use your Part 2 prep time', body: 'Use all 1 minute of preparation time. Jot bullet points: What / Who / When / Where / Why / How. Then speak for the full 2 minutes.' },
  { section: 'speaking', icon: AlertCircle, level: 'tip', title: 'Don\'t self-correct excessively', body: 'Correcting yourself occasionally is fine, but overdoing it kills fluency. Keep going even after a small mistake.' },
  { section: 'speaking', icon: Lightbulb, level: 'tip', title: 'Use filler phrases naturally', body: '"That\'s an interesting question", "Let me think for a moment", "What I mean is..." — these give you thinking time without an awkward silence.' },
  { section: 'speaking', icon: Star, level: 'tip', title: 'Aim for natural speed', body: 'Don\'t speak too fast trying to sound fluent. Clear, measured speech is better than rushed and unclear. Examiners are trained to hear this.' },
  { section: 'speaking', icon: CheckCircle2, level: 'tip', title: 'Use complex grammar naturally', body: 'Weave in conditionals ("If I could..."), perfect tenses ("I\'ve always been..."), and relative clauses to boost your Grammatical Range score.' },

  /* ── Reading ── */
  { section: 'reading', icon: BookOpen, level: 'essential', title: 'Read the questions first', body: 'Before the passage, skim the questions so you know what to look for. This helps you read with purpose and saves time.' },
  { section: 'reading', icon: Clock, level: 'essential', title: 'Never leave a blank', body: 'If you\'re stuck, move on and return. Each question is worth the same mark. Always guess rather than leaving blank.' },
  { section: 'reading', icon: AlertCircle, level: 'essential', title: 'True / False / Not Given — know the difference', body: 'NOT GIVEN means the info is not in the passage — it doesn\'t mean it\'s false. This is the most commonly missed distinction.' },
  { section: 'reading', icon: Lightbulb, level: 'tip', title: 'Skim and scan, don\'t read everything', body: 'Scan for specific facts (names, dates, numbers). Skim paragraph topics for general meaning. You don\'t need to read every word.' },
  { section: 'reading', icon: CheckCircle2, level: 'tip', title: 'Match headings? Focus on topic sentences', body: 'When matching headings to paragraphs, look at the first and last sentence of each paragraph — they usually state the main idea.' },
  { section: 'reading', icon: Target, level: 'tip', title: 'Beware of paraphrasing in answers', body: 'The passage rarely uses the exact same words as the question. Learn to spot synonyms and paraphrase (e.g. "expensive" vs "high cost").' },

  /* ── Listening ── */
  { section: 'listening', icon: Headphones, level: 'essential', title: 'Read ahead before the audio starts', body: 'Use preview time to read the questions and predict what you might hear. This primes your brain to catch the right keywords.' },
  { section: 'listening', icon: AlertCircle, level: 'essential', title: 'Watch for distractors', body: 'Speakers often mention wrong answers first, then correct them. Listen for "actually", "but", "no wait" — the corrected information is usually the answer.' },
  { section: 'listening', icon: CheckCircle2, level: 'essential', title: 'Check spelling during transfer time', body: 'Correct answer with wrong spelling = zero marks. Use the 10-minute transfer time to double-check all spellings carefully.' },
  { section: 'listening', icon: PenLine, level: 'tip', title: 'Write as you listen', body: 'Don\'t try to memorize and write later. Jot notes directly as you hear, then refine during transfer time.' },
  { section: 'listening', icon: Lightbulb, level: 'tip', title: 'Section 4 is the hardest', body: 'Section 4 (academic monologue) has no breaks. It requires the most focus. Do extra practice on academic lecture recordings.' },
  { section: 'listening', icon: Star, level: 'tip', title: 'Practice with authentic accents', body: 'IELTS uses British, Australian, American, and New Zealand accents. Regularly listen to BBC, ABC Australia, and NPR to train your ear.' },

  /* ── General ── */
  { section: 'general', icon: Target, level: 'essential', title: 'Know the exam format', body: 'Knowing exactly what to expect in each section removes anxiety. Do full mock tests under timed conditions at least 2 weeks before exam day.' },
  { section: 'general', icon: Flame, level: 'essential', title: 'Build a daily study habit', body: '30 minutes daily beats 5 hours once a week. Consistency builds vocabulary, comprehension, and fluency naturally over time.' },
  { section: 'general', icon: Globe, level: 'tip', title: 'Read English content daily', body: 'BBC, The Guardian, academic journals — all great for expanding vocabulary and getting familiar with the academic register IELTS uses.' },
  { section: 'general', icon: Lightbulb, level: 'tip', title: 'Focus on your weakest section', body: 'Identify your lowest score and give it 40% of study time. Going from 5.5 → 6.5 in one section can lift your overall band significantly.' },
  { section: 'general', icon: CheckCircle2, level: 'tip', title: 'Time management is a skill', body: 'Practice every test section with a timer. Running out of time is one of the top reasons candidates score lower than expected.' },
  { section: 'general', icon: Star, level: 'tip', title: 'Use the night before wisely', body: 'Don\'t cram the night before. Eat well, sleep at least 8 hours, prepare your ID and stationery. A rested brain outperforms a stressed one.' },
];

const SECTION_COLORS = {
  writing: '#7C3AED', speaking: '#06B6D4', reading: '#10B981',
  listening: '#F59E0B', general: '#EC4899',
};

export default function Tips() {
  const [active, setActive] = useState('all');
  const isMobile = useIsMobile();
  const pad = isMobile ? '20px 16px' : '36px 40px';

  const filtered = active === 'all' ? TIPS : TIPS.filter(t => t.section === active);
  const essentials = filtered.filter(t => t.level === 'essential');
  const bonusTips  = filtered.filter(t => t.level === 'tip');

  return (
    <div style={{ padding: pad, maxWidth: isMobile ? '100%' : 860 }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <div style={{ width: 36, height: 36, background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Lightbulb size={16} style={{ color: 'var(--accent-primary)' }} />
          </div>
          <h1 style={{ fontSize: isMobile ? 20 : 26 }}>Tips & Tricks</h1>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Expert strategies to boost your IELTS band score</p>
      </motion.div>

      {/* Section tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 22, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
        {SECTIONS.map(s => (
          <button key={s.id} onClick={() => setActive(s.id)}
            style={{
              flexShrink: 0, padding: '7px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
              fontFamily: 'Space Grotesk', cursor: 'pointer', border: 'none', transition: 'all 0.2s',
              background: active === s.id ? s.color : 'var(--bg-elevated)',
              color: active === s.id ? '#fff' : 'var(--text-secondary)',
              boxShadow: active === s.id ? `0 0 12px ${s.color}55` : 'none',
            }}>
            {s.label}
          </button>
        ))}
      </div>

      {/* Essentials */}
      {essentials.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <CheckCircle2 size={14} style={{ color: 'var(--accent-success)' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-success)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Must-Know ({essentials.length})</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10 }}>
            {essentials.map((tip, i) => (
              <TipCard key={i} tip={tip} isMobile={isMobile} />
            ))}
          </div>
        </div>
      )}

      {/* Bonus tips */}
      {bonusTips.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Star size={13} style={{ color: '#F59E0B' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#F59E0B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Pro Tips ({bonusTips.length})</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10 }}>
            {bonusTips.map((tip, i) => (
              <TipCard key={i} tip={tip} isMobile={isMobile} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TipCard({ tip, isMobile }) {
  const [open, setOpen] = useState(false);
  const color = SECTION_COLORS[tip.section];
  const Icon  = tip.icon;
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
      <GlowCard style={{ padding: '14px 16px', cursor: 'pointer' }} onClick={() => setOpen(o => !o)}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: `${color}18`, border: `1px solid ${color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
            <Icon size={14} style={{ color }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: open ? 8 : 0 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.4 }}>{tip.title}</span>
              <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 10, background: `${color}20`, color, fontWeight: 600, flexShrink: 0 }}>
                {tip.section}
              </span>
            </div>
            {open && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65, margin: 0 }}>
                {tip.body}
              </motion.p>
            )}
          </div>
          <span style={{ fontSize: 18, color: 'var(--text-muted)', flexShrink: 0, marginTop: 2 }}>{open ? '−' : '+'}</span>
        </div>
      </GlowCard>
    </motion.div>
  );
}
