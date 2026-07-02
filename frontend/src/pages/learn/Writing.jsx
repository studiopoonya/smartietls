import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { PenLine, Send, RotateCcw, Lock, CheckCircle2, RefreshCw, Shuffle } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { useIsMobile } from '../../hooks/useIsMobile';
import GlowCard from '../../components/common/GlowCard';
import BandScoreBar from '../../components/common/BandScoreBar';
import WordCounter from '../../components/common/WordCounter';
import { getBandColor } from '../../lib/utils';
import api from '../../lib/axios';

/* ─── Chart data pool ─── */
const TASK1_CHART_POOL = [
  {
    type: 'line',
    title: 'Households in Owned and Rented Accommodation, England & Wales (1918–2011)',
    xKey: 'year', unit: '%',
    series: [
      { key: 'owned', label: 'Owned', color: '#7c3aed' },
      { key: 'rented', label: 'Rented', color: '#06b6d4' },
    ],
    data: [
      { year: '1918', owned: 23, rented: 77 },
      { year: '1939', owned: 32, rented: 68 },
      { year: '1953', owned: 38, rented: 62 },
      { year: '1961', owned: 43, rented: 57 },
      { year: '1971', owned: 50, rented: 50 },
      { year: '1981', owned: 58, rented: 42 },
      { year: '1991', owned: 67, rented: 33 },
      { year: '2001', owned: 69, rented: 31 },
      { year: '2011', owned: 64, rented: 36 },
    ],
  },
  {
    type: 'bar',
    title: 'Number of Visitors to London Museums, 2023 (millions)',
    xKey: 'museum', unit: 'M',
    series: [{ key: 'visitors', label: 'Visitors (M)', color: '#7c3aed' }],
    data: [
      { museum: 'British Museum', visitors: 5.8 },
      { museum: 'Nat. Gallery', visitors: 4.2 },
      { museum: 'V&A Museum', visitors: 3.1 },
      { museum: 'Science Museum', visitors: 2.9 },
    ],
  },
  {
    type: 'line',
    title: 'Average Monthly Temperature in Three Cities (°C)',
    xKey: 'month', unit: '°C',
    series: [
      { key: 'london', label: 'London', color: '#7c3aed' },
      { key: 'sydney', label: 'Sydney', color: '#06b6d4' },
      { key: 'dubai',  label: 'Dubai',  color: '#f59e0b' },
    ],
    data: [
      { month: 'Jan', london: 5,  sydney: 26, dubai: 19 },
      { month: 'Mar', london: 8,  sydney: 24, dubai: 23 },
      { month: 'May', london: 14, sydney: 18, dubai: 33 },
      { month: 'Jul', london: 19, sydney: 13, dubai: 41 },
      { month: 'Sep', london: 16, sydney: 16, dubai: 37 },
      { month: 'Nov', london: 9,  sydney: 22, dubai: 26 },
    ],
  },
  {
    type: 'bar',
    title: 'Internet Users by Region, 2023 (% of population)',
    xKey: 'region', unit: '%',
    series: [{ key: 'pct', label: 'Internet Users (%)', color: '#10b981' }],
    data: [
      { region: 'North America', pct: 93 },
      { region: 'Europe',        pct: 89 },
      { region: 'Latin America', pct: 74 },
      { region: 'Asia Pacific',  pct: 68 },
      { region: 'Africa',        pct: 43 },
    ],
  },
  {
    type: 'line',
    title: 'Electricity Generated from Renewable Sources (% of total), 2000–2020',
    xKey: 'year', unit: '%',
    series: [
      { key: 'germany', label: 'Germany', color: '#7c3aed' },
      { key: 'uk',      label: 'UK',      color: '#06b6d4' },
      { key: 'usa',     label: 'USA',     color: '#f59e0b' },
    ],
    data: [
      { year: '2000', germany: 6,  uk: 2,  usa: 9  },
      { year: '2005', germany: 10, uk: 4,  usa: 9  },
      { year: '2010', germany: 17, uk: 7,  usa: 10 },
      { year: '2015', germany: 30, uk: 25, usa: 13 },
      { year: '2020', germany: 46, uk: 43, usa: 20 },
    ],
  },
];

function Task1Chart({ chart, isMobile }) {
  const height = isMobile ? 200 : 250;
  const axisStyle = { fill: 'var(--text-muted)', fontSize: 11 };
  const gridProps = { stroke: 'rgba(255,255,255,0.06)' };
  const tooltipStyle = { background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 };
  const commonProps = { data: chart.data, margin: { top: 10, right: 20, left: 0, bottom: 5 } };
  const unit = chart.unit ?? '';

  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, textAlign: 'center', fontStyle: 'italic' }}>{chart.title}</div>
      <ResponsiveContainer width="100%" height={height}>
        {chart.type === 'line' ? (
          <LineChart {...commonProps}>
            <CartesianGrid {...gridProps} />
            <XAxis dataKey={chart.xKey} tick={axisStyle} />
            <YAxis tick={axisStyle} unit={unit} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {chart.series.map(s => (
              <Line key={s.key} type="monotone" dataKey={s.key} name={s.label} stroke={s.color} strokeWidth={2} dot={{ r: 3 }} />
            ))}
          </LineChart>
        ) : (
          <BarChart {...commonProps}>
            <CartesianGrid {...gridProps} />
            <XAxis dataKey={chart.xKey} tick={axisStyle} />
            <YAxis tick={axisStyle} unit={unit} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {chart.series.map(s => (
              <Bar key={s.key} dataKey={s.key} name={s.label} fill={s.color} radius={[4, 4, 0, 0]} />
            ))}
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

/* ─── Prompt pools ─── */
const TASK1_PROMPT_POOL = [
  'The graph below shows the percentage of households in owned and rented accommodation in England and Wales between 1918 and 2011. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
  'The bar chart below shows the number of visitors to four museums in London in 2023. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
  'The line graph below shows the average monthly temperature in three cities over one year. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
  'The bar chart below shows the percentage of people who use the internet in different regions of the world in 2023. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
  'The line graph below shows the percentage of electricity generated from renewable sources in three countries between 2000 and 2020. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
];

const TASK2_PROMPT_POOL = [
  'Some people think that the best way to increase road safety is to increase the minimum legal age for driving cars or motorcycles. To what extent do you agree or disagree?',
  'In many countries, more and more young people are leaving school and unable to find jobs. What problems does youth unemployment cause for individuals and society? Suggest some measures that could be taken to reduce the level of youth unemployment.',
  'Some people believe that it is best to accept a bad situation, such as an unsatisfactory job or shortage of money. Others argue that it is better to try to improve such situations. Discuss both views and give your own opinion.',
  'In some countries, the average weight of people is increasing and their levels of health and fitness are decreasing. What do you think are the causes of these problems and what measures could be taken to solve them?',
  'Technology is increasingly being used to monitor what people say and do. In your opinion, is this a positive or negative development?',
];

function pickRandom(pool, count) {
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function buildSteps(t1Prompts, t1Charts, t2Prompts) {
  return [
    { taskType: 'task1', label: 'Task 1', sublabel: 'Graph / Chart',   prompt: t1Prompts[0], chart: t1Charts[0], minWords: 150, timeSecs: 20 * 60 },
    { taskType: 'task1', label: 'Task 2', sublabel: 'Graph / Chart',   prompt: t1Prompts[1], chart: t1Charts[1], minWords: 150, timeSecs: 20 * 60 },
    { taskType: 'task2', label: 'Task 3', sublabel: 'Essay',           prompt: t2Prompts[0], chart: null,        minWords: 250, timeSecs: 40 * 60 },
    { taskType: 'task2', label: 'Task 4', sublabel: 'Essay',           prompt: t2Prompts[1], chart: null,        minWords: 250, timeSecs: 40 * 60 },
  ];
}

function generateSteps() {
  const t1Idx = pickRandom([0, 1, 2, 3, 4], 2);
  const t2Idx = pickRandom([0, 1, 2, 3, 4], 2);
  return buildSteps(
    t1Idx.map(i => TASK1_PROMPT_POOL[i]),
    t1Idx.map(i => TASK1_CHART_POOL[i]),
    t2Idx.map(i => TASK2_PROMPT_POOL[i]),
  );
}


const fmtTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

/* ─── Main component ─── */
export default function Writing() {
  const [steps, setSteps]       = useState(() => generateSteps());
  const [essays, setEssays]     = useState(['', '', '', '']);
  const [stepIdx, setStepIdx]   = useState(0);
  const [maxReached, setMaxReached] = useState(0);
  const [analyzing, setAnalyzing]   = useState(false);
  const [taskDone, setTaskDone]     = useState([false, false, false, false]);
  const [results, setResults]       = useState(null);
  const [timeLeft, setTimeLeft]     = useState(steps[0].timeSecs);
  const [timeUp, setTimeUp]         = useState(false);
  const timerRef = useRef(null);
  const isMobile = useIsMobile();

  /* Essay for current step — read/write into the array */
  const essay    = essays[stepIdx];
  const setEssay = (val) => setEssays(prev => { const n = [...prev]; n[stepIdx] = val; return n; });

  const handleShuffle = useCallback(() => {
    const newSteps = generateSteps();
    setSteps(newSteps);
    setEssays(['', '', '', '']);
    setTimeLeft(newSteps[0].timeSecs);
    setTimeUp(false);
  }, []);

  /* Countdown — resets on each step */
  useEffect(() => {
    clearInterval(timerRef.current);
    setTimeUp(false);
    setTimeLeft(steps[stepIdx].timeSecs);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(timerRef.current); setTimeUp(true); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [stepIdx, steps]);

  const step   = steps[stepIdx];
  const prompt = step.prompt;
  const chart  = step.chart;
  const isLast = stepIdx === steps.length - 1;
  const pad       = isMobile ? '20px 16px' : '36px 40px';
  const wordCount = essay ? essay.trim().split(/\s+/).filter(Boolean).length : 0;
  const canGo     = wordCount >= 10;

  const handleContinue = () => {
    const next = stepIdx + 1;
    if (next > maxReached) setMaxReached(next);
    setStepIdx(next);
  };

  const handleFinish = async () => {
    setAnalyzing(true);
    setTaskDone([false, false, false, false]);
    const allResults = new Array(steps.length).fill(null);
    try {
      await Promise.all(
        steps.map(async (s, i) => {
          const data = await api.post('/ai/writing/analyze', { essay: essays[i], task_type: s.taskType, prompt: s.prompt }).then(r => r.data);
          allResults[i] = data;
          setTaskDone(prev => { const n = [...prev]; n[i] = true; return n; });
        })
      );
      setResults(allResults);
      allResults.forEach((res, i) => {
        const s = steps[i];
        api.post('/sessions', { module: 'writing', input_data: { task_type: s.taskType, prompt: s.prompt, essay: essays[i] }, ai_feedback: res, band_score: res.overallBand }).catch(() => {});
      });
    } catch {
      /* leave analyzing=false so user can retry */
    } finally {
      setAnalyzing(false);
    }
  };

  const handleRestart = () => {
    clearInterval(timerRef.current);
    const newSteps = generateSteps();
    setSteps(newSteps);
    setEssays(['', '', '', '']); setStepIdx(0); setMaxReached(0);
    setResults(null); setAnalyzing(false);
  };

  const navigateTo = (idx) => {
    if (idx > maxReached) return;
    setStepIdx(idx);
  };

  /* ── Analyzing screen ── */
  if (analyzing) {
    const doneCount = taskDone.filter(Boolean).length;
    const pct       = Math.round((doneCount / steps.length) * 100);
    return (
      <div style={{ padding: pad, maxWidth: isMobile ? '100%' : 520 }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <GlowCard style={{ padding: isMobile ? 28 : 44, textAlign: 'center' }}>
            {/* Spinner */}
            <div style={{ width: 44, height: 44, border: '3px solid var(--border)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 20px' }} />
            <h2 style={{ fontSize: 18, marginBottom: 6 }}>Analyzing your writing...</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 28 }}>AI is reviewing all 4 tasks simultaneously</p>

            {/* Percentage */}
            <div style={{ fontFamily: 'Space Mono', fontSize: isMobile ? 48 : 64, fontWeight: 700, lineHeight: 1, color: 'var(--accent-primary)', marginBottom: 6 }}>
              {pct}%
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20 }}>
              {doneCount} of {steps.length} tasks analyzed
            </div>

            {/* Progress bar */}
            <div style={{ width: '100%', height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden', marginBottom: 24 }}>
              <motion.div
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                style={{ height: '100%', background: 'linear-gradient(90deg, var(--accent-primary), #06B6D4)', borderRadius: 3 }}
              />
            </div>

            {/* Per-task status */}
            <div style={{ display: 'flex', gap: isMobile ? 6 : 10, justifyContent: 'center' }}>
              {steps.map((s, i) => (
                <div key={i} style={{
                  flex: 1, padding: '10px 6px', borderRadius: 10,
                  background: taskDone[i] ? 'rgba(16,185,129,0.12)' : 'rgba(124,58,237,0.08)',
                  border: `1px solid ${taskDone[i] ? 'rgba(16,185,129,0.35)' : 'rgba(124,58,237,0.2)'}`,
                  transition: 'all 0.3s',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 5 }}>
                    {taskDone[i]
                      ? <CheckCircle2 size={16} style={{ color: 'var(--accent-success)' }} />
                      : <div style={{ width: 14, height: 14, border: '2px solid rgba(124,58,237,0.5)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 0.9s linear infinite' }} />
                    }
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: taskDone[i] ? 'var(--accent-success)' : 'var(--text-muted)', fontFamily: 'Space Grotesk' }}>
                    {s.label}
                  </div>
                  <div style={{ fontSize: 9, color: taskDone[i] ? 'rgba(16,185,129,0.7)' : 'var(--text-muted)', marginTop: 2 }}>
                    {taskDone[i] ? 'Done' : 'Analyzing'}
                  </div>
                </div>
              ))}
            </div>
          </GlowCard>
        </motion.div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  /* ── Results screen ── */
  if (results) {
    const avg = results.reduce((s, r) => s + (r?.overallBand ?? 0), 0) / results.length;
    return (
      <div style={{ padding: pad, maxWidth: isMobile ? '100%' : 700 }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <GlowCard style={{ padding: 28, textAlign: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Overall Writing Score</div>
            <div style={{ fontFamily: 'Space Mono', fontSize: 64, fontWeight: 700, color: getBandColor(+avg.toFixed(1)), lineHeight: 1 }}>{avg.toFixed(1)}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, marginBottom: 22 }}>Average across 4 tasks</div>
            <button onClick={handleRestart} className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <RefreshCw size={15} /> Start Over
            </button>
          </GlowCard>
          {results.map((res, i) => res && (
            <GlowCard key={i} style={{ padding: 18, marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{steps[i].label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{steps[i].sublabel}</div>
                </div>
                <div style={{ fontFamily: 'Space Mono', fontSize: 26, fontWeight: 700, color: getBandColor(res.overallBand) }}>{res.overallBand}</div>
              </div>
              <BandScoreBar label="Task Achievement"     score={res.criteria?.taskAchievement?.score} />
              <BandScoreBar label="Coherence & Cohesion" score={res.criteria?.coherenceCohesion?.score} />
              <BandScoreBar label="Lexical Resource"     score={res.criteria?.lexicalResource?.score} />
              <BandScoreBar label="Grammatical Range"    score={res.criteria?.grammaticalRange?.score} />
              {res.highlights?.vocabularyToImprove?.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 11, color: '#F59E0B', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase' }}>Vocab Upgrades</div>
                  {res.highlights.vocabularyToImprove.slice(0, 3).map((v, j) => (
                    <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, fontSize: 12 }}>
                      <span style={{ color: 'var(--accent-danger)', fontFamily: 'Space Mono' }}>{v.original}</span>
                      <span style={{ color: 'var(--text-muted)' }}>→</span>
                      <span style={{ color: 'var(--accent-success)', fontFamily: 'Space Mono', fontWeight: 700 }}>{v.suggestion}</span>
                    </div>
                  ))}
                </div>
              )}
            </GlowCard>
          ))}
        </motion.div>
      </div>
    );
  }

  /* ── Writing screen ── */
  return (
    <div style={{ padding: pad, maxWidth: isMobile ? '100%' : 760 }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <div style={{ width: 36, height: 36, background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <PenLine size={16} style={{ color: 'var(--accent-primary)' }} />
          </div>
          <h1 style={{ fontSize: isMobile ? 20 : 26 }}>Writing Practice</h1>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Complete all tasks, then get AI feedback on everything at once</p>
      </motion.div>

      {/* Step progress bar */}
      <div style={{ display: 'flex', gap: isMobile ? 4 : 8, marginBottom: 20 }}>
        {steps.map((s, i) => {
          const isPast    = i < stepIdx;
          const isCurrent = i === stepIdx;
          const isLocked  = i > maxReached;
          return (
            <button key={i} onClick={() => navigateTo(i)} disabled={isLocked}
              style={{
                flex: 1, padding: isMobile ? '8px 4px' : '9px 8px', borderRadius: 10,
                border: `1px solid ${isCurrent ? 'var(--accent-primary)' : isPast ? 'rgba(124,58,237,0.35)' : 'var(--border)'}`,
                background: isCurrent ? 'rgba(124,58,237,0.15)' : isPast ? 'rgba(124,58,237,0.07)' : 'var(--bg-elevated)',
                color: isLocked ? 'var(--text-muted)' : isCurrent ? 'var(--accent-glow)' : isPast ? 'var(--accent-primary)' : 'var(--text-secondary)',
                cursor: isLocked ? 'default' : 'pointer', textAlign: 'center',
                fontSize: isMobile ? 10 : 12, fontWeight: 600, fontFamily: 'Space Grotesk',
                transition: 'all 0.2s', opacity: isLocked ? 0.45 : 1,
              }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                {isPast ? <CheckCircle2 size={11} style={{ color: 'var(--accent-success)' }} /> : isLocked ? <Lock size={10} /> : null}
                {s.label}
              </div>
              {!isMobile && <div style={{ fontSize: 10, opacity: 0.65, marginTop: 2 }}>{s.sublabel}</div>}
            </button>
          );
        })}
      </div>

      {/* Shuffle prompts — only on step 0 before typing */}
      {stepIdx === 0 && essays.every(e => !e.trim()) && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
          <button onClick={handleShuffle}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 8, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'Space Grotesk', transition: 'all 0.2s' }}>
            <Shuffle size={12} /> Shuffle Prompts
          </button>
        </div>
      )}

      {/* Content */}
      <motion.div key={stepIdx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        {/* Question card */}
        <GlowCard style={{ padding: isMobile ? 14 : 20, marginBottom: 12 }} hover={false}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Question</div>
            <div style={{ fontSize: 11, color: 'var(--accent-primary)', fontWeight: 600, fontFamily: 'Space Mono' }}>
              {step.taskType === 'task1' ? 'Task 1 · Report' : 'Task 2 · Essay'} · min {step.minWords} words
            </div>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.75 }}>{prompt}</p>
          {chart && <Task1Chart chart={chart} isMobile={isMobile} />}
        </GlowCard>

        {/* Essay editor */}
        <GlowCard hover={false} style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Your {step.taskType === 'task1' ? 'Report' : 'Essay'}</span>
              <WordCounter text={essay} target={step.minWords} />
            </div>
            <span style={{
              fontSize: 13, fontFamily: 'Space Mono', fontWeight: 700,
              color: timeUp ? 'var(--accent-danger)' : timeLeft <= 120 ? 'var(--accent-danger)' : timeLeft <= 300 ? '#F59E0B' : 'var(--accent-success)',
              animation: timeUp ? 'timeblink 1s step-start infinite' : 'none',
            }}>
              ⏱ {timeUp ? "Time's up!" : fmtTime(timeLeft)}
            </span>
          </div>
          {timeUp && (
            <div style={{ padding: '7px 16px', background: 'rgba(239,68,68,0.1)', borderBottom: '1px solid rgba(239,68,68,0.2)', fontSize: 12, color: 'var(--accent-danger)', fontWeight: 600 }}>
              Time is up — you can still continue.
            </div>
          )}
          <textarea className="input-dark" value={essay} onChange={e => setEssay(e.target.value)}
            placeholder={`Write your ${step.taskType === 'task1' ? 'report' : 'essay'} here... (min ${step.minWords} words)`}
            style={{ borderRadius: 0, border: 'none', minHeight: isMobile ? 280 : 360, padding: '16px', fontSize: 15, lineHeight: 1.8, resize: 'none', width: '100%' }} />
          <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button onClick={() => setEssay('')}
              style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 12 }}>
              <RotateCcw size={13} /> Reset
            </button>
            {isLast ? (
              <button className="btn-primary" onClick={handleFinish} disabled={!canGo}
                style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 20px', fontSize: 14, opacity: !canGo ? 0.45 : 1 }}>
                <Send size={14} /> Finish &amp; Analyze
              </button>
            ) : (
              <button className="btn-primary" onClick={handleContinue} disabled={!canGo}
                style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', fontSize: 14, opacity: !canGo ? 0.45 : 1 }}>
                <Send size={14} /> Continue
              </button>
            )}
          </div>
        </GlowCard>
      </motion.div>
      <style>{`@keyframes timeblink{0%,100%{opacity:1}50%{opacity:0.2}}`}</style>
    </div>
  );
}

