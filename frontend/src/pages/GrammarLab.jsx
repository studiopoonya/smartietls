import { useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, CheckCircle, Lightbulb, PartyPopper, SpellCheck, Target, XCircle } from 'lucide-react';
import { useGrammarCheck, useGrammarHistory } from '../hooks/useGrammar';
import { useStartWeaknessPractice } from '../hooks/useCurriculum';
import { useIsMobile } from '../hooks/useIsMobile';
import { GRAMMAR_TOPICS, topicById } from '../data/grammarTopics';
import AnnotatedText from '../components/feedback/AnnotatedText';
import StagedLoader, { GRAMMAR_STAGES, PRACTICE_STAGES } from '../components/feedback/StagedLoader';
import WeaknessPractice from '../components/drills/WeaknessPractice';
import { wordCount } from '../components/drills/parts';
import SentenceBuilder from '../components/drills/SentenceBuilder';
import FeedbackLanguageToggle, { useFeedbackLanguage } from '../components/common/FeedbackLanguage';
import { useQueryClient } from '@tanstack/react-query';

const MAX_CHARS = 2000;
const isMastered = (progress) => !!progress?.quiz && !!progress?.writing;

function StepBadge({ done, children }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 99, color: done ? 'var(--accent-success)' : 'var(--text-muted)', background: done ? 'color-mix(in srgb, var(--accent-success) 12%, transparent)' : 'var(--bg-elevated)' }}>
      {done ? <CheckCircle size={12} /> : <span style={{ width: 10, height: 10, borderRadius: '50%', border: '2px solid var(--border)' }} />} {children}
    </span>
  );
}

function Segmented({ options, value, onChange, label }) {
  return (
    <div role="tablist" aria-label={label} style={{ display: 'inline-flex', padding: 3, borderRadius: 12, background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
      {options.map(([id, text]) => (
        <button key={id} type="button" role="tab" data-compact aria-selected={value === id} onClick={() => onChange(id)} style={{ padding: '7px 14px', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer', border: 'none', background: value === id ? 'var(--accent-primary)' : 'transparent', color: value === id ? 'white' : 'var(--text-secondary)' }}>{text}</button>
      ))}
    </div>
  );
}

function CheckResult({ result, text, onPractise, onTryAgain }) {
  const count = result.errors.length;
  const topics = [...new Set(result.errors.map(e => e.weakness))].map(topicById).filter(Boolean);

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 12, marginBottom: 12, background: count === 0 ? 'color-mix(in srgb, var(--accent-success) 12%, transparent)' : 'color-mix(in srgb, var(--accent-warning) 12%, transparent)' }}>
        {count === 0 ? <PartyPopper size={20} style={{ color: 'var(--accent-success)', flexShrink: 0 }} /> : <Target size={20} style={{ color: 'var(--accent-warning)', flexShrink: 0 }} />}
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
          {count === 0 ? 'No mistakes found. Great job!' : `${count} thing${count === 1 ? '' : 's'} to fix. You're learning!`}
        </div>
      </div>

      {result.focusFeedback && (
        <div style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid var(--accent-primary)', fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.6, marginBottom: 12 }}>
          <strong style={{ color: 'var(--accent-primary)' }}>Focus rule: </strong>{result.focusFeedback}
        </div>
      )}

      {count > 0 && <AnnotatedText text={text} errors={result.errors} title="Your writing, marked" />}

      {count > 0 && (
        <details style={{ marginBottom: 12 }}>
          <summary style={{ cursor: 'pointer', fontSize: 13, fontWeight: 700, color: 'var(--accent-success)' }}>Show the corrected version</summary>
          <p style={{ marginTop: 8, padding: '12px 14px', borderRadius: 12, background: 'color-mix(in srgb, var(--accent-success) 8%, var(--bg-card))', fontSize: 14, lineHeight: 1.8, color: 'var(--text-primary)', whiteSpace: 'pre-line' }}>{result.correctedText}</p>
        </details>
      )}

      {result.strengths?.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          {result.strengths.map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 4 }}>
              <CheckCircle size={15} style={{ color: 'var(--accent-success)', flexShrink: 0, marginTop: 3 }} /> {item}
            </div>
          ))}
        </div>
      )}

      {result.nextTip && (
        <div style={{ display: 'flex', gap: 8, padding: '10px 12px', borderRadius: 10, background: 'var(--bg-elevated)', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 12 }}>
          <Lightbulb size={15} style={{ color: 'var(--accent-warning)', flexShrink: 0, marginTop: 3 }} /> {result.nextTip}
        </div>
      )}

      <div className="chip-row" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {count > 0 && <button type="button" className="btn-primary" onClick={onTryAgain} style={{ padding: '9px 16px', fontSize: 13 }}>Fix it myself and check again</button>}
        {topics.slice(0, 2).map(topic => (
          <button key={topic.id} type="button" className="btn-secondary" onClick={() => onPractise(topic.id)} style={{ padding: '9px 14px', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            Practise: {topic.title} <ArrowRight size={13} />
          </button>
        ))}
      </div>
    </div>
  );
}

function GrammarChecker({ topic, language, placeholder, checksLeft, onPractise }) {
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);
  const check = useGrammarCheck();
  const inputRef = useRef(null);
  const words = wordCount(text);

  const submit = () => check.mutate({ text, topic, language }, { onSuccess: data => setResult({ ...data, text }) });
  const tryAgain = () => {
    setResult(null);
    inputRef.current?.focus();
    inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <div>
      <textarea
        ref={inputRef}
        className="input-dark"
        aria-label="Your sentences"
        value={text}
        maxLength={MAX_CHARS}
        onChange={e => { setText(e.target.value); if (result) setResult(null); }}
        placeholder={placeholder}
        spellCheck={false}
        style={{ minHeight: 140, resize: 'vertical', fontSize: 15, lineHeight: 1.7, marginBottom: 8 }}
      />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{words} words · {checksLeft ?? '–'} checks left today</span>
        <button type="button" className="btn-primary" disabled={check.isPending || text.trim().length < 10 || checksLeft === 0} onClick={submit} style={{ padding: '11px 20px', fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <SpellCheck size={16} /> {check.isPending ? 'Checking…' : 'Check my grammar'}
        </button>
      </div>
      {check.isPending && <StagedLoader stages={GRAMMAR_STAGES} note={null} />}
      {result && !check.isPending && <CheckResult result={result} text={result.text} onPractise={onPractise} onTryAgain={tryAgain} />}
    </div>
  );
}

function TopicView({ topic, language, checksLeft, progress, onBack, onPractise }) {
  const [quiz, setQuiz] = useState(null);
  const start = useStartWeaknessPractice();
  const queryClient = useQueryClient();

  return (
    <div>
      <button type="button" onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12, padding: 0 }}>
        <ArrowLeft size={14} /> All rules
      </button>
      <h2 style={{ fontSize: 20, fontFamily: 'var(--font-display)', marginBottom: 6 }}>{topic.title}</h2>
      <div className="chip-row" style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {isMastered(progress) ? <StepBadge done>Mastered</StepBadge> : (
          <>
            <StepBadge done={progress?.quiz}>Quiz 4/5 or better</StepBadge>
            <StepBadge done={progress?.writing}>Your own sentences without this mistake</StepBadge>
          </>
        )}
      </div>

      <section style={{ padding: '14px 16px', borderRadius: 14, background: 'var(--bg-card)', border: '1px solid var(--border)', marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-primary)', marginBottom: 6 }}>1 · THE RULE</div>
        <p style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--text-primary)' }}>{language === 'id' ? topic.ruleId : topic.rule}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
          {topic.examples.map(([wrong, right, note], i) => (
            <div key={i} style={{ padding: '10px 12px', borderRadius: 10, background: 'var(--bg-elevated)', fontSize: 14, lineHeight: 1.6 }}>
              <div style={{ display: 'flex', gap: 7, color: 'var(--accent-danger)' }}><XCircle size={15} style={{ flexShrink: 0, marginTop: 3 }} /><span style={{ textDecoration: 'line-through' }}>{wrong}</span></div>
              <div style={{ display: 'flex', gap: 7, color: 'var(--accent-success)', fontWeight: 600 }}><CheckCircle size={15} style={{ flexShrink: 0, marginTop: 3 }} /><span>{right}</span></div>
              {note && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, paddingLeft: 22 }}>{note}</div>}
            </div>
          ))}
        </div>
      </section>

      <section style={{ padding: '14px 16px', borderRadius: 14, background: 'var(--bg-card)', border: '1px solid var(--border)', marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-primary)', marginBottom: 6 }}>2 · BUILD THE SENTENCE</div>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 10 }}>Put the words in the right order. This trains your eye for correct sentences before you write your own.</p>
        <SentenceBuilder key={topic.id} sentences={topic.builder} />
      </section>

      <section style={{ padding: '14px 16px', borderRadius: 14, background: 'var(--bg-card)', border: '1px solid var(--border)', marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-primary)', marginBottom: 6 }}>3 · QUICK QUIZ</div>
        {quiz ? <WeaknessPractice key={quiz.id} set={quiz} onChecked={() => queryClient.invalidateQueries({ queryKey: ['grammar'] })} onClose={() => setQuiz(null)} /> : start.isPending ? <StagedLoader stages={PRACTICE_STAGES} note="Claude is writing 5 questions on this rule." /> : (
          <>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 10 }}>5 new questions on this rule. If you have made this mistake before, the questions are built from your own errors.</p>
            <button type="button" className="btn-primary" onClick={() => start.mutate({ skill: 'writing', weakness: topic.id }, { onSuccess: setQuiz })} style={{ padding: '10px 18px', fontSize: 14 }}>Start quiz</button>
          </>
        )}
      </section>

      <section style={{ padding: '14px 16px', borderRadius: 14, background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-primary)', marginBottom: 6 }}>4 · WRITE YOUR OWN</div>
        <p style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.6, marginBottom: 10 }}>{topic.task}</p>
        <GrammarChecker key={topic.id} topic={topic.id} language={language} checksLeft={checksLeft} onPractise={onPractise} placeholder="Write your sentences here. Mistakes are fine, that is how you learn." />
      </section>
    </div>
  );
}

function RecentChecks({ recent }) {
  if (!recent?.length) return null;
  return (
    <section style={{ marginTop: 26 }}>
      <h2 style={{ fontSize: 16, fontFamily: 'var(--font-display)', marginBottom: 10 }}>Recent checks</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {recent.map(check => (
          <details key={check.id} style={{ padding: '10px 12px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10 }}>
            <summary style={{ cursor: 'pointer', fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5, overflowWrap: 'anywhere' }}>
              {check.text.length > 90 ? `${check.text.slice(0, 90)}…` : check.text}
              <span style={{ fontSize: 12, color: check.errorCount ? 'var(--accent-warning)' : 'var(--accent-success)', fontWeight: 700 }}> · {check.errorCount ? `${check.errorCount} to fix` : 'all correct'}</span>
            </summary>
            <div style={{ marginTop: 10 }}>
              <AnnotatedText text={check.text} errors={check.result?.errors ?? []} title={check.topic ? `Focus: ${topicById(check.topic)?.title ?? check.topic}` : 'Marked'} />
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}

export default function GrammarLab() {
  const isMobile = useIsMobile();
  const [params, setParams] = useSearchParams();
  const [language] = useFeedbackLanguage();
  const { data: history } = useGrammarHistory();
  const tab = params.get('tab') === 'practice' ? 'practice' : 'check';
  const topic = topicById(params.get('topic'));
  const progress = history?.progress ?? {};
  const masteredCount = GRAMMAR_TOPICS.filter(t => isMastered(progress[t.id])).length;
  const nextTopic = GRAMMAR_TOPICS.find(t => !isMastered(progress[t.id]));

  const openTopic = (id) => { setParams({ tab: 'practice', topic: id }); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  return (
    <div style={{ padding: isMobile ? '20px 16px' : '36px 40px', maxWidth: 760, margin: '0 auto' }}>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <SpellCheck size={22} style={{ color: 'var(--accent-primary)' }} />
          <h1 style={{ fontSize: isMobile ? 22 : 26, fontFamily: 'var(--font-display)' }}>Grammar Lab</h1>
        </div>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>Not sure your grammar is right? Write it here and get gentle, simple corrections, then practise one rule at a time.</p>
      </motion.div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
        <Segmented label="Grammar Lab section" value={tab} onChange={value => setParams(value === 'practice' ? { tab: 'practice' } : {})} options={[['check', 'Check my writing'], ['practice', 'Practise a rule']]} />
        <FeedbackLanguageToggle label="Explain in" />
      </div>

      {tab === 'check' && (
        <>
          <section style={{ padding: '16px 18px', borderRadius: 14, background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 10 }}>Write a few sentences or a short paragraph (up to about 300 words). Only your grammar and word use are checked, not your ideas.</p>
            <GrammarChecker language={language} checksLeft={history?.checksLeft} onPractise={openTopic} placeholder="For example: Nowadays, many people thinks that online learning is more better than study in classroom." />
          </section>
          <RecentChecks recent={history?.recent} />
        </>
      )}

      {tab === 'practice' && (topic ? (
        <TopicView topic={topic} language={language} checksLeft={history?.checksLeft} progress={progress[topic.id]} onBack={() => setParams({ tab: 'practice' })} onPractise={openTopic} />
      ) : (
        <>
          <div style={{ padding: '12px 14px', borderRadius: 12, background: 'var(--bg-card)', border: '1px solid var(--border)', marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Rules mastered, in the suggested order</span>
              <span style={{ fontFamily: 'var(--font-score)', fontWeight: 700, color: 'var(--accent-primary)' }}>{masteredCount}/{GRAMMAR_TOPICS.length}</span>
            </div>
            <div style={{ height: 6, borderRadius: 99, background: 'var(--border)', overflow: 'hidden' }}>
              <div style={{ width: `${(masteredCount / GRAMMAR_TOPICS.length) * 100}%`, height: '100%', background: 'var(--accent-primary)', borderRadius: 99 }} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10 }}>
            {GRAMMAR_TOPICS.map((item, i) => {
              const mastered = isMastered(progress[item.id]);
              const isNext = nextTopic?.id === item.id;
              return (
                <button key={item.id} type="button" onClick={() => openTopic(item.id)} className="glow-card" style={{ textAlign: 'left', padding: 14, cursor: 'pointer', display: 'flex', gap: 12, alignItems: 'flex-start', border: `${isNext ? 2 : 1}px solid ${isNext ? 'var(--accent-primary)' : 'var(--border)'}` }}>
                  <span style={{ width: 30, height: 30, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: mastered ? 'var(--accent-success)' : 'color-mix(in srgb, var(--accent-primary) 14%, transparent)', color: mastered ? 'white' : 'var(--accent-primary)', fontFamily: 'var(--font-score)', fontWeight: 700, fontSize: 13 }}>
                    {mastered ? <CheckCircle size={16} /> : i + 1}
                  </span>
                  <span style={{ minWidth: 0, flex: 1 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 3 }}>
                      <span style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>{item.title}</span>
                      {isNext && <span style={{ fontSize: 11, fontWeight: 700, color: 'white', background: 'var(--accent-primary)', padding: '1px 8px', borderRadius: 99 }}>{masteredCount === 0 ? 'Start here' : 'Up next'}</span>}
                    </span>
                    <span style={{ display: 'block', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                      {mastered ? 'Mastered' : <span style={{ textDecoration: 'line-through', color: 'var(--accent-danger)' }}>{item.examples[0][0]}</span>}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </>
      ))}
    </div>
  );
}
