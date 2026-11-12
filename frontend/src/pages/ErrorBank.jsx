import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, PartyPopper, RotateCcw, Target, XCircle } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useErrorBank, usePracticeError, useStartWeaknessPractice, useSubmitRewrite } from '../hooks/useCurriculum';
import { BASELINE_SKILLS, SKILLS } from '../data/skills';
import { topicById } from '../data/grammarTopics';
import StagedLoader, { PRACTICE_STAGES, WRITING_STAGES } from '../components/feedback/StagedLoader';
import WeaknessPractice from '../components/drills/WeaknessPractice';
import { useIsMobile } from '../hooks/useIsMobile';
import { getBandColor } from '../lib/utils';
import { wordCount } from '../components/drills/parts';

const CATEGORY_LABELS = {
  grammar: 'Grammar', collocation: 'Collocation', vocabulary: 'Vocabulary', low_value_sentence: 'Low-value sentence',
  reading_logic: 'Reading logic', listening_trap: 'Listening trap',
};

function RewriteChallenge({ challenge }) {
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);
  const { mutate, isPending } = useSubmitRewrite();
  const feedback = result?.feedback ?? challenge.feedback;

  return (
    <section style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 14, padding: 18, marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, color: 'var(--accent-warning)' }}>
        <AlertTriangle size={16} />
        <h2 style={{ fontSize: 16, fontFamily: 'var(--font-display)', color: 'inherit' }}>Rewrite Challenge</h2>
      </div>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14 }}>Rewrite your lowest-scoring paragraph from {challenge.moduleTitle}. New modules stay locked until Claude confirms you applied the advice.</p>

      <div style={{ padding: 12, background: 'var(--bg-elevated)', borderRadius: 10, marginBottom: 10 }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 5 }}>YOUR PARAGRAPH · BAND <span style={{ fontFamily: 'var(--font-score)', color: getBandColor(challenge.originalBand) }}>{challenge.originalBand}</span></div>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{challenge.originalParagraph}</p>
      </div>
      <div style={{ padding: 12, background: 'var(--bg-elevated)', borderRadius: 10, marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: 'var(--accent-warning)', fontWeight: 600, marginBottom: 5 }}>REVISION ADVICE</div>
        <p style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.7 }}>{challenge.revisionAdvice}</p>
      </div>

      <textarea className="input-dark" aria-label="Rewritten paragraph" value={text} onChange={e => setText(e.target.value)} placeholder="Rewrite the paragraph here…" style={{ minHeight: 130, resize: 'vertical', marginBottom: 10 }} />
      {feedback && <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 10 }}><strong style={{ color: 'var(--accent-warning)' }}>Claude: </strong>{feedback}</p>}
      <button type="button" className="btn-primary" disabled={isPending || text.trim().length < 20} onClick={() => mutate({ id: challenge.id, rewritten: text }, { onSuccess: setResult })} style={{ padding: '11px 22px', fontSize: 14 }}>
        {isPending ? 'Claude is reviewing…' : `Submit rewrite (${wordCount(text)} words)`}
      </button>
      {isPending && <StagedLoader stages={WRITING_STAGES} colorHex="var(--accent-warning)" />}
    </section>
  );
}

function WeaknessCard({ group, onPractice, generating, disabled }) {
  const skill = SKILLS[group.skill];
  return (
    <div style={{ padding: 14, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: skill.colorHex }}>{skill.label}</div>
          <div style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>{group.label}</div>
        </div>
        <span title="Times this came up" style={{ fontFamily: 'var(--font-score)', fontSize: 13, fontWeight: 700, color: 'var(--accent-danger)', background: 'var(--mark-error)', padding: '2px 9px', borderRadius: 99, flexShrink: 0 }}>×{group.occurrences}</span>
      </div>
      {group.examples.map((example, i) => (
        <div key={i} style={{ fontSize: 13, lineHeight: 1.5, marginBottom: 3, overflowWrap: 'anywhere' }}>
          <span style={{ color: 'var(--accent-danger)', textDecoration: 'line-through' }}>{example.original}</span>
          {example.correction != null ? (
            <>
              <span style={{ color: 'var(--text-muted)' }}> → </span>
              <span style={{ color: 'var(--accent-success)' }}>{example.correction}</span>
            </>
          ) : <span style={{ color: 'var(--text-muted)' }}> → fix it in today's list</span>}
        </div>
      ))}
      {generating ? <StagedLoader stages={PRACTICE_STAGES} colorHex={skill.colorHex} note="Claude is writing 5 questions on this rule." /> : (
        <div className="chip-row" style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center' }}>
          <button type="button" className="btn-primary" disabled={disabled} onClick={onPractice} style={{ padding: '8px 16px', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Target size={14} /> Fix this weakness
          </button>
          {topicById(group.weakness) && ['writing', 'speaking'].includes(group.skill) && (
            <Link to={`/grammar?tab=practice&topic=${group.weakness}`} style={{ fontSize: 13, color: 'var(--accent-primary)', fontWeight: 600 }}>Learn the rule</Link>
          )}
          {group.lesson && !group.lesson.locked && (
            <Link to={`/learn/${group.lesson.skill}/lesson/${group.lesson.slug}`} style={{ fontSize: 13, color: skill.colorHex, fontWeight: 600 }}>Review lesson: {group.lesson.title}</Link>
          )}
        </div>
      )}
    </div>
  );
}

function Weaknesses({ groups, setsLeft }) {
  const [params, setParams] = useSearchParams();
  const filter = SKILLS[params.get('skill')] ? params.get('skill') : 'all';
  const [activeSet, setActiveSet] = useState(null);
  const start = useStartWeaknessPractice();
  const shown = filter === 'all' ? groups : groups.filter(g => g.skill === filter);
  const generatingKey = start.isPending ? `${start.variables.skill}|${start.variables.weakness}` : null;

  const practice = (group) => start.mutate({ skill: group.skill, weakness: group.weakness }, {
    onSuccess: (set) => {
      setActiveSet(set);
      setTimeout(() => document.getElementById('weakness-practice')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    },
  });

  const setFilter = (value) => setParams(value === 'all' ? {} : { skill: value }, { replace: true });

  return (
    <section id="weaknesses" style={{ marginBottom: 26 }}>
      <h2 style={{ fontSize: 16, fontFamily: 'var(--font-display)', marginBottom: 3 }}>Fix This Weakness</h2>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 10 }}>Your mistakes grouped by the rule behind them. Each practice set has 5 new questions built from your own errors ({setsLeft} left today).</p>

      <div className="chip-row" role="tablist" aria-label="Filter by skill" style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {['all', ...BASELINE_SKILLS].map(value => (
          <button key={value} type="button" role="tab" aria-selected={filter === value} data-compact onClick={() => setFilter(value)} style={{ padding: '6px 13px', borderRadius: 99, fontSize: 13, fontWeight: 700, cursor: 'pointer', border: `1px solid ${filter === value ? 'var(--accent-primary)' : 'var(--border)'}`, background: filter === value ? 'var(--accent-primary)' : 'var(--bg-card)', color: filter === value ? 'white' : 'var(--text-secondary)' }}>
            {value === 'all' ? 'All' : SKILLS[value].label}
          </button>
        ))}
      </div>

      <div id="weakness-practice" style={{ scrollMarginTop: 80 }}>
        {activeSet && <WeaknessPractice key={activeSet.id} set={activeSet} onClose={() => setActiveSet(null)} />}
      </div>

      {shown.length === 0 ? (
        <div style={{ padding: 16, borderRadius: 12, background: 'var(--bg-card)', border: '1px solid var(--border)', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          {filter === 'all'
            ? 'No weaknesses yet. They appear after Claude marks your writing or speaking, or when you miss reading and listening questions.'
            : <>No {SKILLS[filter].label.toLowerCase()} mistakes logged yet. <Link to={`/learn/${filter}`} style={{ color: SKILLS[filter].colorHex, fontWeight: 600 }}>Continue the {SKILLS[filter].label} track</Link> to find them.</>}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
          {shown.map(group => {
            const key = `${group.skill}|${group.weakness}`;
            return <WeaknessCard key={key} group={group} generating={generatingKey === key} disabled={start.isPending || setsLeft === 0} onPractice={() => practice(group)} />;
          })}
        </div>
      )}
    </section>
  );
}

function PracticeItem({ item, onFinished }) {
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState(null);
  const { mutate, isPending } = usePracticeError();

  return (
    <div style={{ padding: 14, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>{CATEGORY_LABELS[item.category]} · {item.skill}</div>
      <p style={{ fontSize: 14, color: 'var(--accent-danger)', lineHeight: 1.6, marginBottom: 10 }}>{item.original}</p>

      {result ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          {result.correct ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--accent-success)' }}><CheckCircle size={15} /> {result.status === 'cleared' ? 'Cleared from quarantine' : 'Correct. It returns tomorrow to lock it in.'}</span>
          ) : (
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, color: 'var(--accent-danger)' }}><XCircle size={14} style={{ marginTop: 3, flexShrink: 0 }} /><span>Not quite. Correct version: <strong>{result.correction}</strong></span></div>
              {result.explanation && <div style={{ marginTop: 3 }}>{result.explanation}</div>}
              <div style={{ marginTop: 3, color: 'var(--text-muted)' }}>It returns tomorrow for another try.</div>
            </div>
          )}
          <button type="button" className="btn-secondary" onClick={onFinished} style={{ padding: '7px 14px', fontSize: 13, flexShrink: 0 }}>Next</button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 8 }}>
          <input className="input-dark" aria-label="Corrected version" value={answer} onChange={e => setAnswer(e.target.value)} placeholder="Type the corrected version" />
          <button type="button" className="btn-primary" disabled={isPending || !answer.trim()} onClick={() => mutate({ id: item.id, answer }, { onSuccess: setResult })} style={{ padding: '0 18px', fontSize: 13, flexShrink: 0 }}>Check</button>
        </div>
      )}
    </div>
  );
}

export default function ErrorBank() {
  const isMobile = useIsMobile();
  const { data, isLoading } = useErrorBank();
  const queryClient = useQueryClient();
  const pad = isMobile ? '20px 16px' : '36px 40px';

  if (isLoading || !data) {
    return <div style={{ padding: pad, maxWidth: 760, margin: '0 auto' }}><div className="skeleton" style={{ height: 240, borderRadius: 14 }} /></div>;
  }

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['error-bank'] });

  return (
    <div style={{ padding: pad, maxWidth: 760, margin: '0 auto' }}>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <RotateCcw size={20} style={{ color: 'var(--accent-danger)' }} />
          <h1 style={{ fontSize: isMobile ? 22 : 26, fontFamily: 'var(--font-display)' }}>Error Bank</h1>
        </div>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>The specific mistakes from your drills and submissions, turned into daily practice.</p>
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 22 }}>
        {[['In quarantine', data.stats.quarantined, 'var(--accent-danger)'], ['Cleared', data.stats.cleared, 'var(--accent-success)'], ['Logic errors logged', data.stats.logged, 'var(--text-secondary)']].map(([label, value, color]) => (
          <div key={label} className="glow-card" style={{ padding: 14 }}>
            <div style={{ fontFamily: 'var(--font-score)', fontSize: 22, fontWeight: 700, color }}>{value}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{label}</div>
          </div>
        ))}
      </div>

      {data.rewrite && <RewriteChallenge key={data.rewrite.id} challenge={data.rewrite} />}

      <Weaknesses groups={data.weaknesses ?? []} setsLeft={data.practiceSetsLeft ?? 0} />

      <section style={{ marginBottom: 26 }}>
        <h2 style={{ fontSize: 16, fontFamily: 'var(--font-display)', marginBottom: 3 }}>Grammar & Collocation Quarantine</h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>Today's list. Fix each item from memory; two correct reviews on separate days clear it.</p>
        {data.daily.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 16, borderRadius: 12, background: 'var(--bg-card)', border: '1px solid var(--border)', fontSize: 14, color: 'var(--text-secondary)' }}>
            <PartyPopper size={17} style={{ color: 'var(--accent-success)' }} /> Nothing due today.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {data.daily.map(item => <PracticeItem key={item.id} item={item} onFinished={refresh} />)}
          </div>
        )}
      </section>

      {data.log.length > 0 && (
        <section>
          <h2 style={{ fontSize: 16, fontFamily: 'var(--font-display)', marginBottom: 10 }}>Error Log</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {data.log.map(entry => (
              <details key={entry.id} style={{ padding: '10px 12px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10 }}>
                <summary style={{ cursor: 'pointer', fontSize: 13, color: entry.status === 'cleared' ? 'var(--text-muted)' : 'var(--text-primary)', lineHeight: 1.5 }}>
                  {entry.original} <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>· {CATEGORY_LABELS[entry.category]}{entry.occurrences > 1 ? ` · ×${entry.occurrences}` : ''}</span>
                </summary>
                {entry.hidden ? (
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>The answer stays hidden until you fix this one from memory in your daily practice.</div>
                ) : (
                  <>
                    <div style={{ fontSize: 13, color: 'var(--accent-success)', marginTop: 6 }}>{entry.correction}</div>
                    {entry.explanation && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>{entry.explanation}</div>}
                  </>
                )}
              </details>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
