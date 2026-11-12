import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Bell, CheckCircle, ArrowRight, Clock } from 'lucide-react';
import { TARGET_BANDS } from '../data/skills';
import { toast } from '../components/common/Toast';
import { useMutation } from '@tanstack/react-query';
import api from '../lib/axios';
import { useAppStore } from '../store/useAppStore';
import logo from '../assets/logo-removebg-preview.png';

const PLANS = [
  {
    weeks: 2,
    label: '2 Weeks',
    subtitle: 'Intensive',
    description: 'Fast-track preparation for an upcoming exam.',
    lessonsPerDay: '2 lessons/day',
    color: '#D5301F',
    emoji: '⚡',
  },
  {
    weeks: 4,
    label: '4 Weeks',
    subtitle: 'Balanced',
    description: 'Steady progress with manageable daily targets.',
    lessonsPerDay: '1 lesson/day',
    color: '#6A35E8',
    emoji: '🎯',
    recommended: true,
  },
  {
    weeks: 8,
    label: '8 Weeks',
    subtitle: 'Relaxed',
    description: 'Deep learning with plenty of practice time.',
    lessonsPerDay: '1 lesson every 2 days',
    color: '#0A7F5C',
    emoji: '🌱',
  },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const updateUser = useAppStore(s => s.updateUser);
  const user = useAppStore(s => s.user);

  const [step, setStep] = useState(1);
  const [selectedWeeks, setSelectedWeeks] = useState(4);
  const [targetBand, setTargetBand] = useState(Number(user?.target_band ?? 7));
  const [reminderTime, setReminderTime] = useState('08:00');
  const [reminderEnabled, setReminderEnabled] = useState(true);

  const { mutate: savePlan, isPending } = useMutation({
    mutationFn: (data) => api.post('/study-plan', data).then(r => r.data),
    onSuccess: ({ user: updatedUser }) => {
      updateUser(updatedUser);
      navigate('/dashboard');
    },
    onError: (err) => toast(err.response?.data?.message && !err.response.data.message.startsWith('SQLSTATE') ? err.response.data.message : 'We could not save your plan. Please try again.', 'error'),
  });

  const handleFinish = () => {
    savePlan({ study_weeks: selectedWeeks, reminder_time: reminderTime, reminder_enabled: reminderEnabled, target_band: targetBand });
  };

  const handleSkip = () => {
    savePlan({ study_weeks: 4, reminder_time: '08:00', reminder_enabled: false });
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 20px' }}>
      {/* Ambient bg */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(124,58,237,0.15) 0%, transparent 60%)' }} />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 520 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img src={logo} alt="Smart IELTS" style={{ height: 36, objectFit: 'contain' }} />
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 32 }}>
          {[1, 2].map(s => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: step >= s ? 'var(--accent-primary)' : 'var(--bg-elevated)',
                border: `2px solid ${step >= s ? 'var(--accent-primary)' : 'var(--border)'}`,
                fontSize: 12, fontWeight: 700, color: step >= s ? 'white' : 'var(--text-muted)',
                transition: 'all 0.3s',
              }}>
                {step > s ? <CheckCircle size={14} /> : s}
              </div>
              {s < 2 && <div style={{ width: 40, height: 2, background: step > s ? 'var(--accent-primary)' : 'var(--border)', borderRadius: 99, transition: 'all 0.3s' }} />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: '28px 28px' }}>
                <div style={{ marginBottom: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <Calendar size={18} style={{ color: 'var(--accent-primary)' }} />
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, margin: 0 }}>Choose your study plan</h2>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
                    Hi {user?.name?.split(' ')[0]}! How long do you have to prepare for IELTS?
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                  {PLANS.map(plan => (
                    <button key={plan.weeks} onClick={() => setSelectedWeeks(plan.weeks)}
                      style={{
                        width: '100%', padding: '16px 18px', borderRadius: 14, cursor: 'pointer', textAlign: 'left',
                        background: selectedWeeks === plan.weeks ? `${plan.color}10` : 'var(--bg-elevated)',
                        border: `2px solid ${selectedWeeks === plan.weeks ? plan.color : 'var(--border)'}`,
                        transition: 'all 0.2s', position: 'relative',
                      }}>
                      {plan.recommended && (
                        <span style={{ position: 'absolute', top: -10, right: 14, fontSize: 12, fontWeight: 700, background: plan.color, color: 'white', padding: '2px 10px', borderRadius: 99 }}>
                          RECOMMENDED
                        </span>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 24 }}>{plan.emoji}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                            <span style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, whiteSpace: 'nowrap', color: selectedWeeks === plan.weeks ? plan.color : 'var(--text-primary)' }}>
                              {plan.label}
                            </span>
                            <span style={{ fontSize: 12, color: 'var(--text-muted)', background: 'var(--bg-card)', padding: '1px 8px', borderRadius: 99 }}>
                              {plan.subtitle}
                            </span>
                          </div>
                          <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{plan.description}</p>
                          <span style={{ display: 'inline-block', marginTop: 6, fontSize: 12, fontWeight: 700, color: plan.color, background: `${plan.color}15`, padding: '3px 8px', borderRadius: 8 }}>
                            {plan.lessonsPerDay}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>University target band</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>The overall IELTS score your programme requires. You can change it later.</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {TARGET_BANDS.map(band => (
                      <button key={band} type="button" aria-pressed={targetBand === band} onClick={() => setTargetBand(band)} style={{ padding: '7px 11px', borderRadius: 8, cursor: 'pointer', fontFamily: 'var(--font-score)', fontSize: 13, fontWeight: 700, color: targetBand === band ? 'var(--accent-glow)' : 'var(--text-secondary)', background: targetBand === band ? 'rgba(124,58,237,0.2)' : 'var(--bg-elevated)', border: `1px solid ${targetBand === band ? 'var(--accent-primary)' : 'var(--border)'}` }}>
                        {band.toFixed(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <button className="btn-primary" onClick={() => setStep(2)}
                  style={{ width: '100%', padding: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 15 }}>
                  Continue <ArrowRight size={16} />
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: '28px 28px' }}>
                <div style={{ marginBottom: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <Bell size={18} style={{ color: 'var(--accent-primary)' }} />
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, margin: 0 }}>Set your daily reminder</h2>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
                    We'll send you a daily email at your chosen time to keep you on track.
                  </p>
                </div>

                {/* Summary card */}
                <div style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 12, padding: '14px 16px', marginBottom: 22, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <CheckCircle size={16} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                      {PLANS.find(p => p.weeks === selectedWeeks)?.label} plan — {PLANS.find(p => p.weeks === selectedWeeks)?.lessonsPerDay}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Every core lesson, from the diagnostic to Reading, Listening, Writing & Speaking mastery</div>
                  </div>
                </div>

                {/* Reminder toggle */}
                <div style={{ marginBottom: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Bell size={14} style={{ color: 'var(--text-secondary)' }} />
                      <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>Email reminders</span>
                    </div>
                    <button data-compact aria-label="Toggle email reminders" aria-pressed={reminderEnabled} onClick={() => setReminderEnabled(e => !e)} style={{
                      width: 42, height: 24, borderRadius: 99, border: 'none', cursor: 'pointer', transition: 'all 0.2s', position: 'relative',
                      background: reminderEnabled ? 'var(--accent-primary)' : 'var(--bg-elevated)',
                    }}>
                      <div style={{
                        position: 'absolute', top: 3, left: reminderEnabled ? 21 : 3,
                        width: 18, height: 18, borderRadius: '50%', background: 'white', transition: 'left 0.2s',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                      }} />
                    </button>
                  </div>

                  {reminderEnabled && (
                    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
                      <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>
                        <Clock size={12} style={{ display: 'inline', marginRight: 5 }} />
                        Reminder time (sent to {user?.email})
                      </label>
                      <input type="time" value={reminderTime} onChange={e => setReminderTime(e.target.value)}
                        className="input-dark" style={{ fontSize: 15, fontFamily: 'var(--font-score)' }} />
                    </motion.div>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <button className="btn-primary" onClick={handleFinish} disabled={isPending}
                    style={{ width: '100%', padding: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 15 }}>
                    {isPending ? 'Setting up...' : <><CheckCircle size={16} /> Start My Plan</>}
                  </button>
                  <button onClick={handleSkip} disabled={isPending}
                    style={{ width: '100%', padding: 12, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 13 }}>
                    Skip for now
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
