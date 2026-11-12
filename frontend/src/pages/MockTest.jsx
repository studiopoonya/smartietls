import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, FlaskConical, Loader2, Lock, Target, XCircle } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';
import { useExamStatus } from '../hooks/useCurriculum';
import { useIsMobile } from '../hooks/useIsMobile';
import { getBandColor } from '../lib/utils';
import GlowCard from '../components/common/GlowCard';
import BandScoreBar from '../components/common/BandScoreBar';
import { toast } from '../components/common/Toast';
import { AudioOnce, ClockBadge, QuestionItem, useCountdown, wordCount } from '../components/drills/parts';
import HighlightableText from '../components/drills/Highlighter';

const STAGE_LABELS = { listening: 'Listening', reading: 'Reading', writing: 'Writing' };
const STAGE_ORDER = ['listening', 'reading', 'writing'];
const AUTOSAVE_MS = 20000;
const FINALIZE_POLL_MS = 4000;
const errorMessage = (err) => err.response?.data?.message ?? 'Something went wrong. Please try again.';

const VERDICTS = {
  ready: { label: 'Ready to apply', color: 'var(--accent-success)' },
  almost: { label: 'Almost ready', color: 'var(--accent-warning)' },
  not_ready: { label: 'Not ready yet', color: 'var(--accent-danger)' },
};

function storageKey(examId, stage) {
  return `exam-${examId}-${stage}`;
}

function loadSaved(examId, stage) {
  try {
    return JSON.parse(sessionStorage.getItem(storageKey(examId, stage))) ?? {};
  } catch {
    return {};
  }
}

function saveProgress(examId, stage, answers) {
  try {
    sessionStorage.setItem(storageKey(examId, stage), JSON.stringify(answers));
  } catch {
    // Saving is a convenience for page reloads; the exam still works without it.
  }
}

function QuestionPalette({ items, answers, onJump, isMobile }) {
  return (
    <div style={{ display: 'flex', gap: 4, flexWrap: isMobile ? 'nowrap' : 'wrap', padding: isMobile ? '8px 12px' : '10px 16px', borderTop: '1px solid var(--border)', background: 'var(--bg-secondary)', maxHeight: isMobile ? 'none' : 92, overflowX: isMobile ? 'auto' : 'hidden', overflowY: isMobile ? 'hidden' : 'auto' }}>
      {items.map((item, i) => {
        const answered = !!answers[item.key];
        return (
          <button key={item.key} type="button" aria-label={`Question ${i + 1}${answered ? ', answered' : ''}`} onClick={() => onJump(item)} style={{ width: 28, height: 28, flexShrink: 0, borderRadius: 8, fontFamily: 'var(--font-score)', fontSize: 12, cursor: 'pointer', border: `1px solid ${answered ? 'var(--accent-primary)' : 'var(--border)'}`, background: answered ? 'var(--accent-primary)' : 'var(--bg-card)', color: answered ? 'white' : 'var(--text-secondary)' }}>{i + 1}</button>
        );
      })}
    </div>
  );
}

function abandonExam(exam, onChange) {
  if (!window.confirm('Quit this simulation? Your answers will be discarded and it will not be scored.')) return;
  api.post(`/exam/${exam.id}/abandon`)
    .then(r => { sessionStorage.removeItem(storageKey(exam.id, exam.stage)); onChange(r.data); })
    .catch(err => toast(errorMessage(err), 'error'));
}

function ExamShell({ exam, answers, onFinish, onQuit, submitting, palette, children }) {
  const left = useCountdown(exam.remainingSeconds, true, onFinish);
  const isMobile = useIsMobile();

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: isMobile ? '8px 12px' : '10px 16px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
        {isMobile ? (
          <div style={{ fontSize: 15, fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>{STAGE_LABELS[exam.stage]}</div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontFamily: 'var(--font-display)', fontWeight: 600 }}>
            {STAGE_ORDER.map((stage, i) => (
              <span key={stage} style={{ color: stage === exam.stage ? 'var(--text-primary)' : 'var(--text-muted)' }}>{i > 0 && '→ '}{STAGE_LABELS[stage]}</span>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 4 : 10 }}>
          <button type="button" onClick={onQuit} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 13 }}>Quit</button>
          <ClockBadge seconds={left} urgentAt={300} />
          <button type="button" className="btn-primary" disabled={submitting} onClick={() => { if (window.confirm(`Finish ${STAGE_LABELS[exam.stage]} now? You cannot return to this section.`)) onFinish(); }} style={{ padding: '8px 14px', fontSize: 14, whiteSpace: 'nowrap' }}>
            {submitting ? 'Sending…' : isMobile ? 'Finish' : 'Finish section'}
          </button>
        </div>
      </header>
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>{children}</div>
      {palette && <QuestionPalette items={palette.items} answers={answers} onJump={palette.onJump} isMobile={isMobile} />}
    </div>
  );
}

/** On a phone there is no room for two panes, so the learner switches between them. */
function PaneSwitch({ panes, active, onChange }) {
  return (
    <div role="tablist" style={{ display: 'flex', gap: 6, padding: '8px 12px', background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
      {panes.map(([value, label]) => (
        <button key={value} type="button" role="tab" aria-selected={active === value} onClick={() => onChange(value)} style={{ flex: 1, padding: '8px 12px', borderRadius: 12, fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-display)', cursor: 'pointer', border: 'none', background: active === value ? 'var(--accent-primary)' : 'var(--bg-elevated)', color: active === value ? 'white' : 'var(--text-secondary)' }}>{label}</button>
      ))}
    </div>
  );
}

function PartTabs({ count, active, onChange, label }) {
  return (
    <div role="tablist" style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg-card)' }}>
      {[...Array(count)].map((_, i) => (
        <button key={i} type="button" role="tab" aria-selected={active === i} onClick={() => onChange(i)} style={{ padding: '10px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none', borderBottom: `2px solid ${active === i ? 'var(--accent-primary)' : 'transparent'}`, background: 'transparent', color: active === i ? 'var(--text-primary)' : 'var(--text-muted)' }}>{label} {i + 1}</button>
      ))}
    </div>
  );
}

function ObjectiveStage({ exam, answers, setAnswers, submitting, onFinish, onQuit, isMobile }) {
  const [part, setPart] = useState(0);
  const [pane, setPane] = useState('passage');
  const [highlights, setHighlights] = useState({});
  const isReading = exam.stage === 'reading';
  const hidden = (name) => (isMobile && isReading && pane !== name ? 'none' : undefined);

  const numbered = useMemo(() => {
    let number = 0;
    return exam.content.map((unit, unitIndex) => unit.questions.map(question => {
      number += 1;
      return { key: `${unitIndex}-${question.id}`, unitIndex, number, question };
    }));
  }, [exam.content]);

  const unit = exam.content[part];
  const jump = (item) => {
    setPart(item.unitIndex);
    setPane('questions');
    setTimeout(() =>document.getElementById(`q-${item.key}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 0);
  };

  const questionColumn = (
    <div style={{ padding: isMobile ? 16 : 20, overflowY: 'auto', flex: 1, minWidth: 0, display: hidden('questions') }}>
      {numbered[part].map(item => (
        <QuestionItem key={item.key} anchorId={`q-${item.key}`} number={item.number} question={item.question} value={answers[item.key]} onChange={value => setAnswers(a => ({ ...a, [item.key]: value }))} />
      ))}
    </div>
  );

  return (
    <ExamShell exam={exam} answers={answers} onFinish={onFinish} onQuit={onQuit} submitting={submitting} palette={{ items: numbered.flat(), onJump: jump }}>
      <PartTabs count={exam.content.length} active={part} onChange={setPart} label={isReading ? 'Passage' : 'Part'} />
      {isReading && isMobile && <PaneSwitch panes={[['passage', 'Passage'], ['questions', 'Questions']]} active={pane} onChange={setPane} />}
      {isReading ? (
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: isMobile ? 'column' : 'row' }}>
          <article style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: isMobile ? 16 : 20, borderRight: isMobile ? 'none' : '1px solid var(--border)', display: hidden('passage') }}>
            <h2 style={{ fontSize: 17, fontFamily: 'var(--font-display)', marginBottom: 4 }}>{unit.title}</h2>
            <HighlightableText key={part} text={unit.passage} highlights={highlights[part] ?? []} onChange={ranges => setHighlights(h => ({ ...h, [part]: ranges }))} textStyle={{ fontSize: 16 }} background="var(--bg-primary)" />
          </article>
          {questionColumn}
        </div>
      ) : (
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', maxWidth: 760, width: '100%', margin: '0 auto' }}>
          {exam.content.map((section, i) => (
            <div key={i} style={{ padding: '16px 20px 0', display: i === part ? 'block' : 'none' }}>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 10 }}>{section.scenario}</div>
              <AudioOnce script={section.transcript} label={`Play Part ${i + 1}`} storageKey={`exam-${exam.id}-audio-${i}`} />
            </div>
          ))}
          {questionColumn}
        </div>
      )}
    </ExamShell>
  );
}

function WritingStage({ exam, answers, setAnswers, submitting, onFinish, onQuit, isMobile }) {
  const [task, setTask] = useState(0);
  const [pane, setPane] = useState('prompt');
  const hidden = (name) => (isMobile && pane !== name ? 'none' : undefined);
  const paper = exam.content[0];
  const key = task === 0 ? 'task1' : 'task2';
  const target = task === 0 ? 150 : 250;
  const text = answers[key] ?? '';
  const table = paper.task1.table;

  return (
    <ExamShell exam={exam} answers={answers} onFinish={onFinish} onQuit={onQuit} submitting={submitting}>
      <PartTabs count={2} active={task} onChange={setTask} label="Task" />
      {isMobile && <PaneSwitch panes={[['prompt', 'Question'], ['answer', 'Your answer']]} active={pane} onChange={setPane} />}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: isMobile ? 'column' : 'row' }}>
        <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: isMobile ? 16 : 20, borderRight: isMobile ? 'none' : '1px solid var(--border)', display: hidden('prompt') }}>
          <p style={{ fontSize: 15, lineHeight: 1.75, color: 'var(--text-primary)', marginBottom: 14 }}>{paper[key].prompt}</p>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14 }}>Write at least {target} words.</p>
          {task === 0 && table && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 13 }}>
                <caption style={{ textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>{table.caption}</caption>
                <thead><tr>{table.headers.map(h => <th key={h} style={{ border: '1px solid var(--border)', padding: '7px 10px', textAlign: 'left', color: 'var(--text-primary)' }}>{h}</th>)}</tr></thead>
                <tbody>{table.rows.map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j} style={{ border: '1px solid var(--border)', padding: '7px 10px', color: 'var(--text-secondary)' }}>{cell}</td>)}</tr>)}</tbody>
              </table>
            </div>
          )}
        </div>
        <div style={{ flex: 1, minHeight: 0, minWidth: 0, display: hidden('answer') ?? 'flex', flexDirection: 'column', padding: isMobile ? 12 : 16 }}>
          <textarea className="input-dark" aria-label={`Task ${task + 1} response`} spellCheck={false} value={text} onChange={e => { const value = e.target.value; setAnswers(a => ({ ...a, [key]: value })); }} style={{ flex: 1, resize: 'none', fontSize: 15, lineHeight: 1.7 }} />
          <div style={{ marginTop: 6, fontSize: 12, fontFamily: 'var(--font-score)', color: wordCount(text) >= target ? 'var(--accent-success)' : 'var(--text-muted)' }}>{wordCount(text)} words</div>
        </div>
      </div>
    </ExamShell>
  );
}

function ActiveStage({ exam, onChange, isMobile }) {
  const [answers, setAnswers] = useState(() => ({ ...exam.savedResponses, ...loadSaved(exam.id, exam.stage) }));
  const [submitting, setSubmitting] = useState(false);
  const answersRef = useRef(answers);
  const sentRef = useRef(false);
  const unsavedRef = useRef(false);

  useEffect(() => {
    if (answersRef.current !== answers) unsavedRef.current = true;
    answersRef.current = answers;
    saveProgress(exam.id, exam.stage, answers);
  }, [answers, exam.id, exam.stage]);

  // The server keeps a copy, so a section that times out while the learner is away still counts their answers.
  useEffect(() => {
    const interval = setInterval(() => {
      if (!unsavedRef.current || sentRef.current) return;
      unsavedRef.current = false;
      api.post(`/exam/${exam.id}/save`, { stage: exam.stage, responses: answersRef.current }).catch(() => { unsavedRef.current = true; });
    }, AUTOSAVE_MS);
    return () => clearInterval(interval);
  }, [exam.id, exam.stage]);

  const finish = useCallback(() => {
    if (sentRef.current) return;
    sentRef.current = true;
    setSubmitting(true);
    api.post(`/exam/${exam.id}/stage`, { stage: exam.stage, responses: answersRef.current })
      .then(r => { sessionStorage.removeItem(storageKey(exam.id, exam.stage)); onChange(r.data); })
      .catch(err => {
        toast(errorMessage(err), 'error');
        sentRef.current = false;
        setSubmitting(false);
      });
  }, [exam.id, exam.stage, onChange]);

  const Stage = exam.stage === 'writing' ? WritingStage : ObjectiveStage;
  return <Stage exam={exam} answers={answers} setAnswers={setAnswers} submitting={submitting} onFinish={finish} onQuit={() => abandonExam(exam, onChange)} isMobile={isMobile} />;
}

function Preparing({ exam, onChange }) {
  const [failed, setFailed] = useState(false);
  const runningRef = useRef(false);

  useEffect(() => {
    if (failed || runningRef.current) return;
    runningRef.current = true;
    api.post(`/exam/${exam.id}/prepare`)
      .then(r => { runningRef.current = false; onChange(r.data); })
      .catch(err => { runningRef.current = false; toast(errorMessage(err), 'error'); setFailed(true); });
  }, [exam, failed, onChange]);

  return (
    <GlowCard style={{ padding: 28, textAlign: 'center' }}>
      {!failed && <Loader2 size={26} style={{ color: 'var(--accent-primary)', animation: 'spin 0.8s linear infinite', marginBottom: 12 }} />}
      <style>{'@keyframes spin { to { transform: rotate(360deg); } }'}</style>
      <h2 style={{ fontSize: 17, fontFamily: 'var(--font-display)', marginBottom: 6 }}>{failed ? 'Preparation stopped' : 'Building your exam paper'}</h2>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14 }}>Section {exam.prepared} of {exam.totalUnits} ready. The clock starts only when every section is ready, and then the three sections run without a break.</p>
      <div style={{ height: 6, background: 'var(--border)', borderRadius: 99, overflow: 'hidden', maxWidth: 320, margin: '0 auto 14px' }}>
        <div style={{ height: '100%', width: `${(exam.prepared / exam.totalUnits) * 100}%`, background: 'var(--accent-primary)', transition: 'width 0.4s' }} />
      </div>
      {failed && (
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button type="button" className="btn-primary" onClick={() => setFailed(false)} style={{ padding: '10px 20px' }}>Try again</button>
          <button type="button" className="btn-secondary" onClick={() => abandonExam(exam, onChange)} style={{ padding: '10px 20px' }}>Cancel simulation</button>
        </div>
      )}
    </GlowCard>
  );
}

function Evaluating({ exam, onChange }) {
  const [failed, setFailed] = useState(false);
  const runningRef = useRef(false);

  useEffect(() => {
    if (failed || runningRef.current) return;
    runningRef.current = true;
    api.post(`/exam/${exam.id}/finalize`)
      .then(r => {
        runningRef.current = false;
        // Another request is already marking this paper, so wait for it instead of starting a second one.
        if (r.data.status === 'finalizing') setTimeout(() => onChange({ ...r.data }), FINALIZE_POLL_MS);
        else onChange(r.data);
      })
      .catch(err => { runningRef.current = false; toast(errorMessage(err), 'error'); setFailed(true); });
  }, [exam, failed, onChange]);

  return (
    <GlowCard style={{ padding: 28, textAlign: 'center' }}>
      {!failed && <Loader2 size={26} style={{ color: 'var(--accent-primary)', animation: 'spin 0.8s linear infinite', marginBottom: 12 }} />}
      <style>{'@keyframes spin { to { transform: rotate(360deg); } }'}</style>
      <h2 style={{ fontSize: 17, fontFamily: 'var(--font-display)', marginBottom: 6 }}>{failed ? 'Evaluation stopped' : 'Claude is marking your paper'}</h2>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14 }}>{failed ? 'Your answers are saved. You can retry safely.' : 'This usually takes about a minute.'}</p>
      {failed && (
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button type="button" className="btn-primary" onClick={() => setFailed(false)} style={{ padding: '10px 20px' }}>Retry evaluation</button>
          <button type="button" className="btn-secondary" onClick={() => abandonExam(exam, onChange)} style={{ padding: '10px 20px' }}>Cancel simulation</button>
        </div>
      )}
    </GlowCard>
  );
}

function ReadinessReport({ exam, onRestart, canRestart, isMobile }) {
  const { report, scores, overallBand } = exam;
  const verdict = VERDICTS[report.verdict];
  const lists = [['Strengths', report.strengths, 'var(--accent-success)'], ['Risks', report.risks, 'var(--accent-warning)'], ['Next steps', report.nextSteps, 'var(--accent-secondary)']];
  const bands = { listening: scores.listening.band, reading: scores.reading.band, writing: scores.writing.band, ...(scores.speakingEstimate != null && { speaking: scores.speakingEstimate }) };
  const weakest = Object.entries(bands).sort((a, b) => a[1] - b[1])[0]?.[0];
  const missed = report.skillChecks?.filter(check => !check.met).map(check => check.skill) ?? [];
  const focusSkills = [...new Set([...missed, weakest])].filter(Boolean).slice(0, 2);

  return (
    <div>
      <GlowCard style={{ padding: isMobile ? 18 : 24, marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.06em', marginBottom: 12 }}>SCORE READINESS REPORT</div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3,1fr)', gap: 12, marginBottom: 14 }}>
          <div><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>This simulation</div><div style={{ fontFamily: 'var(--font-score)', fontSize: 34, fontWeight: 700, color: getBandColor(overallBand) }}>{overallBand}</div></div>
          <div><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Stable prediction</div><div style={{ fontFamily: 'var(--font-score)', fontSize: 34, fontWeight: 700, color: getBandColor(report.stablePrediction) }}>{report.stablePrediction}</div></div>
          <div><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Against target {report.targetBand}</div><div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-display)', color: verdict.color, marginTop: 8 }}>{verdict.label}</div></div>
        </div>
        {!report.isStable && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>A stable prediction needs at least two simulations within half a band of each other. This one uses {report.simulationsUsed}.</p>}
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 14 }}>{report.summary}</p>
        <BandScoreBar label="Listening" score={scores.listening.band} />
        <BandScoreBar label="Reading" score={scores.reading.band} />
        <BandScoreBar label="Writing" score={scores.writing.band} />
        {scores.speakingEstimate != null && <BandScoreBar label="Speaking (from course work)" score={scores.speakingEstimate} />}

        {report.skillChecks?.length > 0 ? (
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>YOUR MINIMUM PER SKILL</div>
            {report.skillChecks.map(check => (
              <div key={check.skill} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', fontSize: 13, color: 'var(--text-secondary)' }}>
                {check.met ? <CheckCircle size={15} style={{ color: 'var(--accent-success)', flexShrink: 0 }} /> : <XCircle size={15} style={{ color: 'var(--accent-danger)', flexShrink: 0 }} />}
                <span style={{ flex: 1, textTransform: 'capitalize' }}>{check.skill}</span>
                <span style={{ fontFamily: 'var(--font-score)', fontWeight: 700 }}>{check.band ?? 'No score yet'} / {check.required}</span>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, marginTop: 12 }}>This verdict only checks your overall score. <Link to="/learn" style={{ color: 'var(--accent-primary)' }}>Set a minimum per skill</Link> if your programme requires one.</p>
        )}
      </GlowCard>

      {focusSkills.length > 0 && (
        <GlowCard style={{ padding: 16, marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <Target size={18} style={{ color: 'var(--accent-danger)', flexShrink: 0 }} />
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>Fix your weakest area next, using practice built from your own mistakes.</div>
          </div>
          <div className="chip-row" style={{ display: 'flex', gap: 8 }}>
            {focusSkills.map(skill => (
              <Link key={skill} to={`/error-bank?skill=${skill}`} className="btn-primary" style={{ padding: '9px 16px', fontSize: 13, textDecoration: 'none', textTransform: 'capitalize' }}>Fix {skill} →</Link>
            ))}
          </div>
        </GlowCard>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap: 12, marginBottom: 16 }}>
        {lists.map(([title, items, color]) => (
          <GlowCard key={title} style={{ padding: 16 }}>
            <div style={{ fontSize: 12, color, fontWeight: 600, marginBottom: 8, textTransform: 'uppercase' }}>{title}</div>
            {items?.map((item, i) => <div key={i} style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 6 }}>{item}</div>)}
          </GlowCard>
        ))}
      </div>

      {canRestart && <button type="button" className="btn-secondary" onClick={onRestart} style={{ padding: '12px 26px' }}>Take another simulation</button>}
    </div>
  );
}

export default function MockTest() {
  const isMobile = useIsMobile();
  const { data, isLoading } = useExamStatus();
  const queryClient = useQueryClient();
  const [exam, setExam] = useState(null);
  const [starting, setStarting] = useState(false);
  const pad = isMobile ? '20px 16px' : '36px 40px';

  const current = exam ?? data?.active ?? null;

  const updateExam = useCallback((next) => {
    if (next.status === 'abandoned') {
      setExam(null);
      queryClient.setQueryData(['exam-status'], d => ({ ...d, active: null }));
    } else {
      setExam(next);
    }
    if (next.status === 'completed' || next.status === 'abandoned') queryClient.invalidateQueries({ queryKey: ['exam-status'] });
  }, [queryClient]);

  const start = () => {
    setStarting(true);
    api.post('/exam')
      .then(r => setExam(r.data))
      .catch(err => toast(errorMessage(err), 'error'))
      .finally(() => setStarting(false));
  };

  if (isLoading || !data) {
    return <div style={{ padding: pad, maxWidth: 860, margin: '0 auto' }}><div className="skeleton" style={{ height: 240, borderRadius: 14 }} /></div>;
  }

  if (current?.status === 'in_progress') {
    return <ActiveStage key={`${current.id}-${current.stage}`} exam={current} onChange={updateExam} isMobile={isMobile} />;
  }

  const { gates, latest } = data;
  const report = current?.status === 'completed' ? current : latest;

  return (
    <div style={{ padding: pad, maxWidth: 860, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <div style={{ width: 36, height: 36, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <FlaskConical size={16} style={{ color: 'var(--accent-danger)' }} />
        </div>
        <h1 style={{ fontSize: isMobile ? 20 : 26 }}>Full Exam Simulation</h1>
      </div>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 22 }}>Listening 30 min → Reading 60 min → Writing 60 min, with no break between sections.</p>

      {current?.status === 'preparing' && <Preparing exam={current} onChange={updateExam} />}
      {(current?.status === 'evaluating' || current?.status === 'finalizing') && <Evaluating exam={current} onChange={updateExam} />}

      {(!current || current.status === 'completed') && (
        <>
          {!report && !gates.examUnlocked && (
            <GlowCard style={{ padding: 24, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}><Lock size={16} style={{ color: 'var(--text-muted)' }} /><h2 style={{ fontSize: 16, fontFamily: 'var(--font-display)' }}>Unlocks at {gates.components.required}% of component modules</h2></div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>{gates.pendingRewrite ? 'You also have a pending Rewrite Challenge to finish first.' : `You have completed ${gates.components.completed} of ${gates.components.total} Phase 2 modules (${gates.components.percent}%).`}</p>
              <Link to={gates.pendingRewrite ? '/error-bank' : '/learn'} className="btn-primary" style={{ padding: '10px 20px', textDecoration: 'none', display: 'inline-block' }}>{gates.pendingRewrite ? 'Go to Rewrite Challenge' : 'Continue learning'}</Link>
            </GlowCard>
          )}

          {!report && gates.examUnlocked && (
            <GlowCard style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}><CheckCircle size={16} style={{ color: 'var(--accent-success)' }} /><h2 style={{ fontSize: 16, fontFamily: 'var(--font-display)' }}>You are eligible</h2></div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14, lineHeight: 1.7 }}>Set aside 2.5 hours in a quiet place. Each recording plays only once, and sections submit automatically when the time ends.</p>
              <button type="button" className="btn-primary" disabled={starting} onClick={start} style={{ padding: '12px 26px' }}>{starting ? 'Starting…' : 'Begin simulation'}</button>
            </GlowCard>
          )}

          {report && <ReadinessReport exam={report} isMobile={isMobile} canRestart={gates.examUnlocked && !starting} onRestart={start} />}
        </>
      )}
    </div>
  );
}
