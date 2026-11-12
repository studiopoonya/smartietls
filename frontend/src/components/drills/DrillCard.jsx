import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle, Loader2, Mic, Sparkles, Square } from 'lucide-react';
import { useDrillNext, useDrillStart, useDrillSubmit } from '../../hooks/useCurriculum';
import { getBandColor } from '../../lib/utils';
import { useSpeechInput } from '../../lib/speech';
import { AudioOnce, ClockBadge, Passage, QuestionItem, QuizResults, useCountdown, wordCount } from './parts';
import AnnotatedText from '../feedback/AnnotatedText';
import StagedLoader, { SPEAKING_STAGES, WRITING_STAGES } from '../feedback/StagedLoader';

function Questions({ questions, answers, setAnswers, colorHex, offset = 0 }) {
  return questions.map((q, i) => (
    <QuestionItem key={q.id} number={offset + i + 1} question={q} value={answers[q.id]} colorHex={colorHex} onChange={value => setAnswers(a => ({ ...a, [q.id]: value }))} />
  ));
}

function PrimaryButton({ children, pending, pendingLabel = 'Checking…', colorHex, ...props }) {
  return (
    <button type="button" disabled={pending} {...props} className="btn-chunky" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 22px 13px', background: colorHex, color: 'white', fontSize: 15, cursor: pending ? 'wait' : 'pointer', opacity: pending ? 0.7 : 1 }}>
      {pending && <Loader2 size={15} style={{ animation: 'spin 0.8s linear infinite' }} />}
      {pending ? pendingLabel : children}
      <style>{'@keyframes spin { to { transform: rotate(360deg); } }'}</style>
    </button>
  );
}

function Outcome({ result, colorHex }) {
  return (
    <>
      {result.lessonCompleted && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 10, marginTop: 12, fontSize: 13, fontWeight: 600, color: colorHex, background: `${colorHex}14` }}>
          <CheckCircle size={15} /> Lesson complete
        </div>
      )}
      {result.rewriteCreated && (
        <Link to="/error-bank" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 10, marginTop: 10, fontSize: 13, fontWeight: 600, color: 'var(--accent-warning)', background: 'rgba(245,158,11,0.12)', textDecoration: 'none' }}>
          <AlertTriangle size={15} /> Module finished. Complete your Rewrite Challenge to continue →
        </Link>
      )}
    </>
  );
}

function ScoreSummary({ result, colorHex, onRetry }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
        <div>
          <span style={{ fontFamily: 'var(--font-score)', fontSize: 24, fontWeight: 700, color: result.passed ? 'var(--accent-success)' : 'var(--accent-danger)' }}>{result.correct}/{result.total}</span>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)', marginLeft: 10 }}>{result.late ? 'Submitted after the time limit, so no answers were counted' : result.passed ? 'Passed' : 'You need 70% to pass'}</span>
        </div>
        <button type="button" className="btn-secondary" onClick={onRetry} style={{ padding: '8px 16px', fontSize: 13 }}>Try again</button>
      </div>
      <QuizResults results={result.results} />
      <Outcome result={result} colorHex={colorHex} />
    </div>
  );
}

function QuizDrill({ drill, colorHex }) {
  const { payload } = drill;
  const limit = payload.timeLimitSeconds;
  const [started, setStarted] = useState(!limit);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const submit = useDrillSubmit(drill.slug);
  const answersRef = useRef(answers);
  answersRef.current = answers;

  const send = () => { if (!submit.isPending) submit.mutate({ responses: answersRef.current }, { onSuccess: setResult }); };
  const left = useCountdown(limit ?? 0, started && !!limit && !result, send);

  if (result) return <ScoreSummary result={result} colorHex={colorHex} onRetry={() => { setResult(null); setAnswers({}); setStarted(!limit); }} />;

  if (!started) {
    return <PrimaryButton colorHex={colorHex} onClick={() => setStarted(true)}>Start the {limit}-second timer</PrimaryButton>;
  }

  return (
    <div>
      {limit && <div style={{ marginBottom: 12 }}><ClockBadge seconds={left} urgentAt={15} /></div>}
      {payload.audioScript && <AudioOnce script={payload.audioScript} colorHex={colorHex} />}
      {payload.passage && <Passage text={payload.passage} />}
      <Questions questions={payload.questions} answers={answers} setAnswers={setAnswers} colorHex={colorHex} />
      <PrimaryButton colorHex={colorHex} pending={submit.isPending} onClick={send}>Check answers</PrimaryButton>
    </div>
  );
}

function TimedPassageDrill({ drill, colorHex }) {
  const limit = drill.payload.timeLimitSeconds;
  const [content, setContent] = useState(null);
  const [remaining, setRemaining] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const start = useDrillStart(drill.slug);
  const submit = useDrillSubmit(drill.slug);
  const answersRef = useRef(answers);
  answersRef.current = answers;

  const send = () => { if (!submit.isPending) submit.mutate({ responses: answersRef.current }, { onSuccess: setResult }); };
  const left = useCountdown(remaining ?? limit, !!content && !result, send);

  if (result) return <ScoreSummary result={result} colorHex={colorHex} onRetry={() => { setResult(null); setAnswers({}); setContent(null); setRemaining(null); }} />;

  if (!content) {
    return <PrimaryButton colorHex={colorHex} pending={start.isPending} pendingLabel="Generating your passage…" onClick={() => start.mutate(undefined, { onSuccess: d => { setRemaining(d.remainingSeconds); setContent(d.content); } })}>Start timed passage</PrimaryButton>;
  }

  return (
    <div>
      <div style={{ position: 'sticky', top: 0, zIndex: 5, padding: '6px 0', background: 'var(--bg-card)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <ClockBadge seconds={left} urgentAt={120} />
        {content.band && <span title="Passages start near your placement level and get harder each time you pass" style={{ fontSize: 12, fontWeight: 700, color: colorHex, background: `${colorHex}14`, padding: '4px 10px', borderRadius: 99 }}>Level: Band {content.band}</span>}
      </div>
      <Passage title={content.title} text={content.passage} />
      <Questions questions={content.questions} answers={answers} setAnswers={setAnswers} colorHex={colorHex} />
      <PrimaryButton colorHex={colorHex} pending={submit.isPending} onClick={send}>Submit passage</PrimaryButton>
    </div>
  );
}

function AdaptiveDrill({ drill, colorHex, baseOffset = 5 }) {
  const [state, setState] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const start = useDrillStart(drill.slug);
  const next = useDrillNext(drill.slug);

  const advance = () => next.mutate({ responses: answers, blockIndex: state.blockIndex }, {
    onSuccess: (data) => {
      setAnswers({});
      if (data.done) setResult(data); else setState(data);
    },
  });

  if (result) {
    return (
      <div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Your estimated band</div>
        <div style={{ fontFamily: 'var(--font-score)', fontSize: 40, fontWeight: 700, color: getBandColor(result.band) }}>{result.band}</div>
        <Outcome result={result} colorHex={colorHex} />
      </div>
    );
  }

  if (!state) {
    return <PrimaryButton colorHex={colorHex} pending={start.isPending} pendingLabel="Preparing block 1…" onClick={() => start.mutate(undefined, { onSuccess: setState })}>Start placement test</PrimaryButton>;
  }

  const isListening = drill.payload.diagnosticSkill === 'listening';
  const last = state.blockIndex + 1 === state.totalBlocks;

  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 600, color: colorHex, marginBottom: 10 }}>BLOCK {state.blockIndex + 1} OF {state.totalBlocks}</div>
      {isListening ? <AudioOnce key={state.blockIndex} script={state.block.text} colorHex={colorHex} /> : <Passage title={state.block.title} text={state.block.text} />}
      <Questions questions={state.block.questions} answers={answers} setAnswers={setAnswers} colorHex={colorHex} offset={state.blockIndex * baseOffset} />
      <PrimaryButton colorHex={colorHex} pending={next.isPending} pendingLabel={last ? 'Calculating…' : 'Preparing next block…'} onClick={advance}>{last ? 'Finish test' : 'Next block'}</PrimaryButton>
    </div>
  );
}

function AiFeedback({ result, colorHex, onRetry }) {
  const { evaluation: e, band, passed } = result;
  const sections = [
    ['Strengths', e.strengths, 'var(--accent-success)'],
    ['To improve', e.improvements, 'var(--accent-warning)'],
  ];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 10, flexWrap: 'wrap' }}>
        <div>
          <span style={{ fontFamily: 'var(--font-score)', fontSize: 28, fontWeight: 700, color: getBandColor(band) }}>{band}</span>
          <span style={{ fontSize: 13, marginLeft: 10, color: passed ? 'var(--accent-success)' : 'var(--accent-danger)' }}>{passed ? 'Step goal met' : 'Step goal not met yet'}</span>
        </div>
        <button type="button" className="btn-secondary" onClick={onRetry} style={{ padding: '8px 16px', fontSize: 13 }}>Try again</button>
      </div>
      <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 12 }}>{e.feedback}</p>
      <AnnotatedText text={result.text} errors={e.errors ?? []} />
      {sections.map(([title, items, color]) => items?.length > 0 && (
        <div key={title} style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color, marginBottom: 6 }}>{title}</div>
          {items.map((item, i) => <div key={i} style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, paddingLeft: 10, borderLeft: `2px solid ${color}`, marginBottom: 5 }}>{item}</div>)}
        </div>
      ))}
      {e.modelAnswer && (
        <div style={{ padding: 12, borderRadius: 10, background: 'var(--bg-elevated)', marginBottom: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: colorHex, marginBottom: 5, display: 'flex', alignItems: 'center', gap: 5 }}><Sparkles size={12} /> Model answer</div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-line' }}>{e.modelAnswer}</p>
        </div>
      )}
      {e.errors?.length > 0 && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{e.errors.length} error(s) added to your <Link to="/error-bank" style={{ color: colorHex }}>Error Bank</Link>.</div>}
      <Outcome result={result} colorHex={colorHex} />
    </div>
  );
}

function AiDrill({ drill, colorHex }) {
  const { payload, type } = drill;
  const isSpeaking = type === 'ai_speaking';
  const needsPrep = !!payload.prepSeconds;
  const [stage, setStage] = useState(needsPrep ? 'ready' : 'answer');
  const [notes, setNotes] = useState('');
  const [text, setText] = useState('');
  const [finishing, setFinishing] = useState(false);
  const [result, setResult] = useState(null);
  const submit = useDrillSubmit(drill.slug);
  const textRef = useRef('');
  const updateText = (value) => { textRef.current = value; setText(value); };
  const speech = useSpeechInput(chunk => updateText(textRef.current ? `${textRef.current} ${chunk}` : chunk));

  const handleSubmit = async () => {
    setFinishing(true);
    await speech.finish();
    setFinishing(false);
    const submitted = textRef.current;
    submit.mutate({ text: submitted }, { onSuccess: data => setResult({ ...data, text: submitted }) });
  };

  const prepLeft = useCountdown(payload.prepSeconds ?? 0, stage === 'prep', () => setStage('answer'));
  const speakLeft = useCountdown(payload.speakSeconds ?? 0, stage === 'answer' && speech.listening && !!payload.speakSeconds, speech.stop);

  const words = wordCount(text);
  const minWords = payload.minWords ?? 5;

  if (result) return <AiFeedback result={result} colorHex={colorHex} onRetry={() => { setResult(null); updateText(''); setStage(needsPrep ? 'ready' : 'answer'); }} />;

  return (
    <div>
      <div style={{ padding: '14px 16px', background: 'var(--bg-elevated)', borderRadius: 12, marginBottom: 14 }}>
        <p style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.7, whiteSpace: 'pre-line' }}>{payload.task ?? payload.question}</p>
        {payload.cuePoints && <ul style={{ margin: '8px 0 0 18px', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{payload.cuePoints.map(p => <li key={p}>{p}</li>)}</ul>}
        {payload.context && <pre style={{ marginTop: 10, fontFamily: 'ui-monospace, Consolas, monospace', fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{payload.context}</pre>}
      </div>

      {stage === 'ready' && <PrimaryButton colorHex={colorHex} onClick={() => setStage('prep')}>Start {payload.prepSeconds}-second preparation</PrimaryButton>}

      {stage === 'prep' && (
        <div>
          <div style={{ marginBottom: 10 }}><ClockBadge seconds={prepLeft} urgentAt={10} /></div>
          <textarea className="input-dark" aria-label="Preparation notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Keywords only: one box for each cue point" style={{ minHeight: 110, resize: 'vertical', marginBottom: 10 }} />
          <button type="button" className="btn-secondary" onClick={() => setStage('answer')} style={{ padding: '9px 16px', fontSize: 13 }}>I'm ready to answer</button>
        </div>
      )}

      {stage === 'answer' && (
        <div>
          {notes && <div style={{ padding: '10px 12px', borderRadius: 10, background: 'var(--bg-elevated)', fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'pre-line', marginBottom: 10 }}>{notes}</div>}
          {isSpeaking && speech.supported && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <button type="button" onClick={speech.listening ? speech.stop : speech.start} className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 16px', fontSize: 13, color: speech.listening ? 'var(--accent-danger)' : colorHex }}>
                {speech.listening ? <><Square size={13} /> Stop recording</> : <><Mic size={14} /> Start recording</>}
              </button>
              {speech.listening && payload.speakSeconds && <ClockBadge seconds={speakLeft} urgentAt={15} />}
            </div>
          )}
          <textarea className="input-dark" aria-label="Your response" value={text} onChange={e => updateText(e.target.value)} placeholder={isSpeaking ? (speech.supported ? 'Your words appear here. You can correct or type them.' : 'Voice input is not available here. Type what you would say.') : 'Write your response here…'} style={{ minHeight: 130, resize: 'vertical', marginBottom: 8 }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <span style={{ fontSize: 12, fontFamily: 'var(--font-score)', color: words >= minWords ? 'var(--accent-success)' : 'var(--text-muted)' }}>{words} / {minWords}+ words</span>
            <PrimaryButton colorHex={colorHex} pending={submit.isPending || finishing} pendingLabel="Claude is reviewing…" disabled={submit.isPending || finishing || words < minWords} onClick={handleSubmit}>Submit for evaluation</PrimaryButton>
          </div>
          {submit.isPending && <StagedLoader stages={isSpeaking ? SPEAKING_STAGES : WRITING_STAGES} colorHex={colorHex} />}
        </div>
      )}
    </div>
  );
}

const RUNNERS = { quiz: QuizDrill, timed_passage: TimedPassageDrill, adaptive_quiz: AdaptiveDrill, ai_writing: AiDrill, ai_speaking: AiDrill };

export default function DrillCard({ drill, colorHex }) {
  const Runner = RUNNERS[drill.type];

  return (
    <section style={{ background: 'var(--bg-card)', border: `1px solid ${drill.passed ? `${colorHex}40` : 'var(--border)'}`, borderRadius: 14, padding: '18px 20px', marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 6 }}>
        <h3 style={{ fontSize: 15, fontFamily: 'var(--font-display)' }}>{drill.title}</h3>
        {drill.passed && <span style={{ fontSize: 12, fontWeight: 600, color: colorHex, background: `${colorHex}15`, padding: '2px 8px', borderRadius: 99, flexShrink: 0 }}>Passed</span>}
      </div>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 14 }}>{drill.instructions}</p>
      <Runner drill={drill} colorHex={colorHex} />
    </section>
  );
}
